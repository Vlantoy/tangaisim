// ====================================================
// BUMBLE DATING SIMULATOR - TANGAISIM
// Cinema View 9:16 + Seamless Chronological Chat Loop + Admin Manager
// ====================================================

// State Variables
let currentChatId = null;
let currentBlocks = [];
let currentBlockIdx = 0;
let currentTurnNumber = 1;
let totalTurns = 1;
let partnerName = 'Annie';
let isAnswerRevealed = false;

// DOM Elements
const btnBackRandom = document.getElementById('btnBackRandom');
const btnRandomCase = document.getElementById('btnRandomCase');
const btnRestartChat = document.getElementById('btnRestartChat');
const partnerNameEl = document.getElementById('partnerName');
const cinemaPartnerNameEl = document.getElementById('cinemaPartnerName');
const avatarTextEl = document.getElementById('avatarText');
const turnCounterEl = document.getElementById('turnCounter');
const cinemaTurnProgressEl = document.getElementById('cinemaTurnProgress');
const chatBodyEl = document.getElementById('chatBody');
const inputPillEl = document.getElementById('inputPill');
const chatInputEl = document.getElementById('chatInput');
const btnSendEl = document.getElementById('btnSend');
const statusClockEl = document.getElementById('statusClock');

// Live Phone Clock
function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  if (statusClockEl) statusClockEl.textContent = `${hours}:${minutes}`;
}
setInterval(updateClock, 30000);
updateClock();

// Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Shake input alert
function triggerEmptyAlert() {
  if (inputPillEl) {
    inputPillEl.classList.remove('shake');
    void inputPillEl.offsetWidth;
    inputPillEl.classList.add('shake');
  }
  chatInputEl.placeholder = "⚠️ Nhập câu rep của bạn trước!";
  chatInputEl.focus();
  setTimeout(() => {
    chatInputEl.placeholder = "Nhập câu rep của bạn để gửi...";
  }, 1800);
}

// Helper: 3 dots typing bubble
function showTypingBubble() {
  removeTypingBubble();
  const bubble = document.createElement('div');
  bubble.className = 'real-typing-bubble';
  bubble.id = 'realTypingBubble';
  bubble.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  chatBodyEl.appendChild(bubble);
  scrollToBottom();
}

function removeTypingBubble() {
  const el = document.getElementById('realTypingBubble');
  if (el) el.remove();
}

