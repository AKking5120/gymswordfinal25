const supabase = require('../config/db');

// ─── Context Manager ─────────────────────────────────────────────────────────

class ChatContext {
  constructor() {
    this.state = 'idle';          // idle | awaiting_order | awaiting_email | awaiting_confirmation
    this.pendingIntent = null;
    this.extracted = {};          // extracted entities (orderId, email, etc.)
    this.history = [];            // last 5 intents
    this.messages = 0;
  }

  addIntent(intent, extracted = {}) {
    this.history.push(intent);
    if (this.history.length > 5) this.history.shift();
    Object.assign(this.extracted, extracted);
    this.messages++;
  }

  setState(state, intent, extracted = {}) {
    this.state = state;
    this.pendingIntent = intent;
    Object.assign(this.extracted, extracted);
  }

  reset() {
    this.state = 'idle';
    this.pendingIntent = null;
  }
}

// ─── Entity Extraction ───────────────────────────────────────────────────────

function extractEntities(text, user) {
  const entities = {};

  // Order number (GS-000534 or plain number)
  const orderMatch = text.match(/(?:GS[-\s]?)?0*(\d{3,6})/i);
  if (orderMatch) entities.orderId = orderMatch[1].replace(/^0+/, '');

  // Email
  const emailMatch = text.match(/\b[\w.-]+@[\w.-]+\.\w{2,}\b/i);
  if (emailMatch) entities.email = emailMatch[0].toLowerCase();

  // Phone (Indian mobile)
  const phoneMatch = text.match(/\b[789]\d{9}\b/);
  if (phoneMatch) entities.phone = phoneMatch[0];

  // Product type
  const productTypes = ['hoodies', 'joggers', 'tshirts', 't-shirts', 'sports bra', 'sports-bra',
    'crop top', 'crop-top', 'tank top', 'tank-top', 'shorts', 'jackets', 'leggings',
    'compression', 'activewear', 'active-wear', 'oversized'];
  for (const pt of productTypes) {
    if (text.toLowerCase().includes(pt)) {
      entities.productType = pt;
      break;
    }
  }

  if (user) entities.user = user;

  return entities;
}

// ─── Intent Classification ────────────────────────────────────────────────────

