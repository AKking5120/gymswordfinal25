const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admin access required' });
};

// alias so both names work
const isAdmin = adminOnly;

module.exports = { adminOnly, isAdmin };