// Scroll chat body to bottom
function scrollToBottom(smooth = true) {
  setTimeout(() => {
    chatBodyEl.scrollTo({
      top: chatBodyEl.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, 30);
}

// Helper: Create message bubble group element
function createMessageGroupElement(block, customClass = '') {
  const groupEl = document.createElement('div');
  groupEl.className = `msg-group ${block.is_me ? 'me' : 'them'} ${customClass}`;

  (block.messages || []).forEach(msg => {
    const container = document.createElement('div');
    container.className = 'bubble-container';

    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'chat-bubble';

    // Quote preview if reply
    if (msg.tra_loi_cho) {
      const quoteBox = document.createElement('div');
      quoteBox.className = 'quote-box';
      quoteBox.innerHTML = `
        <span class="quote-sender">${escapeHtml(msg.tra_loi_cho.nguoi_gui || 'Tin nhắn')}: </span>
        <span class="quote-text">${escapeHtml(msg.tra_loi_cho.noi_dung || '')}</span>
      `;
      bubbleEl.appendChild(quoteBox);
    }

    if (msg.loai === 'image' || msg.loai === 'media') {
      const mediaSpan = document.createElement('div');
      mediaSpan.className = 'media-tag';
      mediaSpan.innerHTML = `🖼️ ${escapeHtml(msg.noi_dung || '[Hình ảnh]')}`;
      bubbleEl.appendChild(mediaSpan);
    } else if (msg.loai === 'gif') {
      const gifSpan = document.createElement('div');
      gifSpan.className = 'media-tag';
      gifSpan.innerHTML = `🎞️ ${escapeHtml(msg.noi_dung || '[GIF]')}`;
      bubbleEl.appendChild(gifSpan);
    } else if (msg.loai === 'voice') {
      const voiceSpan = document.createElement('div');
      voiceSpan.className = 'media-tag';
      voiceSpan.innerHTML = `🎙️ ${escapeHtml(msg.noi_dung || '[Tin nhắn thoại]')}`;
      bubbleEl.appendChild(voiceSpan);
    } else {
      bubbleEl.appendChild(document.createTextNode(msg.noi_dung || ''));
    }

    container.appendChild(bubbleEl);
    groupEl.appendChild(container);
  });

  return groupEl;
}

// Render History Messages (All blocks from index 0 up to currentBlockIdx - 1)
function renderHistory(blocksToRender) {
  chatBodyEl.innerHTML = '';

  const hint = document.createElement('div');
  hint.className = 'history-hint';
  hint.innerHTML = '<span>Scroll lên để đọc lại các tin nhắn trước</span>';
  chatBodyEl.appendChild(hint);

  let lastDate = null;

  blocksToRender.forEach(block => {
    block.messages.forEach(msg => {
      if (msg.ngay && msg.ngay !== lastDate) {
        lastDate = msg.ngay;
        const dateEl = document.createElement('div');
        dateEl.className = 'date-divider';
        dateEl.textContent = msg.ngay;
        chatBodyEl.appendChild(dateEl);
      }
    });

    const groupEl = createMessageGroupElement(block);
    chatBodyEl.appendChild(groupEl);
  });

  scrollToBottom(false);
}

// ====================================================
// LOAD SCENARIO
// ====================================================
async function loadScenario(params = {}) {
  isAnswerRevealed = false;
  removeTypingBubble();
  chatInputEl.value = '';
  chatInputEl.disabled = false;
  btnSendEl.classList.add('disabled');

  const query = new URLSearchParams({ mode: 'random', ...params }).toString();
  try {
    chatBodyEl.innerHTML = `<div class="notice-box">Đang nạp tình huống...</div>`;

    const res = await fetch(`/api/scenario?${query}`);
    const data = await res.json();

    if (data.error) {
      chatBodyEl.innerHTML = `<div class="notice-box" style="color:red;">${data.error}</div>`;
      return;
    }

    currentChatId = data.chat_id;
    partnerName = data.partner_name;
    currentBlocks = data.blocks || [];
    currentBlockIdx = data.start_block_idx;
    totalTurns = data.total_turns || 1;
    currentTurnNumber = data.turn_number || 1;

    // Header info
    partnerNameEl.textContent = partnerName;
    if (cinemaPartnerNameEl) cinemaPartnerNameEl.textContent = partnerName;
    avatarTextEl.textContent = (partnerName || 'A').charAt(0).toUpperCase();

    const turnText = `Lượt ${currentTurnNumber} / ${totalTurns}`;
    turnCounterEl.textContent = turnText;
    if (cinemaTurnProgressEl) cinemaTurnProgressEl.textContent = turnText;

    // Render history: all blocks strictly up to currentBlockIdx - 1
    const historyBlocks = currentBlocks.slice(0, currentBlockIdx);
    renderHistory(historyBlocks);

    setTimeout(() => {
      chatInputEl.focus();
    }, 120);

  } catch (err) {
    console.error('Lỗi nạp tình huống:', err);
    chatBodyEl.innerHTML = `<div class="notice-box" style="color:red;">Không thể nạp dữ liệu tình huống</div>`;
  }
}

// ====================================================
// CHAT LOOP: GỬI TIN & TIẾP TỤC ĐÚNG TRÌNH TỰ THỜI GIAN
// ====================================================
async function handleSendReply() {
  if (isAnswerRevealed) return;

  const userText = chatInputEl.value.trim();
  if (!userText) {
    triggerEmptyAlert();
    return;
  }

  isAnswerRevealed = true;
  chatInputEl.disabled = true;
  btnSendEl.classList.add('disabled');

  // 1. Render câu của người chơi (vàng, tag: 💬 Câu của bạn)
  const userBlock = {
    is_me: true,
    sender: 'Bạn',
    messages: [{ loai: 'text', noi_dung: userText }]
  };
  const userGroupEl = createMessageGroupElement(userBlock, 'user-reply-group');
  const userTag = document.createElement('div');
  userTag.className = 'bubble-tag tag-user';
  userTag.textContent = '💬 Câu của bạn';
  userGroupEl.querySelector('.bubble-container').prepend(userTag);
  userGroupEl.querySelector('.chat-bubble').classList.add('user-typed-bubble');
  chatBodyEl.appendChild(userGroupEl);

  // 2. Render đáp án thực tế từ database (vàng, tag: ⭐ Đáp án thực tế)
  const solutionBlock = currentBlocks[currentBlockIdx];
  if (solutionBlock && solutionBlock.messages) {
    const solGroupEl = createMessageGroupElement(solutionBlock, 'solution-reply-group');
    const solTag = document.createElement('div');
    solTag.className = 'bubble-tag tag-solution';
    solTag.textContent = '⭐ Đáp án thực tế';
    solGroupEl.querySelector('.bubble-container').prepend(solTag);
    chatBodyEl.appendChild(solGroupEl);
  }

  scrollToBottom();

  // 3. Hiệu ứng 3 chấm nảy nảy như thật (typing bubble)
  showTypingBubble();
  await new Promise(r => setTimeout(r, 850));
  removeTypingBubble();

  // 4. Kiểm tra khối tiếp theo theo đúng trình tự thời gian
  const nextIdx = currentBlockIdx + 1;

  if (nextIdx < currentBlocks.length) {
    // Có tin nhắn của đối phương tiếp theo trong file JSON!
    const partnerBlock = currentBlocks[nextIdx];
    const partnerGroupEl = createMessageGroupElement(partnerBlock);
    // Hoàn toàn tự nhiên, không gắn bất kỳ tag/note nào!
    chatBodyEl.appendChild(partnerGroupEl);
    scrollToBottom();

    // 5. Kiểm tra xem sau câu đối phương rep, trong JSON có còn lượt rep tiếp theo của Mình không?
    const subsequentIdx = nextIdx + 1;
    if (subsequentIdx < currentBlocks.length) {
      // VẪN CÒN LƯỢT REP TIẾP THEO: TỰ ĐỘNG TIẾP TỤC CASE LUÔN!
      currentBlockIdx = subsequentIdx;
      currentTurnNumber++;

      const turnText = `Lượt ${currentTurnNumber} / ${totalTurns}`;
      turnCounterEl.textContent = turnText;
      if (cinemaTurnProgressEl) cinemaTurnProgressEl.textContent = turnText;

      // Mở lại ô input và focus ngay lập tức để người chơi rep tiếp
      isAnswerRevealed = false;
      chatInputEl.value = '';
      chatInputEl.disabled = false;
      btnSendEl.classList.add('disabled');

      setTimeout(() => {
        chatInputEl.focus();
      }, 100);

    } else {
      // Cuộc trò chuyện trong JSON file thực sự kết thúc sau tin đối phương!
      const endNotice = document.createElement('div');
      endNotice.className = 'notice-box';
      endNotice.style.color = '#F59E0B';
      endNotice.style.marginTop = '18px';
      endNotice.innerHTML = `
        <div>🏁 <strong>Đã đến tin nhắn cuối cùng trong cuộc trò chuyện này.</strong></div>
        <div style="font-size: 13px; margin-top: 6px; opacity: 0.85;">
          Bấm <strong>🎲 Đổi case</strong> hoặc phím tắt <kbd>Ctrl + Enter</kbd> để qua tình huống khác.
        </div>
      `;
      chatBodyEl.appendChild(endNotice);
      scrollToBottom();
    }

  } else {
    // Cuộc trò chuyện trong JSON kết thúc ngay tại câu của Mình (đối phương không rep tiếp trong dữ liệu gốc)
    const endNotice = document.createElement('div');
    endNotice.className = 'notice-box';
    endNotice.style.color = '#F59E0B';
    endNotice.style.marginTop = '18px';
    endNotice.innerHTML = `
      <div>🏁 <strong>Cuộc trò chuyện kết thúc tại đây (đối phương không rep tiếp).</strong></div>
      <div style="font-size: 13px; margin-top: 6px; opacity: 0.85;">
        Bấm <strong>🎲 Đổi case</strong> hoặc phím tắt <kbd>Ctrl + Enter</kbd> để qua tình huống khác.
      </div>
    `;
    chatBodyEl.appendChild(endNotice);
    scrollToBottom();
  }
}

// ====================================================
// EVENT LISTENERS & SHORTCUTS
// ====================================================
chatInputEl.addEventListener('input', () => {
  const hasText = chatInputEl.value.trim().length > 0;
  btnSendEl.classList.toggle('disabled', !hasText);
});

btnSendEl.addEventListener('click', handleSendReply);

if (btnRandomCase) btnRandomCase.addEventListener('click', () => loadScenario());
if (btnBackRandom) btnBackRandom.addEventListener('click', () => loadScenario());

if (btnRestartChat) {
  btnRestartChat.addEventListener('click', () => {
    if (currentChatId) {
      loadScenario({ chat_id: currentChatId, mode: 'first' });
    }
  });
}

// Global Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  // 1. Ctrl + Enter (or Cmd + Enter): Random case mới
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    loadScenario();
    return;
  }

  // 2. Enter khi đang ở ô input (chưa rep): Gửi tin nhắn
  if (e.key === 'Enter' && document.activeElement === chatInputEl && !isAnswerRevealed) {
    e.preventDefault();
    handleSendReply();
    return;
  }

  // 3. Escape: Đóng Admin modal nếu đang mở
  if (e.key === 'Escape' && adminModal && !adminModal.classList.contains('hidden')) {
    closeAdminModal();
    return;
  }

  // 4. Gõ chuỗi 'admin' ở bất kỳ đâu để mở Admin Modal
  if (e.key && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
    adminKeyBuffer += e.key.toLowerCase();
    if (adminKeyBuffer.length > 10) adminKeyBuffer = adminKeyBuffer.slice(-10);
    if (adminKeyBuffer.endsWith('admin')) {
      adminKeyBuffer = '';
      openAdminModal();
    }
  }
});