const INTENT_PATTERNS = [
  // ── Greetings ──
  {
    intent: 'greeting',
    priority: 10,
    patterns: [
      /^(hi|hello|hey|yo|namaste|namaskar|hii|helo|hy|good\s*(morning|afternoon|evening|night)|sup|what's up|wasup)\b/i,
      /^(hii+|helloo+|heyy+)$/i,
      /^\((namaste|pranam)\)/i,
    ],
  },

  // ── Order Tracking ──
  {
    intent: 'track_order',
    priority: 9,
    patterns: [
      /track\s*(my\s*)?order/i,
      /order\s*(status|track|kahan|kitna|kaha|pehuncha)/i,
      /kahan\s*(hai|pehuncha|pahuncha)\s*(mera\s*)?order/i,
      /order.*(status|track|number|id)/i,
      /(status|track|delivery)\s*(of\s*)?(my\s*)?order/i,
    ],
  },

  // ── List My Orders ──
  {
    intent: 'list_orders',
    priority: 9,
    patterns: [
      /(my|meri|mujhe|mere|maine)\s*(orders|order|purchases|history|samaan|shopping)/i,
      /(orders|order|purchase)\s*(ki|ka|list|history|dikhao|bataye|batao)/i,
      /kitne.*order/i,
      /order\s*histry/i,
      /recent\s*orders/i,
    ],
  },

  // ── Cancel Order ──
  {
    intent: 'cancel_order',
    priority: 9,
    patterns: [
      /cancel\s*(my\s*)?order/i,
      /order\s*cancel/i,
      /(cancel|radd|cancelation|cancellation|cancle)/i,
      /order\s* (cancel|radd)/i,
      /mujhe.*(cancel|radd).*(order|karna)/i,
      /(cancel|radd).*(order|karna)/i,
    ],
  },

  // ── Return / Exchange ──
  {
    intent: 'return_exchange',
    priority: 9,
    patterns: [
      /(return|exchange|replace|wapas|badle|change)\s*(product|item|order|samaan|goods)/i,
      /(return|exchange|replace|wapas|badle)\s*(policy|karna|karwana|kaise|process)/i,
      /product\s*(return|exchange|wapas|vapas)/i,
      /(return|exchange|refund)\s*(request|initiate|start|process)/i,
      /mujhe.*(return|exchange|wapas|vapas).*(karna)/i,
    ],
  },

  // ── Refund ──
  {
    intent: 'refund',
    priority: 9,
    patterns: [
      /(refund|paisa\s*wapas|money\s*back|refunded|refund\s*status)/i,
      /(refund|paisa|money).*(kab|when|kitna|how\s*much|status)/i,
      /(paisa|money)\s*(wapas|back|vapas|return)/i,
    ],
  },

  // ── Shipping ──
  {
    intent: 'shipping',
    priority: 9,
    patterns: [
      /(shipping|delivery)\s*(time|duration|period|kitna|kab|when|how\s*long|charge|free|cost|policy)/i,
      /(shipping|delivery|dispatch)\s*(address|info|details|update|status)/i,
      /(delivery|shipping|ship)\s*(kab|kitna|how\s*much|charge|free)/i,
      /(kab|when).*(deliver|ship|arrive|reach|aayega|milega)/i,
      /(delivery|shiping|shipping|dispatch)\s*(address|pata|location)/i,
    ],
  },

  // ── Products / Shop ──
  {
    intent: 'search_product',
    priority: 8,
    patterns: [
      /(search|find|show|dikhao|recommend|suggest|need|chahiye)\b.*\b(product|item|hoodie|shirt|jogger|short|bra|tank|top|jacket|crop|legging|vest|gymwear|cloth|activewear)/i,
      /\b(product|item|hoodie|shirt|jogger|short|bra|tank|top|jacket|crop|legging|vest|gymwear).*(search|find|show|dikhao|recommend|suggest)/i,
      /(men|women|male|female|unisex|ladies|gents)\s*(cloth|wear|collection|product|hoodie|shirt)/i,
      /(what|which|kaunsa|best|top|popular|trending|bestseller)\s*(product|item|cloth|wear)/i,
      /\b(hoodie|hoodies|jogger|joggers|tshirt|t-shirt|shorts|sports bra|tank top|crop top|legging|leggings|jacket|compression)\b/i,
    ],
  },

  // ── Categories ──
  {
    intent: 'categories',
    priority: 7,
    patterns: [
      /(category|categories|types|kinds|collection|sections|divisions)\s*(of\s*products|dikhao|bataye|list)/i,
      /what\s*(categories|types|collections|products)\s*(do|are|you|available)/i,
      /(all|sab|saare)\s*(category|categories|products)/i,
      /(kaun\s*kaun\s*si|kya\s*kya)\s*(category|product|cheez|cheeze|types)/i,
    ],
  },

  // ── Price / Offers ──
  {
    intent: 'pricing',
    priority: 8,
    patterns: [
      /(price|cost|rate|kitna|daam|mulya|fees|charge)\s*(of|hai|ka|ki|for)/i,
      /(kitne\s*ka|kitne\s*ki|price\s*list|pricing|costing|rate\s*list)/i,
      /(offer|discount|sale|deal|coupon|promo|code)\b/i,
    ],
  },

  // ── Size / Fit ──
  {
    intent: 'size_fit',
    priority: 7,
    patterns: [
      /(size|fit|measurement|sizing|chart|dimension)\s*(guide|chart|table|help|recommend|suggest)/i,
      /(what\s*size|kaunsa\s*size|size\s*kaunsa|size\s*chahiye|size\s*loon)/i,
      /(size|fit)\s*(dikhao|bataye|batao|guide|chart)/i,
      /how\s*(to|do\s*i)\s*(choose|select|find|pick)\s*(size|fit)/i,
    ],
  },

  // ── Account ──
  {
    intent: 'account',
    priority: 8,
    patterns: [
      /(login|signin|signup|register|account|profile)\s*(help|issue|problem|kaise|how|not\s*working)/i,
      /(forgot|reset|change|update)\s*(password|pin|login)/i,
      /(otp|verification|verify)\s*(not\s*receiving|problem|issue|nahi\s*aaya)/i,
      /account\s*(create|delete|close|deactivate|settings|update|edit)/i,
      /how\s*(to|do\s*i|can\s*i)\s*(login|signin|signup|register)/i,
      /(login|signin|register|account)\s*(kaise|kare|karna|how|help|nahi\s*ho\s*raha)/i,
    ],
  },

  // ── Wallet / Coins / Rewards ──
  {
    intent: 'wallet',
    priority: 8,
    patterns: [
      /(wallet|coins|points|rewards|referral|reward\s*points)\s*(balance|check|kitna|status|dikhao)/i,
      /(kitne|how\s*many)\s*(coins|points|reward)/i,
      /(refer|referral|invite|code|link)\s*(earn|friend|bonus|reward)/i,
      /(wallet|coin|point)\s*(use|apply|redeem|pay)/i,
      /\b(my\s*)?(wallet|coins|points|rewards)\b/i,
    ],
  },

  // ── Contact / Human Agent ──
  {
    intent: 'contact_human',
    priority: 10,
    patterns: [
      /(talk|speak|connect|reach|transfer)\s*(to\s*)?(human|agent|person|executive|support|representative|team)/i,
      /(human|agent|customer\s*support|executive|real\s*person)\s*(chahiye|need|talk|speak|connect)/i,
      /(complaint|grievance|shikayat|problem|issue)\s*(dabaye|register|file|submit|report)/i,
      /(customer\s*(care|service|support))\s*(number|phone|email|contact|helpline)/i,
      /(support|helpline|help\s*line)\s*(number|phone|email|contact)/i,
    ],
  },

  // ── Store Info ──
  {
    intent: 'store_info',
    priority: 7,
    patterns: [
      /(about|brand|company|who\s*are\s*you|story|mission|vision)/i,
      /(gymsword|gym\s*sword)\s*(kya|what|who|about|explain)/i,
      /what\s*(is|are)\s*(gymsword|gym\s*sword)/i,
      /(opening|timing|hour|location|store|showroom)/i,
    ],
  },

  // ── Feedback / Complaint ──
  {
    intent: 'feedback',
    priority: 7,
    patterns: [
      /(feedback|review|rating|suggestion|opinion|experience)\s*(dena|submit|share|dabaye|record)/i,
      /(complain|complaint|issue|problem|grievance|shikayat)\s*(hai|karna|register|submit)/i,
      /product\s*(damaged|defective|wrong|galat|kharab|tut gaya|faulty|not\s*working)/i,
    ],
  },

  // ── Thank You ──
  {
    intent: 'thanks',
    priority: 5,
    patterns: [
      /^(thanks|thank\s*you|thankyou|thnx|thnks|thank\s*you|dhanyavaad|shukriya|bow|bowji)$/i,
      /^(ok|okay|k|kk|done|ho\s*gaya|theek\s*hai|thik\s*hai)$/i,
      /(great|awesome|perfect|excellent|wonderful|helpful|thanks\s*a\s*lot|much\s*help)/i,
    ],
  },

  // ── Goodbye ──
  {
    intent: 'goodbye',
    priority: 5,
    patterns: [
      /^(bye|goodbye|tata|alvida|bye\s*bye|see\s*you|talk\s*to\s*you\s*late?r|cya|gotta\s*go|leave)$/i,
    ],
  },

  // ── FAQ / General Help ──
  {
    intent: 'faq',
    priority: 3,
    patterns: [
      /faq|guide|tips|tutorial/i,
      /how\s*(to|can|do\s*i)\s*(find|use|apply|choose|check|get|make|start|change|update|setup)/i,
      /(tell\s*me|show\s*me)\s*(how|about|more|the|your)/i,
      /(kaise|kya\s*hai|kya\s*ho|bataye|batao|sikhao|samjhao|guide|help\s*me)/i,
      /^help$/i,
    ],
  },
];

// ─── Response Templates ───────────────────────────────────────────────────────

const RESPONSES = {
  greeting: (user) => ({
    text: user
      ? `Welcome back${user.name ? ', ' + user.name : ''}! I'm your GymSword assistant. How can I help you today? You can ask me about products, orders, returns, or anything else.`
      : `Welcome to GymSword. I'm your personal assistant. I can help you find the perfect gear, track orders, check store policies, or answer any questions. How may I assist you today?`,
    suggestions: ['Track my order', 'Show me hoodies', 'Return policy', 'Contact support'],
  }),

  thanks: () => ({
    text: `You're welcome! If you ever need anything else, just reach out. We're always here to help. Forge Your Strength. 💪`,
    suggestions: ['Shop now', 'Track order', 'Talk to agent'],
  }),

  goodbye: () => ({
    text: `Thank you for choosing GymSword. Stay strong, stay legendary. Forge Your Strength. 👊`,
    suggestions: [],
  }),

  store_info: () => ({
    text: `**GymSword** — Luxury athleisure for the modern warrior. Engineered in premium fabrics for relentless performance. We believe in forging strength through quality, design, and discipline.\n\nEach piece is crafted for athletes who demand more — whether you're lifting, running, or owning your rest day.\n\nCurrently available online at **gymsword.com** — worldwide shipping available.`,
    suggestions: ['Shop collection', 'Track my order', 'Contact support'],
  }),

  fallback: () => ({
    text: `I'm not sure I understand. Could you rephrase that? Here's what I can help you with:\n\n🔍 **Find products** — "Show me hoodies"\n📦 **Track orders** — "Track my order"\n🔄 **Returns & exchanges** — "Return policy"\n👤 **Account help** — "Login issue"\n📞 **Talk to us** — "Contact support"\n\nHow can I assist you?`,
    suggestions: ['Shop products', 'Track order', 'Return policy', 'Contact support'],
  }),

  contact_human: () => ({
    text: `I understand you'd like to speak with a human. You can reach our support team:\n\n📧 **Email:** support@gymsword.com\n⏱ **Response time:** Within 24 hours\n\nOr describe your issue here and I'll do my best to help!`,
    suggestions: ['Cancel my order', 'Return a product', 'Track my order', 'I have a complaint'],
  }),

  feedback: () => ({
    text: `We value your feedback! You can:\n1. Share your experience at **support@gymsword.com**\n2. Leave a review on any product page\n3. Describe your issue here and I'll log it for the team\n\nHow would you like to proceed?`,
    suggestions: ['Report a problem', 'Product review', 'Talk to support'],
  }),
};

// ─── Action Handlers ──────────────────────────────────────────────────────────

async function handleTrackOrder(entities, user) {
  let orderId = entities.orderId;

  if (!orderId && user) {
    const { data } = await supabase
      .from('orders').select('id, status, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)
      .maybeSingle();
    if (data) orderId = data.id;
  }

  if (!orderId) {
    return {
      text: `I'd be happy to track your order! Please share your **order number** (like GS-000534) or the email address used at checkout.`,
      state: 'awaiting_order',
      ...(!user ? { suggestions: ['My email is...'] } : {}),
    };
  }

  const cleanId = String(orderId).replace('GS-', '').replace(/^0+/, '');
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, created_at, total_amount, order_history(*)')
    .eq('id', cleanId)
    .single();

  if (!order) {
    return {
      text: `I couldn't find order **GS-${String(cleanId).padStart(6, '0')}**. Please double-check the order number and try again.`,
      suggestions: ['Track another order', 'My recent orders'],
    };
  }

  const statusLabels = {
    pending: 'Order Placed 📋', confirmed: 'Confirmed ✅', processing: 'Processing 🔄',
    shipped: 'Shipped 📦', out_for_delivery: 'Out for Delivery 🚚',
    delivered: 'Delivered 🎉', cancelled: 'Cancelled ❌', returned: 'Returned ↩️',
  };

  const history = (order.order_history || [])
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map(h => {
      const d = new Date(h.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      return `  ${statusLabels[h.status] || h.status} — ${d}`;
    });

  const timeline = history.length ? `\n\n**Timeline:**\n${history.join('\n')}` : '';
  const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return {
    text: `**Order GS-${String(order.id).padStart(6, '0')}**\n📅 Placed on: ${orderDate}\n💰 Total: ₹${order.total_amount}\n📊 **Status:** ${statusLabels[order.status] || order.status}${timeline}`,
    suggestions: order.status !== 'delivered' && order.status !== 'cancelled'
      ? ['Cancel this order', 'Need help', 'My other orders']
      : ['My other orders', 'Shop more'],
  };
}

async function handleListOrders(user) {
  if (!user) {
    return {
      text: `I need you to be logged in to view your orders. Please log in to your account and I'll show you everything!`,
      suggestions: ['I want to login', 'Track by order number', 'Contact support'],
    };
  }

  const { data: orders } = await supabase
    .from('orders').select('id, status, total_amount, created_at')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);

  if (!orders || orders.length === 0) {
    return {
      text: `You haven't placed any orders yet${user.name ? ', ' + user.name : ''}. Browse our collection and find something you love! 🛍️`,
      suggestions: ['Shop men', 'Shop women', 'View categories'],
    };
  }

  const statusLabels = {
    pending: '📋 Placed', confirmed: '✅ Confirmed', processing: '🔄 Processing',
    shipped: '📦 Shipped', out_for_delivery: '🚚 Out for Delivery',
    delivered: '🎉 Delivered', cancelled: '❌ Cancelled', returned: '↩️ Returned',
  };

  const lines = orders.map((o, i) =>
    `${i + 1}. **GS-${String(o.id).padStart(6, '0')}** — ${statusLabels[o.status] || o.status} — ₹${o.total_amount}`
  );

  return {
    text: `Here are your recent orders, ${user.name || 'valued customer'}:\n\n${lines.join('\n')}\n\nReply with an order number to track it!`,
    suggestions: ['Track latest order', 'Cancel an order', 'Return an item', 'Shop again'],
  };
}

async function handleCancelOrder(entities, user) {
  if (!user) {
    return {
      text: `To cancel an order, please log in first or provide your order number and registered email.`,
      suggestions: ['Track my order', 'Login to account', 'Contact support'],
    };
  }

  let orderId = entities.orderId;
  if (!orderId) {
    const { data } = await supabase
      .from('orders').select('id, status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)
      .maybeSingle();
    if (data) orderId = data.id;
  }

  if (!orderId) {
    return {
      text: `Please provide the **order number** you'd like to cancel.`,
      state: 'awaiting_order',
    };
  }

  const cleanId = String(orderId).replace('GS-', '').replace(/^0+/, '');
  const { data: order } = await supabase
    .from('orders').select('id, status, user_id').eq('id', cleanId).single();

  if (!order) {
    return {
      text: `I couldn't find order **GS-${String(cleanId).padStart(6, '0')}**. Please check the number.`,
      suggestions: ['Try another order', 'Contact support'],
    };
  }

  if (String(order.user_id) !== String(user.id)) {
    return { text: `This order doesn't belong to your account. Please check the order number.` };
  }

  const cancellable = ['pending', 'confirmed', 'processing'];
  if (!cancellable.includes(order.status)) {
    return {
      text: `Order **GS-${String(order.id).padStart(6, '0')}** is already **${order.status}** and cannot be cancelled. For further assistance, please contact support.`,
      suggestions: ['Contact support', 'Return policy'],
    };
  }

  // Actually cancel the order
  await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
  await supabase.from('order_history').insert({
    order_id: order.id, status: 'cancelled',
    notes: 'Cancelled by customer via chatbot',
    created_at: new Date().toISOString(),
  });

  return {
    text: `✅ Order **GS-${String(order.id).padStart(6, '0')}** has been successfully cancelled.\n\nRefund will be processed within 5-7 business days to your original payment method. You'll receive a confirmation email shortly.`,
    suggestions: ['Check refund status', 'Shop again', 'Need more help'],
  };
}

async function handleReturnExchange(entities, user) {
  const { data: policies } = await supabase.from('settings').select('key, value').in('key', ['return_policy', 'exchange_policy']);
  const policyMap = {}; if (policies) policies.forEach(s => { policyMap[s.key] = s.value; });

  const returnPolicy = policyMap.return_policy || `You can return items within **15 days** of delivery. Items must be unused, unworn, and in original packaging.`;
  const exchangePolicy = policyMap.exchange_policy || `Exchanges are available within **15 days** of delivery for size issues or defects.`;

  return {
    text: `**🔄 Returns & Exchanges**\n\n${returnPolicy}\n\n${exchangePolicy}\n\nTo initiate a return or exchange, please contact our support team at **support@gymsword.com** with your order number.`,
    suggestions: ['Start a return', 'Cancel my order', 'Track my order', 'Talk to support'],
  };
}

async function handleRefund(entities, user) {
  let orderId = entities.orderId;
  if (!orderId && user) {
    const { data } = await supabase
      .from('orders').select('id, status').eq('user_id', user.id).in('status', ['cancelled', 'returned']).order('created_at', { ascending: false }).limit(1)
      .maybeSingle();
    if (data) orderId = data.id;
  }

  if (orderId) {
    const cleanId = String(orderId).replace('GS-', '').replace(/^0+/, '');
    const { data: order } = await supabase.from('orders').select('id, status, total_amount').eq('id', cleanId).single();
    if (order && ['cancelled', 'returned'].includes(order.status)) {
      return {
        text: `For order **GS-${String(order.id).padStart(6, '0')}** (₹${order.total_amount}): Refunds are processed within **5-7 business days** to the original payment method. You'll get an email confirmation once processed.\n\nIf it's been longer, please contact support@ gymsword.com with your order details.`,
        suggestions: ['I still need help', 'Cancel another order', 'Shop now'],
      };
    }
  }

  return {
    text: `**💰 Refund Policy**\n\nRefunds are processed within **5-7 business days** after cancellation or return approval. The amount is credited back to your original payment method (UPI / Card / Net Banking / Wallet).\n\nYou'll receive a confirmation email with refund details once processed. For any delays, please reach out to **support@gymsword.com**.`,
    suggestions: ['Cancel my order', 'Return an item', 'Track refund'],
  };
}

async function handleShipping(entities, user) {
  const { data: policies } = await supabase.from('settings').select('key, value').in('key', ['shipping_policy']);
  const policy = policies && policies[0] ? policies[0].value : null;

  return {
    text: `**📦 Shipping Information**\n\n${policy || `• Free shipping on orders above ₹999\n• Standard delivery: 3-7 business days\n• Express delivery: 1-2 business days (₹99 extra)\n• International shipping: 7-14 business days\n• Order tracking available via email & SMS`}\n\nNeed to track a specific order? Share your order number!`,
    suggestions: ['Track my order', 'Check delivery address', 'Change address', 'Contact support'],
  };
}

async function handleSearchProduct(text) {
  let query = text
    .replace(/\b(search|find|show|dikhao|recommend|suggest|need|chahiye|lao|dhundho|what|which|kaunsa|best|top|popular|trending|bestseller|men|women|male|female|unisex|ladies|gents|product|item|cloth|wear|mein|mai|for|and|the|a|an|me|my|your|i|want|some|please|pls|show|new|latest|for|me|some)\b/gi, '')
    .replace(/\s+/g, ' ').trim().toLowerCase()
    .replace(/sports\s*bra/i, 'sports-bra')
    .replace(/t[- ]?shirt/i, 'tshirt')
    .replace(/tank\s*top/i, 'tank-top')
    .replace(/crop\s*top/i, 'crop-top')
    .replace(/active\s*wear/i, 'active-wear')
    .replace(/compression\s*wear/i, 'compression-wear');

  if (!query || query.length < 2) {
    return {
      text: `Here are our popular categories:\n\n• 👕 **Oversized T-Shirts** — from ₹1,299\n• 🧥 **Hoodies** — from ₹2,399\n• 👖 **Joggers** — from ₹1,749\n• 🏋️ **Sports Bras** — from ₹1,599\n• 👚 **Crop Tops** — from ₹1,499\n• 🎽 **Tank Tops** — from ₹999\n\nWhich category interests you?`,
      suggestions: ['Oversized T-Shirts', 'Hoodies', 'Joggers', 'Sports Bras'],
    };
  }

  const { data: products } = await supabase
    .from('products')
    .select('name, price, sale_price, product_type, stock_quantity, rating, review_count, image_url')
    .or(`name.ilike.%${query}%,product_type.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`)
    .eq('is_active', true)
    .limit(5);

  if (!products || products.length === 0) {
    return {
      text: `I couldn't find anything matching "${text.replace(/show|dikhao|search|find|recommend|me|i|want|some/gi, '').trim()}". Try browsing by category — we have Hoodies, Joggers, Sports Bras, T-Shirts, and more!`,
      suggestions: ['Show all hoodies', 'Show all joggers', 'View categories'],
    };
  }

  const lines = products.map(p => {
    const price = p.sale_price || p.price;
    const badge = p.stock_quantity === 0 ? ' — 🔴 Out of Stock' : p.stock_quantity < 10 ? ' — ⚡ Low Stock' : '';
    const stars = p.review_count > 0 ? ` ⭐${p.rating} (${p.review_count})` : '';
    return `• **${p.name}** — ₹${price}${badge}${stars}`;
  });

  return {
    text: `**Products found:**\n\n${lines.join('\n')}\n\nVisit our shop for more details and to place an order!`,
    suggestions: ['Show prices', 'More options', 'View all products'],
  };
}

async function handleCategories() {
  const { data } = await supabase
    .from('products')
    .select('product_type')
    .eq('is_active', true)
    .not('product_type', 'is', null);

  if (!data) return { text: 'Sorry, no categories available right now.' };

  const types = [...new Set(data.map(p => p.product_type))].filter(Boolean);
  const labels = {
    'oversized-t-shirts': '👕 Oversized T-Shirts', 'active-wear': '🏃 Active Wear',
    'hoodies': '🧥 Hoodies', 'joggers': '👖 Joggers', 'sports-bras': '🏋️ Sports Bras',
    'crop-tops': '👚 Crop Tops', 'crop-jackets': '🧥 Crop Jackets', 'jackets': '🧥 Jackets',
    'compression-wear': '💪 Compression Wear', 'regular-fit-t-shirts': '👕 Regular Fit T-Shirts',
    'shorts': '🩳 Shorts', 'tank-tops': '🎽 Tank Tops', 'leggings': '🦵 Leggings',
  };
  const formatted = types.map(t => `  ${labels[t] || t}`);

  return {
    text: `**Our Collections**\n\n${formatted.join('\n')}\n\nWhich one would you like to explore?`,
    suggestions: types.slice(0, 4).map(t => labels[t]?.replace(/[^a-zA-Z ]/g, '').trim() || t),
  };
}

async function handlePricing(text) {
  const query = text.replace(/\b(price|cost|rate|kitna|daam|mulya|fees|charge|of|hai|ka|ki|for|the)\b/gi, '').trim();
  
  let products;
  if (query && query.length > 1) {
    const { data } = await supabase
      .from('products').select('name, price, sale_price')
      .or(`name.ilike.%${query}%,product_type.ilike.%${query}%`)
      .eq('is_active', true).limit(5);
    products = data;
  }

  if (products && products.length > 0) {
    const lines = products.map(p => `• **${p.name}** — ₹${p.sale_price || p.price}`);
    return {
      text: `**Pricing:**\n\n${lines.join('\n')}\n\nWant to know about ongoing offers? Just ask!`,
      suggestions: ['Any discounts?', 'Shop now', 'Compare prices'],
    };
  }

  return {
    text: `**Price Range:**\n\n• 👕 T-Shirts — ₹1,299 - ₹1,899\n• 🧥 Hoodies — ₹2,399 - ₹4,499\n• 👖 Joggers — ₹1,749 - ₹3,799\n• 🏋️ Sports Bras — ₹1,599 - ₹2,199\n• 👚 Crop Tops — ₹1,499 - ₹1,799\n• 🎽 Tank Tops — ₹999 - ₹1,599\n\nWe regularly have offers and discounts — check the shop page for current deals!`,
    suggestions: ['Current offers', 'Sale items', 'Shop all'],
  };
}

async function handleSizeFit() {
  return {
    text: `**📏 Size Guide**\n\nEach product page has a detailed size chart. General tips:\n\n• **Oversized fit** — Go for your regular size for an oversized look\n• **Compression fit** — Go one size down for a snug fit\n• **Regular fit** — Stick to your usual size\n\n**Pro tip:** If you're between sizes, we recommend going **one size up** for comfort.\n\nNeed specific measurements? Check the product page or contact us!`,
    suggestions: ['Show me hoodies', 'T-Shirt sizes', 'Contact support'],
  };
}

async function handleAccount(text) {
  if (/(login|signin)/i.test(text)) {
    return {
      text: `**🔐 Login Help**\n\nYou can login using your registered email. Here's how:\n1. Go to **gymsword.com/login**\n2. Enter your email\n3. You'll receive a **6-digit OTP** on your email\n4. Enter the OTP to login\n\nNo password needed! If you're not receiving the OTP, check your spam folder.`,
      suggestions: ['Not receiving OTP', 'Create account', 'Forgot password', 'Contact support'],
    };
  }
  if (/(register|signup|create|new\s*account)/i.test(text)) {
    return {
      text: `**📝 Create Account**\n\nCreating a GymSword account is free and easy! Visit **gymsword.com/register** and enter:\n• Your name\n• Email address\n• Phone number\n• Create a password\n\nYou'll get 25 welcome coins on signup! 🎉`,
      suggestions: ['Login help', 'What are coins?', 'Refer a friend'],
    };
  }
  if (/(forgot|reset|change).*password/i.test(text)) {
    return {
      text: `**🔑 Reset Password**\n\n1. Go to **gymsword.com/forgot-password**\n2. Enter your registered email\n3. You'll receive an OTP\n4. Set a new password\n\nIf you don't receive the email, check spam or contact support.`,
      suggestions: ['Login help', 'Contact support'],
    };
  }
  if (/(otp|verification|verify)/i.test(text)) {
    return {
      text: `**📧 OTP Issues?**\n\n• Check your **spam/promotions** folder\n• Make sure you entered the correct email\n• Request a **new OTP** after 60 seconds\n• Still not working? Try logging in with password instead\n\nContact **support@gymsword.com** if the issue persists.`,
      suggestions: ['Resend OTP', 'Login with password', 'Contact support'],
    };
  }
  return {
    text: `**👤 Account Help**\n\nI can help you with:\n• 🔐 Login issues\n• 📝 Creating an account\n• 🔑 Password reset\n• 📧 OTP not received\n• ✏️ Update profile\n\nWhat do you need help with?`,
    suggestions: ['Login issue', 'Create account', 'Forgot password', 'OTP not received'],
  };
}

async function handleWallet() {
  return {
    text: `**💰 GymSword Rewards**\n\n• Earn **coins** on every purchase (₹1 = 1 coin)\n• **Refer a friend** — Get 25 coins when they sign up!\n• **Use coins** at checkout for discounts\n• Check your wallet balance in **My Account > Wallet**\n\nWant your referral link? Log in and check the referral section!`,
    suggestions: ['Check my balance', 'Refer a friend', 'How to use coins'],
  };
}

async function handleFaq() {
  const { data: faqs } = await supabase.from('faqs').select('question, answer').eq('is_active', true).order('position').limit(5);
  if (faqs && faqs.length > 0) {
    const lines = faqs.map((f, i) => `${i + 1}. **${f.question}**\n   ${f.answer}`);
    return {
      text: `**📚 Frequently Asked Questions**\n\n${lines.join('\n\n')}\n\nAsk me anything else!`,
      suggestions: ['Shipping policy', 'Return policy', 'Track my order'],
    };
  }
  return {
    text: `I'm here to help! You can ask me about:\n\n• 🛍️ **Products** — Find the perfect gear\n• 📦 **Orders** — Track, cancel, return\n• 💰 **Pricing & Offers** — Check prices & deals\n• 👤 **Account** — Login, OTP, password\n• 📋 **Policies** — Shipping, returns, refunds\n\nWhat would you like to know?`,
    suggestions: ['Show products', 'Track order', 'Return policy', 'Contact support'],
  };
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

async function getChatResponse(messages, userContext = {}) {
  const user = userContext.user;
  const context = new ChatContext();

  // Rebuild context from conversation history
  for (const msg of messages.slice(0, -1)) {
    if (msg.role === 'user') {
      context.messages++;
      const entities = extractEntities(msg.content, user);
      for (const [k, v] of Object.entries(entities)) {
        if (v) context.extracted[k] = v;
      }
    }
  }

  const lastMsg = messages[messages.length - 1];
  const text = lastMsg.content;
  const entities = extractEntities(text, user);

  // If waiting for specific input
  if (context.state === 'awaiting_order') {
    if (entities.orderId) {
      context.reset();
      return handleTrackOrder(entities, user);
    }
  }

  // Classify intent
  let bestIntent = 'faq';
  let bestScore = 0;

  for (const rule of INTENT_PATTERNS) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        const score = rule.priority + (text.length > 5 ? 1 : 0) + (text.length > 20 ? 1 : 0);
        if (score > bestScore) {
          bestScore = score;
          bestIntent = rule.intent;
        }
        break;
      }
    }
  }

  context.addIntent(bestIntent, entities);

  // Handle intent
  let response;
  try {
    switch (bestIntent) {
      case 'track_order':
        response = await handleTrackOrder(entities, user);
        break;
      case 'list_orders':
        response = await handleListOrders(user);
        break;
      case 'cancel_order':
        response = await handleCancelOrder(entities, user);
        break;
      case 'return_exchange':
        response = await handleReturnExchange(entities, user);
        break;
      case 'refund':
        response = await handleRefund(entities, user);
        break;
      case 'shipping':
        response = await handleShipping(entities, user);
        break;
      case 'search_product':
        response = await handleSearchProduct(text);
        break;
      case 'categories':
        response = await handleCategories();
        break;
      case 'pricing':
        response = await handlePricing(text);
        break;
      case 'size_fit':
        response = await handleSizeFit();
        break;
      case 'account':
        response = await handleAccount(text);
        break;
      case 'wallet':
        response = await handleWallet();
        break;
      case 'faq':
        response = await handleFaq();
        break;
      case 'greeting':
        response = RESPONSES.greeting(user);
        break;
      case 'thanks':
        response = RESPONSES.thanks();
        break;
      case 'goodbye':
        response = RESPONSES.goodbye();
        break;
      case 'store_info':
        response = RESPONSES.store_info();
        break;
      case 'contact_human':
        response = RESPONSES.contact_human();
        break;
      case 'feedback':
        response = RESPONSES.feedback();
        break;
      default:
        response = RESPONSES.fallback();
    }
  } catch (err) {
    console.error('Chatbot error:', err.message);
    response = {
      text: `I apologize, but I'm having trouble processing your request right now. Please try again or contact our support team at **support@gymsword.com** for immediate assistance.`,
      suggestions: ['Try again', 'Contact support'],
    };
  }

  // Build reply with suggestions
  let reply = response.text;
  if (response.suggestions && response.suggestions.length > 0) {
    reply += `\n\n💡 ${response.suggestions.map((s, i) => `*${i + 1}. ${s}*`).join('  ')}`;
  }

  // Update context state if needed
  if (response.state) context.setState(response.state, bestIntent, entities);

  return reply;
}

module.exports = { getChatResponse };
