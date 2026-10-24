import os
import glob
import json
import re
import app

def build_standalone():
    print("Building standalone HTML file with LocalStorage & GitHub Pages compatibility...")
    chats = app.load_all_chats()
    
    with open('templates/index.html', 'r', encoding='utf-8') as f:
        html = f.read()
    with open('static/style.css', 'r', encoding='utf-8') as f:
        css = f.read()
    with open('static/app.js', 'r', encoding='utf-8') as f:
        js = f.read()

    adapter_code = f"""
// ====================================================
// STANDALONE / GITHUB PAGES ADAPTER
// Supports Offline Play, LocalStorage Persistence & Direct JSON Export
// ====================================================

const INITIAL_CHATS = {json.dumps(chats, ensure_ascii=False)};
const STORAGE_KEY = 'BUMBLE_SIM_CHATS_V2';

// Load chats from LocalStorage if user previously edited or created cases
function getStoredChats() {{
  try {{
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {{
      return JSON.parse(saved);
    }}
  }} catch (e) {{
    console.warn('LocalStorage error:', e);
  }}
  return JSON.parse(JSON.stringify(INITIAL_CHATS));
}}

let EMBEDDED_CHATS = getStoredChats();

function saveStoredChats() {{
  try {{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(EMBEDDED_CHATS));
  }} catch (e) {{
    console.warn('Cannot save to localStorage:', e);
  }}
}}

// Standalone override: loadScenario (Offline & Client-Side)
async function loadScenario(params = {{}}) {{
  isAnswerRevealed = false;
  removeTypingBubble();
  chatInputEl.value = '';
  chatInputEl.disabled = false;
  btnSendEl.classList.add('disabled');

  const availableChats = Object.values(EMBEDDED_CHATS).filter(c => c.mid_turn_indices && c.mid_turn_indices.length > 0);
  if (!availableChats.length) return;

  let targetChat = availableChats[Math.floor(Math.random() * availableChats.length)];
  if (params.chat_id && EMBEDDED_CHATS[params.chat_id]) {{
    targetChat = EMBEDDED_CHATS[params.chat_id];
  }}

  const myTurns = targetChat.my_turn_indices || [];
  const midTurns = targetChat.mid_turn_indices || [];
  let blockIdx;
  if (params.block_idx !== undefined) {{
    blockIdx = parseInt(params.block_idx);
  }} else if (params.mode === 'first') {{
    blockIdx = (midTurns.length > 0) ? midTurns[0] : (myTurns[0] || 0);
  }} else {{
    blockIdx = (midTurns.length > 0) ? midTurns[Math.floor(Math.random() * midTurns.length)] : (myTurns[0] || 0);
  }}

  currentChatId = targetChat.id;
  partnerName = targetChat.name;
  currentBlocks = targetChat.blocks || [];
  currentBlockIdx = blockIdx;
  totalTurns = myTurns.length || 1;
  currentTurnNumber = (myTurns.indexOf(blockIdx) !== -1) ? myTurns.indexOf(blockIdx) + 1 : 1;

  partnerNameEl.textContent = partnerName;
  if (cinemaPartnerNameEl) cinemaPartnerNameEl.textContent = partnerName;
  avatarTextEl.textContent = (partnerName || 'A').charAt(0).toUpperCase();

  const turnText = `Lượt ${{currentTurnNumber}} / ${{totalTurns}}`;
  turnCounterEl.textContent = turnText;
  if (cinemaTurnProgressEl) cinemaTurnProgressEl.textContent = turnText;

  const historyBlocks = currentBlocks.slice(0, currentBlockIdx);
  renderHistory(historyBlocks);

  setTimeout(() => {{
    chatInputEl.focus();
  }}, 120);
}}

// Standalone override: Admin open & load & save
async function openAdminModal() {{
  if (!adminModal) return;
  adminModal.classList.remove('hidden');
  adminViewPane.classList.remove('hidden');
  adminCreatePane.classList.add('hidden');

  const chats = Object.values(EMBEDDED_CHATS).map(c => ({{
    id: c.id,
    name: c.name,
    total_messages: c.total_messages,
    total_turns: c.total_turns
  }}));

  adminListItems.innerHTML = '';
  chats.forEach((chat, idx) => {{
    const item = document.createElement('div');
    item.className = 'admin-chat-item';
    item.dataset.id = chat.id;
    if (chat.id === currentChatId || (!currentChatId && idx === 0)) {{
      item.classList.add('active');
    }}
    item.innerHTML = `
      <span><strong>${{escapeHtml(chat.name)}}</strong></span>
      <span class="admin-chat-badge">${{chat.total_messages}} tin</span>
    `;
    item.addEventListener('click', () => {{
      document.querySelectorAll('.admin-chat-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      loadAdminChatView(chat.id);
    }});
    adminListItems.appendChild(item);
  }});

  const targetId = currentChatId || (chats.length > 0 ? chats[0].id : null);
  if (targetId) {{
    loadAdminChatView(targetId);
  }}

  // Show reset button in footer if storage modified
  renderAdminFooterResetBtn();
}}

async function loadAdminChatView(cId) {{
  adminCurrentChatId = cId;
  const chat = EMBEDDED_CHATS[cId];
  if (!chat) return;

  adminPartnerName = chat.name || 'Đối phương';
  adminCurrentMessages = JSON.parse(JSON.stringify(chat.raw_messages || []));

  adminViewPartnerName.textContent = adminPartnerName;
  adminViewCount.textContent = `${{adminCurrentMessages.length}} tin nhắn (${{chat.total_turns || 0}} lượt rep)`;
  if (optPartnerName) optPartnerName.textContent = `Đối phương (${{adminPartnerName}})`;

  renderAdminMessageCards();
}}

// Helper: Download JSON file directly to user device
function downloadJsonFile(filename, dataObj) {{
  const blob = new Blob([JSON.stringify(dataObj, null, 2)], {{ type: 'application/json;charset=utf-8;' }});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}}

// Standalone Helper: Rebuild chat blocks from messages
function rebuildChatBlocks(chatObj) {{
  const blocks = [];
  let currentBlock = null;
  for (const m of chatObj.raw_messages) {{
    const sender = m.nguoi_gui || '';
    const isMe = (sender === 'Anh Hoang' || sender === 'Mình');
    if (currentBlock === null || currentBlock.is_me !== isMe) {{
      if (currentBlock !== null) blocks.push(currentBlock);
      currentBlock = {{
        block_id: blocks.length,
        is_me: isMe,
        sender: isMe ? 'Mình' : chatObj.name,
        messages: [m]
      }};
    }} else {{
      currentBlock.messages.push(m);
    }}
  }}
  if (currentBlock !== null) blocks.push(currentBlock);
  chatObj.blocks = blocks;
  chatObj.my_turn_indices = blocks.map((b, i) => b.is_me ? i : -1).filter(i => i !== -1);
  chatObj.mid_turn_indices = chatObj.my_turn_indices.filter(i => i > 0);
  chatObj.total_turns = chatObj.my_turn_indices.length;
  chatObj.total_messages = chatObj.raw_messages.length;
}}

// Standalone Override: Save to Database (LocalStorage + Download JSON option)
if (btnAdminSaveDb) {{
  btnAdminSaveDb.addEventListener('click', async (e) => {{
    e.stopImmediatePropagation();
    if (!adminCurrentChatId || !EMBEDDED_CHATS[adminCurrentChatId]) return;

    btnAdminSaveDb.textContent = '⏳ Đang lưu...';
    btnAdminSaveDb.disabled = true;

    // Update in-memory EMBEDDED_CHATS
    adminCurrentMessages.forEach((m, idx) => {{ m.id = idx + 1; }});
    const chat = EMBEDDED_CHATS[adminCurrentChatId];
    chat.raw_messages = JSON.parse(JSON.stringify(adminCurrentMessages));
    chat.name = adminPartnerName;
    rebuildChatBlocks(chat);

    // Save to LocalStorage
    saveStoredChats();

    // Prepare JSON file format
    const exportData = {{
      "cuoc_tro_chuyen": {{
        "doi_tuong": adminPartnerName,
        "chu_thich_mau": {{
          "nen_trang": `Đối phương (${{adminPartnerName}})`,
          "nen_vang": "Mình (Anh Hoang)"
        }},
        "tin_nhan": chat.raw_messages
      }}
    }};

    setTimeout(() => {{
      btnAdminSaveDb.textContent = '✅ Đã lưu (LocalStorage)!';
      const badge = document.querySelector(`.admin-chat-item[data-id="${{adminCurrentChatId}}"] .admin-chat-badge`);
      if (badge) badge.textContent = `${{chat.total_messages}} tin`;
      
      // Also download JSON so user has file on disk if desired
      downloadJsonFile(`${{adminCurrentChatId}}.json`, exportData);

      setTimeout(() => {{
        btnAdminSaveDb.textContent = '💾 Lưu vào Database';
        btnAdminSaveDb.disabled = false;
      }}, 1600);
    }}, 400);
  }}, true);
}}

// Standalone Override: Create new Case (LocalStorage + Download)
if (btnSubmitCreateCase) {{
  btnSubmitCreateCase.addEventListener('click', async (e) => {{
    e.stopImmediatePropagation();
    const isJsonMode = tabJsonMode.classList.contains('active');
    let partnerNameVal = '';
    let rawMsgs = [];

    if (isJsonMode) {{
      const rawJson = createJsonTextarea.value.trim();
      if (!rawJson) {{
        alert('Vui lòng dán nội dung JSON!');
        return;
      }}
      try {{
        let parsed = JSON.parse(rawJson);
        if (parsed.cuoc_tro_chuyen) parsed = parsed.cuoc_tro_chuyen;
        partnerNameVal = parsed.doi_tuong || 'Bạn Mới';
        rawMsgs = parsed.tin_nhan || [];
      }} catch (err) {{
        alert('Định dạng JSON không hợp lệ: ' + err.message);
        return;
      }}
    }} else {{
      partnerNameVal = createFormName.value.trim();
      if (!partnerNameVal) {{
        alert('Vui lòng nhập tên đối tượng!');
        return;
      }}
      rawMsgs = createFormMessages;
    }}

    // Slugify name
    const slug = partnerNameVal.toLowerCase()
      .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'chat';
    
    let newId = `cuoc_tro_chuyen_${{slug}}`;
    let count = 2;
    while (EMBEDDED_CHATS[newId]) {{
      newId = `cuoc_tro_chuyen_${{slug}}_${{count}}`;
      count++;
    }}

    const newChat = {{
      id: newId,
      name: partnerNameVal,
      total_messages: rawMsgs.length,
      raw_messages: rawMsgs,
      blocks: [],
      my_turn_indices: [],
      mid_turn_indices: [],
      total_turns: 0
    }};

    rebuildChatBlocks(newChat);
    EMBEDDED_CHATS[newId] = newChat;
    saveStoredChats();

    // Trigger download of the new json file
    const exportData = {{
      "cuoc_tro_chuyen": {{
        "doi_tuong": partnerNameVal,
        "chu_thich_mau": {{
          "nen_trang": `Đối phương (${{partnerNameVal}})`,
          "nen_vang": "Mình (Anh Hoang)"
        }},
        "tin_nhan": rawMsgs
      }}
    }};
    downloadJsonFile(`${{newId}}.json`, exportData);

    alert(`✅ Đã tạo case mới "${{partnerNameVal}}" thành công! (Đã lưu vào bộ nhớ & tải file JSON về máy)`);

    await openAdminModal();
    loadAdminChatView(newId);
  }}, true);
}}

function renderAdminFooterResetBtn() {{
  const footer = document.querySelector('.admin-footer');
  if (!footer) return;
  let resetBtn = document.getElementById('btnResetDefaultChats');
  if (!resetBtn) {{
    resetBtn = document.createElement('button');
    resetBtn.id = 'btnResetDefaultChats';
    resetBtn.style.cssText = 'margin-left: 14px; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #FCA5A5; font-size: 11.5px; padding: 4px 10px; border-radius: 6px; cursor: pointer;';
    resetBtn.textContent = '🔄 Khôi phục 19 case gốc';
    resetBtn.title = 'Xóa các chỉnh sửa trong LocalStorage và khôi phục về dữ liệu ban đầu';
    resetBtn.addEventListener('click', () => {{
      if (confirm('Bạn có chắc muốn xóa các chỉnh sửa cá nhân và khôi phục về 19 cuộc trò chuyện gốc ban đầu?')) {{
        localStorage.removeItem(STORAGE_KEY);
        EMBEDDED_CHATS = JSON.parse(JSON.stringify(INITIAL_CHATS));
        alert('Đã khôi phục dữ liệu gốc!');
        openAdminModal();
        loadScenario();
      }}
    }});
    footer.appendChild(resetBtn);
  }}
}}
"""

    # Filter out functions from app.js that are overridden in standalone adapter
    lines = js.splitlines()
    filtered_js = []
    skip = False
    for line in lines:
        if line.startswith('async function loadScenario(') or line.startswith('async function openAdminModal(') or line.startswith('async function loadAdminChatView('):
            skip = True
        if skip:
            if line.startswith('}') and not line.startswith('} catch') and not line.startswith('} else'):
                skip = False
            continue
        filtered_js.append(line)

    combined_js = adapter_code + "\n" + "\n".join(filtered_js)

    # Robust regex replacements (using lambdas to avoid backslash escaping issues in re.sub)
    standalone_html = re.sub(r'<link[^>]*rel=["\']stylesheet["\'][^>]*>', lambda m: f'<style>\n{css}\n</style>', html)
    standalone_html = re.sub(r'<script[^>]*src=["\'][^"\']*app\.js[^"\']*["\'][^>]*></script>', lambda m: f'<script>\n{combined_js}\n</script>', standalone_html)

    # Output both Bumble_Sim.html AND index.html (for GitHub Pages root)
    with open('Bumble_Sim.html', 'w', encoding='utf-8') as f:
        f.write(standalone_html)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(standalone_html)
    print("Exported Bumble_Sim.html and index.html successfully!")

if __name__ == '__main__':
    build_standalone()