// Gõ "admin" vào ô chat rồi Enter cũng mở Admin
chatInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const val = chatInputEl.value.trim().toLowerCase();
    if (val === 'admin') {
      e.preventDefault();
      chatInputEl.value = '';
      openAdminModal();
    }
  }
});

// Init on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  loadScenario();
});


// ====================================================
// ADMIN DATABASE MANAGER LOGIC
// Xem toàn bộ, sửa thẳng vào DB file JSON, tạo mới case
// ====================================================
const adminModal = document.getElementById('adminModal');
const btnAdminClose = document.getElementById('btnAdminClose');
const adminListItems = document.getElementById('adminListItems');
const adminViewPane = document.getElementById('adminViewPane');
const adminCreatePane = document.getElementById('adminCreatePane');
const adminViewPartnerName = document.getElementById('adminViewPartnerName');
const adminViewCount = document.getElementById('adminViewCount');
const adminMessagesScroll = document.getElementById('adminMessagesScroll');
const btnAdminSaveDb = document.getElementById('btnAdminSaveDb');
const btnAdminPlayCase = document.getElementById('btnAdminPlayCase');
const btnAdminNewCase = document.getElementById('btnAdminNewCase');
const btnCancelCreate = document.getElementById('btnCancelCreate');
const adminNewMsgSender = document.getElementById('adminNewMsgSender');
const optPartnerName = document.getElementById('optPartnerName');
const adminNewMsgText = document.getElementById('adminNewMsgText');
const btnAdminAddMsg = document.getElementById('btnAdminAddMsg');

