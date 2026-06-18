require('dotenv').config();
const app = require('./app');

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason?.message || reason);
});
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err?.message || err);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
});
