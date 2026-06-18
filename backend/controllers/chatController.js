const { getChatResponse } = require('../services/chatbotService');
const { sendSuccess, sendError } = require('../utils/helpers');

const chat = async (req, res) => {
  try {
    const { message, conversation } = req.body;
    if (!message || !message.trim()) return sendError(res, 'Message is required', 400);

    const messages = (conversation || []).slice(-10);
    messages.push({ role: 'user', content: message.trim() });

    let userContext = {};
    if (req.user) {
      userContext.user = { id: req.user.id, name: req.user.name, email: req.user.email };
    }

    const reply = await getChatResponse(messages, userContext);
    if (!reply) return sendError(res, 'AI returned empty response', 500);
    sendSuccess(res, { reply, conversation: [...messages, { role: 'assistant', content: reply }] });
  } catch (err) {
    console.error('Chat error:', err.message);
    sendError(res, 'AI service temporarily unavailable. Please try again.');
  }
};

module.exports = { chat };