// Create Case Elements
const tabFormMode = document.getElementById('tabFormMode');
const tabJsonMode = document.getElementById('tabJsonMode');
const contentFormMode = document.getElementById('contentFormMode');
const contentJsonMode = document.getElementById('contentJsonMode');
const createFormName = document.getElementById('createFormName');
const createMsgsList = document.getElementById('createMsgsList');
const createMsgSender = document.getElementById('createMsgSender');
const createMsgText = document.getElementById('createMsgText');
const btnCreateAddRow = document.getElementById('btnCreateAddRow');
const createJsonTextarea = document.getElementById('createJsonTextarea');
const btnSubmitCreateCase = document.getElementById('btnSubmitCreateCase');

// AI Format Helper Elements
const btnCopyAiPrompt = document.getElementById('btnCopyAiPrompt');
const btnFillSampleJson = document.getElementById('btnFillSampleJson');
const btnToggleJsonGuide = document.getElementById('btnToggleJsonGuide');
const jsonGuideBox = document.getElementById('jsonGuideBox');

const AI_PROMPT_TEMPLATE = `Bạn là chuyên gia chuyển đổi dữ liệu tin nhắn hội thoại thành định dạng JSON chuẩn cho ứng dụng Bumble Dating Simulator.

Nhiệm vụ của bạn:
Phân tích đoạn chat hoặc hình ảnh tin nhắn dating được cung cấp và xuất ra DUY NHẤT một khối mã JSON hợp lệ theo đúng cấu trúc sau:

{
  "cuoc_tro_chuyen": {
    "doi_tuong": "<Tên_Bạn_Nữ>",
    "chu_thich_mau": {
      "nen_trang": "Đối phương (<Tên_Bạn_Nữ>)",
      "nen_vang": "Mình (Anh Hoang)"
    },
    "tin_nhan": [
      {
        "id": 1,
        "nguoi_gui": "<Tên người gửi: 'Anh Hoang' nếu là bên mình, hoặc '<Tên_Bạn_Nữ>' nếu là bạn nữ>",
        "loai": "text",
        "noi_dung": "<Nội dung tin nhắn gốc>"
      }
    ]
  }
}

Quy tắc bắt buộc:
1. 'nguoi_gui': Chỉ có 2 phe: "Anh Hoang" (nhân vật nền vàng của người chơi) và tên bạn nữ (ví dụ "Mai Chi", "Thuỳ Linh"...). Tuyệt đối không nhầm lẫn phe gửi.
2. 'id': Đánh số nguyên tăng dần liên tục từ 1, 2, 3... theo đúng thứ tự thời gian.
3. 'loai': Mặc định là "text". Nếu là ảnh động thì loai là "gif", ảnh thì loai là "image", tin nhắn thoại thì loai là "voice".
4. Nếu tin nhắn có tính năng reply trích dẫn tin trước, hãy thêm thuộc tính:
   "tra_loi_cho": {"nguoi_gui": "<Tên người được reply>", "noi_dung": "<Đoạn trích dẫn>"}
5. Chỉ trả về mã JSON nguyên bản, không thêm bất kỳ văn bản giải thích nào ngoài khối JSON.

Dưới đây là nội dung đoạn chat cần chuyển đổi:
[DÁN ĐOẠN CHAT THÔ HOẶC TẢI ẢNH CHỤP MÀN HÌNH LÊN ĐÂY]`;

