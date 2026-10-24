import os
import glob
import json
import random
import webbrowser
import threading
import unicodedata
import re
import sys
from flask import Flask, jsonify, request, send_from_directory, render_template

# Support PyInstaller standalone packaging
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
    BUNDLE_DIR = getattr(sys, '_MEIPASS', BASE_DIR)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    BUNDLE_DIR = BASE_DIR

static_folder = os.path.join(BUNDLE_DIR, 'static')
template_folder = os.path.join(BUNDLE_DIR, 'templates')

app = Flask(__name__, static_folder=static_folder, template_folder=template_folder)
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

def slugify_vn(text):
    text = unicodedata.normalize('NFKD', text)
    text = re.sub(r'[\u0300-\u036f]', '', text)
    text = text.replace('đ', 'd').replace('Đ', 'D')
    text = re.sub(r'[^a-zA-Z0-9]+', '_', text).strip('_').lower()
    return text if text else 'chat'

def load_all_chats():
    chats = {}
    pattern = os.path.join(BASE_DIR, 'cuoc_tro_chuyen_*.json')
    files = sorted(glob.glob(pattern))
    
    for file_path in files:
        file_id = os.path.splitext(os.path.basename(file_path))[0]
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            ctc = data.get('cuoc_tro_chuyen', {})
            raw_name = ctc.get('doi_tuong')
            color_notes = ctc.get('chu_thich_mau', {})
            msgs = ctc.get('tin_nhan', [])
            
            # Identify other person's name
            other_names = [m.get('nguoi_gui') for m in msgs if m.get('nguoi_gui') not in ['Anh Hoang', 'Mình']]
            display_name = raw_name if raw_name else (other_names[0] if other_names else file_id.replace('cuoc_tro_chuyen_', '').capitalize())
            
            # Group into blocks of consecutive messages from same side
            blocks = []
            current_block = None
            for m in msgs:
                sender = m.get('nguoi_gui', '')
                is_me = (sender in ['Anh Hoang', 'Mình'])
                
                if current_block is None or current_block['is_me'] != is_me:
                    if current_block is not None:
                        blocks.append(current_block)
                    current_block = {
                        'block_id': len(blocks),
                        'is_me': is_me,
                        'sender': 'Mình' if is_me else display_name,
                        'messages': [m]
                    }
                else:
                    current_block['messages'].append(m)
            if current_block is not None:
                blocks.append(current_block)
                
            # Collect scenario indexes (every block where is_me is True)
            my_turn_indices = [i for i, b in enumerate(blocks) if b['is_me']]
            
            # Filter out opening/starting messages (block_idx > 0)
            mid_turn_indices = [i for i in my_turn_indices if i > 0]
            
            chats[file_id] = {
                'id': file_id,
                'name': display_name,
                'total_messages': len(msgs),
                'total_turns': len(my_turn_indices),
                'blocks': blocks,
                'raw_messages': msgs,
                'my_turn_indices': my_turn_indices,
                'mid_turn_indices': mid_turn_indices if mid_turn_indices else my_turn_indices,
                'color_notes': color_notes
            }
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
            
    return chats

# Cache in memory
CHATS = load_all_chats()

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/chats')
def get_chats():
    result = []
    for cid, chat in CHATS.items():
        result.append({
            'id': cid,
            'name': chat['name'],
            'total_messages': chat['total_messages'],
            'total_turns': chat['total_turns']
        })
    return jsonify(result)

@app.route('/api/scenario')
def get_scenario():
    """
    Get a scenario. Does NOT pick the opening/start message (block_idx > 0).
    Returns ALL blocks of the chat so client can smoothly progress until the end of the file!
    """
    global CHATS
    chat_id = request.args.get('chat_id')
    mode = request.args.get('mode', 'random')
    
    # Filter candidate chats
    available_chats = [c for c in CHATS.values() if len(c['mid_turn_indices']) > 0]
    if not available_chats:
        available_chats = [c for c in CHATS.values() if len(c['my_turn_indices']) > 0]
        
    if not available_chats:
        return jsonify({'error': 'No chat data found'}), 404
        
    if chat_id and chat_id in CHATS:
        target_chat = CHATS[chat_id]
    else:
        target_chat = random.choice(available_chats)
        
    my_turns = target_chat['my_turn_indices']
    mid_turns = target_chat['mid_turn_indices']
    
    block_idx_arg = request.args.get('block_idx')
    
    if block_idx_arg is not None:
        block_idx = int(block_idx_arg)
    elif mode == 'first':
        block_idx = mid_turns[0] if mid_turns else my_turns[0]
    else: # random: ALWAYS pick a turn after opening (has prior messages)
        block_idx = random.choice(mid_turns) if mid_turns else random.choice(my_turns)
        
    current_turn_number = my_turns.index(block_idx) + 1 if block_idx in my_turns else 1
    
    return jsonify({
        'chat_id': target_chat['id'],
        'partner_name': target_chat['name'],
        'start_block_idx': block_idx,
        'turn_number': current_turn_number,
        'total_turns': len(my_turns),
        'blocks': target_chat['blocks']
    })

