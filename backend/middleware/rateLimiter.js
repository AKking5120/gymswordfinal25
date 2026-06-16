const requestCounts = new Map();

const rateLimiter = (maxRequests = 5, windowMs = 60000) => {
  return (req, res, next) => {
    const key = req.ip + ':' + req.originalUrl;
    const now = Date.now();
    if (!requestCounts.has(key)) {
      requestCounts.set(key, []);
    }
    const timestamps = requestCounts.get(key).filter(t => now - t < windowMs);
    if (timestamps.length >= maxRequests) {
      return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
    }
    timestamps.push(now);
    requestCounts.set(key, timestamps);
    next();
  };
};

module.exports = { rateLimiter };