const SAMPLE_JSON_TEMPLATE = JSON.stringify({
  "cuoc_tro_chuyen": {
    "doi_tuong": "Thuỳ Linh",
    "chu_thich_mau": {
      "nen_trang": "Đối phương (Thuỳ Linh)",
      "nen_vang": "Mình (Anh Hoang)"
    },
    "tin_nhan": [
      {
        "id": 1,
        "nguoi_gui": "Thuỳ Linh",
        "loai": "text",
        "noi_dung": "anh làm bên mảng nào thế"
      },
      {
        "id": 2,
        "nguoi_gui": "Anh Hoang",
        "loai": "text",
        "noi_dung": "A làm kỹ sư phần mềm, hay gõ code thâu đêm"
      },
      {
        "id": 3,
        "nguoi_gui": "Thuỳ Linh",
        "loai": "text",
        "noi_dung": "ui thế chắc ít nói lắm nhờ :v",
        "tra_loi_cho": {
          "nguoi_gui": "Anh Hoang",
          "noi_dung": "A làm kỹ sư phần mềm, hay gõ code thâu đêm"
        }
      },
      {
        "id": 4,
        "nguoi_gui": "Anh Hoang",
        "loai": "text",
        "noi_dung": "Chỉ ít nói với máy tính thôi, với người xinh như em thì nói nhiều lắm :D"
      },
      {
        "id": 5,
        "nguoi_gui": "Thuỳ Linh",
        "loai": "text",
        "noi_dung": "khéo mồm thế này chắc đi tán gái suốt rồi :)))"
      }
    ]
  }
}, null, 2);

// Copy Prompt cho AI
if (btnCopyAiPrompt) {
  btnCopyAiPrompt.addEventListener('click', () => {
    navigator.clipboard.writeText(AI_PROMPT_TEMPLATE).then(() => {
      const originalText = btnCopyAiPrompt.textContent;
      btnCopyAiPrompt.textContent = '✅ Đã copy Prompt!';
      btnCopyAiPrompt.style.background = '#10B981';
      btnCopyAiPrompt.style.color = '#FFFFFF';
      setTimeout(() => {
        btnCopyAiPrompt.textContent = originalText;
        btnCopyAiPrompt.style.background = '';
        btnCopyAiPrompt.style.color = '';
      }, 1800);
    }).catch(err => {
      alert('Không thể copy vào clipboard: ' + err);
    });
  });
}

// Nạp JSON mẫu
if (btnFillSampleJson) {
  btnFillSampleJson.addEventListener('click', () => {
    if (createJsonTextarea) {
      createJsonTextarea.value = SAMPLE_JSON_TEMPLATE;
      createJsonTextarea.focus();
    }
  });
}

// Ẩn / hiện hộp hướng dẫn
if (btnToggleJsonGuide && jsonGuideBox) {
  btnToggleJsonGuide.addEventListener('click', () => {
    jsonGuideBox.classList.toggle('hidden');
    btnToggleJsonGuide.textContent = jsonGuideBox.classList.contains('hidden') ? '📖 Mở hướng dẫn Schema' : '📖 Thu gọn Schema';
  });
}

let adminKeyBuffer = '';
let adminCurrentChatId = null;
let adminPartnerName = '';
let adminCurrentMessages = [];
let createFormMessages = [];