@app.route('/api/admin/chat')
def admin_get_chat():
    chat_id = request.args.get('chat_id')
    if not chat_id or chat_id not in CHATS:
        return jsonify({'error': 'Chat not found'}), 404
    chat = CHATS[chat_id]
    return jsonify({
        'id': chat['id'],
        'name': chat['name'],
        'total_messages': chat['total_messages'],
        'total_turns': chat['total_turns'],
        'raw_messages': chat.get('raw_messages', []),
        'blocks': chat['blocks']
    })

@app.route('/api/admin/save_chat', methods=['POST'])
def admin_save_chat():
    global CHATS
    data = request.get_json() or {}
    chat_id = data.get('chat_id')
    doi_tuong = data.get('doi_tuong', 'Đối tượng')
    raw_messages = data.get('raw_messages', [])

    if not chat_id:
        return jsonify({'error': 'Thiếu chat_id'}), 400

    file_path = os.path.join(BASE_DIR, f"{chat_id}.json")
    save_data = {
        "cuoc_tro_chuyen": {
            "doi_tuong": doi_tuong,
            "chu_thich_mau": {
                "nen_trang": f"Đối phương ({doi_tuong})",
                "nen_vang": "Mình (Anh Hoang)"
            },
            "tin_nhan": raw_messages
        }
    }

    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, ensure_ascii=False, indent=2)
        CHATS = load_all_chats()
        return jsonify({'success': True, 'message': 'Đã lưu thay đổi vào database thành công!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/create_chat', methods=['POST'])
def admin_create_chat():
    global CHATS
    data = request.get_json() or {}
    format_type = data.get('format_type', 'form')
    
    if format_type == 'json':
        raw_json_str = data.get('json_content', '')
        try:
            parsed = json.loads(raw_json_str) if isinstance(raw_json_str, str) else raw_json_str
            if 'cuoc_tro_chuyen' not in parsed:
                parsed = {'cuoc_tro_chuyen': parsed}
            doi_tuong = parsed['cuoc_tro_chuyen'].get('doi_tuong', 'Ban_Moi')
            save_data = parsed
        except Exception as err:
            return jsonify({'error': f'JSON không hợp lệ: {err}'}), 400
    else:
        doi_tuong = data.get('doi_tuong', '').strip()
        if not doi_tuong:
            return jsonify({'error': 'Vui lòng nhập tên đối tượng'}), 400
        raw_messages = data.get('messages', [])
        save_data = {
            "cuoc_tro_chuyen": {
                "doi_tuong": doi_tuong,
                "chu_thich_mau": {
                    "nen_trang": f"Đối phương ({doi_tuong})",
                    "nen_vang": "Mình (Anh Hoang)"
                },
                "tin_nhan": raw_messages
            }
        }

    slug = slugify_vn(doi_tuong)
    base_name = f"cuoc_tro_chuyen_{slug}"
    file_path = os.path.join(BASE_DIR, f"{base_name}.json")
    counter = 2
    while os.path.exists(file_path):
        file_path = os.path.join(BASE_DIR, f"{base_name}_{counter}.json")
        counter += 1

    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, ensure_ascii=False, indent=2)
        CHATS = load_all_chats()
        new_chat_id = os.path.splitext(os.path.basename(file_path))[0]
        return jsonify({
            'success': True,
            'chat_id': new_chat_id,
            'message': f'Đã tạo case mới "{doi_tuong}" thành công!'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def open_browser():
    webbrowser.open_new('http://127.0.0.1:5050')

if __name__ == '__main__':
    print("=====================================================")
    print("  Bumble Dating Chat Simulator - TANGAISIM")
    print("  Server running at: http://127.0.0.1:5050")
    print("=====================================================")
    threading.Timer(1.2, open_browser).start()
    app.run(host='127.0.0.1', port=5050, debug=False)