// Open Admin Modal
async function openAdminModal() {
  if (!adminModal) return;
  adminModal.classList.remove('hidden');
  adminViewPane.classList.remove('hidden');
  adminCreatePane.classList.add('hidden');

  try {
    const res = await fetch('/api/chats');
    const chats = await res.json();

    adminListItems.innerHTML = '';
    chats.forEach((chat, idx) => {
      const item = document.createElement('div');
      item.className = 'admin-chat-item';
      item.dataset.id = chat.id;
      if (chat.id === currentChatId || (!currentChatId && idx === 0)) {
        item.classList.add('active');
      }
      item.innerHTML = `
        <span><strong>${escapeHtml(chat.name)}</strong></span>
        <span class="admin-chat-badge">${chat.total_messages} tin</span>
      `;
      item.addEventListener('click', () => {
        document.querySelectorAll('.admin-chat-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        loadAdminChatView(chat.id);
      });
      adminListItems.appendChild(item);
    });

    const targetId = currentChatId || (chats.length > 0 ? chats[0].id : null);
    if (targetId) {
      loadAdminChatView(targetId);
    }
  } catch (err) {
    console.error('Lỗi tải danh sách admin chats:', err);
  }
}

// Close Admin Modal
function closeAdminModal() {
  if (adminModal) adminModal.classList.add('hidden');
}

if (btnAdminClose) btnAdminClose.addEventListener('click', closeAdminModal);

// Load Full Conversation into Admin Editor
async function loadAdminChatView(cId) {
  adminCurrentChatId = cId;
  adminMessagesScroll.innerHTML = '<div class="admin-empty-hint">Đang tải toàn bộ cuộc trò chuyện từ database...</div>';

  try {
    const res = await fetch(`/api/admin/chat?chat_id=${cId}`);
    const data = await res.json();

    adminPartnerName = data.name || 'Đối phương';
    adminCurrentMessages = JSON.parse(JSON.stringify(data.raw_messages || []));

    adminViewPartnerName.textContent = adminPartnerName;
    adminViewCount.textContent = `${adminCurrentMessages.length} tin nhắn (${data.total_turns || 0} lượt rep)`;
    if (optPartnerName) optPartnerName.textContent = `Đối phương (${adminPartnerName})`;

    renderAdminMessageCards();

  } catch (err) {
    console.error('Lỗi nạp chi tiết chat admin:', err);
    adminMessagesScroll.innerHTML = '<div class="admin-empty-hint" style="color:red;">Lỗi tải dữ liệu</div>';
  }
}

// Render Editable Message Cards in Admin (Hỗ trợ kéo thả & nút đổi thứ tự ⬆️⬇️ & chèn tin)
let adminDragSrcIdx = null;

function renderAdminMessageCards() {
  adminMessagesScroll.innerHTML = '';

  if (!adminCurrentMessages.length) {
    adminMessagesScroll.innerHTML = '<div class="admin-empty-hint">Cuộc trò chuyện này chưa có tin nhắn nào. Thêm tin mới ở bên dưới.</div>';
    return;
  }

  adminCurrentMessages.forEach((msg, idx) => {
    const isMe = (msg.nguoi_gui === 'Anh Hoang' || msg.nguoi_gui === 'Mình');
    const card = document.createElement('div');
    card.className = `admin-edit-card ${isMe ? 'admin-card-me' : 'admin-card-them'}`;
    card.draggable = true;
    card.dataset.idx = idx;

    // Drag and Drop Events để đổi thứ tự
    card.addEventListener('dragstart', (e) => {
      adminDragSrcIdx = idx;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', idx);
    });
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      card.classList.add('drag-over');
    });
    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });
    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');
      if (adminDragSrcIdx !== null && adminDragSrcIdx !== idx) {
        const movedItem = adminCurrentMessages.splice(adminDragSrcIdx, 1)[0];
        adminCurrentMessages.splice(idx, 0, movedItem);
        renderAdminMessageCards();
      }
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.admin-edit-card').forEach(c => c.classList.remove('drag-over'));
    });

    // Header: Drag Handle + Badge ID + Sender Selector + Order Actions
    const header = document.createElement('div');
    header.className = 'admin-card-header';

    const meta = document.createElement('div');
    meta.className = 'admin-card-meta';

    // Tay cầm kéo thả
    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.title = 'Kéo thả để di chuyển vị trí tin nhắn';
    dragHandle.textContent = '⋮⋮';
    meta.appendChild(dragHandle);

    const idBadge = document.createElement('span');
    idBadge.className = 'admin-badge-id';
    idBadge.textContent = `#${idx + 1}`;
    meta.appendChild(idBadge);

    const select = document.createElement('select');
    select.className = 'admin-edit-sender';
    select.innerHTML = `
      <option value="Anh Hoang" ${isMe ? 'selected' : ''}>Mình (Anh Hoang)</option>
      <option value="${escapeHtml(adminPartnerName)}" ${!isMe ? 'selected' : ''}>${escapeHtml(adminPartnerName)}</option>
    `;
    select.addEventListener('change', () => {
      msg.nguoi_gui = select.value;
      const nowIsMe = (msg.nguoi_gui === 'Anh Hoang' || msg.nguoi_gui === 'Mình');
      card.classList.toggle('admin-card-me', nowIsMe);
      card.classList.toggle('admin-card-them', !nowIsMe);
    });
    meta.appendChild(select);

    if (msg.ngay) {
      const timeSpan = document.createElement('span');
      timeSpan.style.color = '#64748B';
      timeSpan.style.fontSize = '11px';
      timeSpan.textContent = msg.ngay;
      meta.appendChild(timeSpan);
    }

    header.appendChild(meta);

    // Order Action Buttons (Lên / Xuống / Chèn / Xóa)
    const orderActions = document.createElement('div');
    orderActions.className = 'admin-order-actions';

    // Nút Di chuyển Lên
    const btnUp = document.createElement('button');
    btnUp.type = 'button';
    btnUp.className = 'btn-card-action';
    btnUp.title = 'Đưa tin nhắn này lên trước (đổi thứ tự)';
    btnUp.textContent = '⬆️ Lên';
    btnUp.disabled = (idx === 0);
    btnUp.addEventListener('click', (e) => {
      e.stopPropagation();
      if (idx > 0) {
        const temp = adminCurrentMessages[idx];
        adminCurrentMessages[idx] = adminCurrentMessages[idx - 1];
        adminCurrentMessages[idx - 1] = temp;
        renderAdminMessageCards();
      }
    });
    orderActions.appendChild(btnUp);

    // Nút Di chuyển Xuống
    const btnDown = document.createElement('button');
    btnDown.type = 'button';
    btnDown.className = 'btn-card-action';
    btnDown.title = 'Đưa tin nhắn này xuống sau (đổi thứ tự)';
    btnDown.textContent = '⬇️ Xuống';
    btnDown.disabled = (idx === adminCurrentMessages.length - 1);
    btnDown.addEventListener('click', (e) => {
      e.stopPropagation();
      if (idx < adminCurrentMessages.length - 1) {
        const temp = adminCurrentMessages[idx];
        adminCurrentMessages[idx] = adminCurrentMessages[idx + 1];
        adminCurrentMessages[idx + 1] = temp;
        renderAdminMessageCards();
      }
    });
    orderActions.appendChild(btnDown);

    // Nút Chèn tin nhắn mới ngay bên dưới
    const btnInsert = document.createElement('button');
    btnInsert.type = 'button';
    btnInsert.className = 'btn-card-action btn-card-insert';
    btnInsert.title = 'Chèn một tin nhắn mới ngay bên dưới tin này';
    btnInsert.textContent = '➕ Chèn';
    btnInsert.addEventListener('click', (e) => {
      e.stopPropagation();
      const nextSender = isMe ? (adminPartnerName || 'Đối phương') : 'Anh Hoang';
      adminCurrentMessages.splice(idx + 1, 0, {
        id: idx + 2,
        nguoi_gui: nextSender,
        loai: 'text',
        noi_dung: ''
      });
      adminViewCount.textContent = `${adminCurrentMessages.length} tin nhắn`;
      renderAdminMessageCards();
      setTimeout(() => {
        const textareas = adminMessagesScroll.querySelectorAll('.admin-edit-text');
        if (textareas[idx + 1]) textareas[idx + 1].focus();
      }, 60);
    });
    orderActions.appendChild(btnInsert);

    // Nút Xóa
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn-card-action btn-card-del';
    delBtn.title = 'Xóa tin nhắn này';
    delBtn.textContent = '🗑️ Xóa';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      adminCurrentMessages.splice(idx, 1);
      adminViewCount.textContent = `${adminCurrentMessages.length} tin nhắn`;
      renderAdminMessageCards();
    });
    orderActions.appendChild(delBtn);

    header.appendChild(orderActions);
    card.appendChild(header);

    // Quote preview if exists
    if (msg.tra_loi_cho) {
      const q = document.createElement('div');
      q.className = 'quote-box';
      q.style.margin = '4px 0';
      q.innerHTML = `
        <span class="quote-sender">${escapeHtml(msg.tra_loi_cho.nguoi_gui || 'Tin nhắn')}: </span>
        <span class="quote-text">${escapeHtml(msg.tra_loi_cho.noi_dung || '')}</span>
      `;
      card.appendChild(q);
    }

    // Editable text area
    const textarea = document.createElement('textarea');
    textarea.className = 'admin-edit-text';
    textarea.value = msg.noi_dung || '';
    textarea.rows = Math.min(4, Math.max(2, (msg.noi_dung || '').split('\n').length));
    textarea.addEventListener('input', () => {
      msg.noi_dung = textarea.value;
    });
    card.appendChild(textarea);

    adminMessagesScroll.appendChild(card);
  });
}

// Thêm tin nhắn mới vào cuộc trò chuyện đang xem
if (btnAdminAddMsg) {
  btnAdminAddMsg.addEventListener('click', () => {
    const text = adminNewMsgText.value.trim();
    if (!text) return;

    let sender = adminNewMsgSender.value;
    if (sender === 'partner') sender = adminPartnerName || 'Đối phương';

    adminCurrentMessages.push({
      id: adminCurrentMessages.length + 1,
      nguoi_gui: sender,
      loai: 'text',
      noi_dung: text
    });

    adminNewMsgText.value = '';
    adminViewCount.textContent = `${adminCurrentMessages.length} tin nhắn`;
    renderAdminMessageCards();

    setTimeout(() => {
      adminMessagesScroll.scrollTop = adminMessagesScroll.scrollHeight;
    }, 50);
  });
}

// Lưu thay đổi trực tiếp vào Database (file JSON)
if (btnAdminSaveDb) {
  btnAdminSaveDb.addEventListener('click', async () => {
    if (!adminCurrentChatId) return;

    btnAdminSaveDb.textContent = '⏳ Đang lưu...';
    btnAdminSaveDb.disabled = true;

    try {
      // Re-index IDs
      adminCurrentMessages.forEach((m, idx) => {
        m.id = idx + 1;
      });

      const res = await fetch('/api/admin/save_chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminCurrentChatId,
          doi_tuong: adminPartnerName,
          raw_messages: adminCurrentMessages
        })
      });
      const data = await res.json();

      if (data.success) {
        btnAdminSaveDb.textContent = '✅ Đã lưu thành công!';
        // Update badge in list
        const activeItem = document.querySelector(`.admin-chat-item[data-id="${adminCurrentChatId}"] .admin-chat-badge`);
        if (activeItem) activeItem.textContent = `${adminCurrentMessages.length} tin`;

        setTimeout(() => {
          btnAdminSaveDb.textContent = '💾 Lưu vào Database';
          btnAdminSaveDb.disabled = false;
        }, 1600);
      } else {
        alert('Lỗi lưu: ' + (data.error || 'Không xác định'));
        btnAdminSaveDb.textContent = '💾 Lưu vào Database';
        btnAdminSaveDb.disabled = false;
      }
    } catch (err) {
      alert('Lỗi kết nối lưu: ' + err.message);
      btnAdminSaveDb.textContent = '💾 Lưu vào Database';
      btnAdminSaveDb.disabled = false;
    }
  });
}

// Nạp case này vào màn hình chính để chơi
if (btnAdminPlayCase) {
  btnAdminPlayCase.addEventListener('click', () => {
    if (adminCurrentChatId) {
      closeAdminModal();
      loadScenario({ chat_id: adminCurrentChatId, mode: 'random' });
    }
  });
}

// Chuyển sang giao diện Tạo mới Case
if (btnAdminNewCase) {
  btnAdminNewCase.addEventListener('click', () => {
    adminViewPane.classList.add('hidden');
    adminCreatePane.classList.remove('hidden');
    createFormMessages = [];
    renderCreateFormList();
    if (createFormName) createFormName.value = '';
    if (createJsonTextarea) createJsonTextarea.value = '';
  });
}

if (btnCancelCreate) {
  btnCancelCreate.addEventListener('click', () => {
    adminCreatePane.classList.add('hidden');
    adminViewPane.classList.remove('hidden');
  });
}

// Tabs chuyển giữa Form và JSON trong Create Case
if (tabFormMode && tabJsonMode) {
  tabFormMode.addEventListener('click', () => {
    tabFormMode.classList.add('active');
    tabJsonMode.classList.remove('active');
    contentFormMode.classList.remove('hidden');
    contentJsonMode.classList.add('hidden');
  });
  tabJsonMode.addEventListener('click', () => {
    tabJsonMode.classList.add('active');
    tabFormMode.classList.remove('active');
    contentJsonMode.classList.remove('hidden');
    contentFormMode.classList.add('hidden');
  });
}

// Thêm tin nhắn trong Create Form
function renderCreateFormList() {
  if (!createMsgsList) return;
  createMsgsList.innerHTML = '';
  if (!createFormMessages.length) {
    createMsgsList.innerHTML = '<div style="color:#64748B; font-size:12.5px; padding:6px;">Chưa thêm tin nhắn ban đầu. Nhập bên dưới và bấm Thêm.</div>';
    return;
  }
  createFormMessages.forEach((m, idx) => {
    const item = document.createElement('div');
    const isMe = (m.nguoi_gui === 'Anh Hoang');
    item.className = `create-msg-item ${isMe ? 'item-me' : ''}`;
    item.innerHTML = `
      <span><strong>${escapeHtml(m.nguoi_gui)}:</strong> ${escapeHtml(m.noi_dung)}</span>
      <button style="background:none;border:none;color:#EF4444;cursor:pointer;">✕</button>
    `;
    item.querySelector('button').addEventListener('click', () => {
      createFormMessages.splice(idx, 1);
      renderCreateFormList();
    });
    createMsgsList.appendChild(item);
  });
}

if (btnCreateAddRow) {
  btnCreateAddRow.addEventListener('click', () => {
    const text = createMsgText.value.trim();
    if (!text) return;
    const partnerNameVal = createFormName.value.trim() || 'Bạn nữ';
    const sender = (createMsgSender.value === 'Anh Hoang') ? 'Anh Hoang' : partnerNameVal;

    createFormMessages.push({
      id: createFormMessages.length + 1,
      nguoi_gui: sender,
      loai: 'text',
      noi_dung: text
    });
    createMsgText.value = '';
    renderCreateFormList();
  });
}

// Submit Create Case
if (btnSubmitCreateCase) {
  btnSubmitCreateCase.addEventListener('click', async () => {
    const isJsonMode = tabJsonMode.classList.contains('active');
    let payload = {};

    if (isJsonMode) {
      const rawJson = createJsonTextarea.value.trim();
      if (!rawJson) {
        alert('Vui lòng dán nội dung JSON!');
        return;
      }
      try {
        JSON.parse(rawJson);
      } catch (e) {
        alert('Định dạng JSON không hợp lệ: ' + e.message);
        return;
      }
      payload = { format_type: 'json', json_content: rawJson };
    } else {
      const name = createFormName.value.trim();
      if (!name) {
        alert('Vui lòng nhập tên đối tượng!');
        return;
      }
      payload = { format_type: 'form', doi_tuong: name, messages: createFormMessages };
    }

    btnSubmitCreateCase.textContent = '⏳ Đang tạo case...';
    btnSubmitCreateCase.disabled = true;

    try {
      const res = await fetch('/api/admin/create_chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        alert(data.message || 'Đã tạo case mới thành công!');
        // Refresh admin chats
        await openAdminModal();
        if (data.chat_id) {
          loadAdminChatView(data.chat_id);
        }
      } else {
        alert('Lỗi: ' + (data.error || 'Không thể tạo case'));
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
    } finally {
      btnSubmitCreateCase.textContent = '💾 Lưu & Tạo Case Mới Vào Database';
      btnSubmitCreateCase.disabled = false;
    }
  });
}
