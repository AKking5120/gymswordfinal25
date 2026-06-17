const nodemailer = require('nodemailer');
const supabase = require('../config/db');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  family: 4,
});

const FROM = process.env.SMTP_FROM || 'noreply@gymsword.com';
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';

async function logEmail(userId, type, recipient, subject, status, error) {
  try {
    await supabase.from('email_logs').insert({
      user_id: userId,
      email_type: type,
      recipient,
      subject,
      status,
      error_message: error || null,
    });
  } catch (e) {
    console.error('Failed to log email:', e.message);
  }
}

async function sendMail({ to, subject, html, userId, type, attachments }) {
  try {
    const info = await transporter.sendMail({ from: FROM, to, subject, html, attachments });
    console.log(`Email (${type}) sent to ${to}:`, info.messageId);
    await logEmail(userId, type, to, subject, 'sent');
  } catch (err) {
    console.error(`Email (${type}) failed for ${to}:`, err.message, err.stack);
    await logEmail(userId, type, to, subject, 'failed', err.message);
    throw err;
  }
}

// ─── Shared Styles ──────────────────────────────────────────

const STYLES = {
  body: 'margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  container: 'background:#ffffff;max-width:600px;width:100%;margin:0 auto',
  header: 'padding:40px 40px 0',
  content: 'padding:0 40px',
  footer: 'padding:20px 40px 40px',
  h1: 'font-size:24px;font-weight:900;margin:0 0 8px;text-transform:uppercase;letter-spacing:-0.5px;color:#111',
  h2: 'font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#444;margin:0 0 12px',
  p: 'margin:0 0 16px;font-size:14px;color:#666;line-height:1.6',
  small: 'font-size:12px;color:#888;line-height:1.6',
  divider: 'border:none;border-top:1px solid #e5e5e5;margin:24px 0',
  thickDivider: 'border:none;border-top:2px solid #111;margin:24px 0',
  box: 'background:#f4f4f4;padding:24px;margin:0 0 20px',
  btn: 'display:inline-block;background:#111;color:#fff!important;text-decoration:none;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:14px 32px',
  tableHead: 'background:#111;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:1px;padding:10px 12px;text-align:left',
  tableCell: 'padding:12px;font-size:13px;color:#333;border-bottom:1px solid #e5e5e5',
  tableAlt: 'background:#f9f9f9',
};

function shell(body) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="${STYLES.body}">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="${STYLES.container}">
<tr><td style="${STYLES.header}">
<table width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#111;font-family:inherit;text-transform:uppercase">GYM<span style="color:#888">SWORD</span></td>
</tr></table>
<hr style="${STYLES.thickDivider}">
</td></tr>
<tr><td style="${STYLES.content}">${body}</td></tr>
<tr><td style="${STYLES.footer}">
<hr style="${STYLES.divider}">
<p style="${STYLES.small}">GymSword — Forge Your Legacy<br>
Need help? <a href="mailto:support@gymsword.com" style="color:#111;text-decoration:underline">support@gymsword.com</a></p>
</td></tr>
</table>
</td></tr></table></body></html>`;
}

// ─── Minimal Shell (auth / OTP emails) ──────────────────────

function minimalShell(body) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
</head><body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px"><tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff">
<tr><td style="padding:0 0 24px;border-bottom:1px solid #eee">
<span style="font-size:18px;font-weight:900;letter-spacing:-0.5px;color:#111">GymSword</span>
</td></tr>
<tr><td style="padding:24px 0">${body}</td></tr>
<tr><td style="padding:16px 0 0;border-top:1px solid #eee">
<table width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="font-size:11px;color:#999;line-height:1.6">
GymSword Team &mdash; noreply@gymsword.com<br>
<a href="mailto:support@gymsword.com" style="color:#777;text-decoration:underline">support@gymsword.com</a>
</td>
</tr></table>
</td></tr>
</table>
</td></tr></table></body></html>`;
}

// ─── OTP Verification ───────────────────────────────────────

function verificationOTP(name, otp) {
  return minimalShell(`
    <p style="margin:0 0 16px;font-size:14px;color:#333;line-height:1.5">Hello ${name},</p>
    <div style="margin:0 0 20px">
      <span style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px">One-Time Password</span>
      <div style="font-size:36px;font-weight:900;color:#111;letter-spacing:5px">${otp}</div>
    </div>
    <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.6">This is your one-time-password for GymSword login. We request you to not share this OTP with anyone else.</p>
    <div style="margin:0 0 20px;padding:14px 16px;background:#f8f8f8;border-radius:2px">
      <p style="margin:0 0 2px;font-size:13px;color:#777;line-height:1.5">This OTP will expire in <strong style="color:#555">10 minutes</strong>.</p>
      <p style="margin:0;font-size:13px;color:#777;line-height:1.5">Never share your OTP with anyone, including GymSword support staff.</p>
    </div>
    <p style="margin:0;font-size:14px;color:#333">Regards,<br>GymSword Team</p>
  `);
}

// ─── Welcome ─────────────────────────────────────────────────

function welcome(name) {
  return shell(`
    <h1 style="${STYLES.h1}">Welcome to GymSword</h1>
    <p style="${STYLES.p}">Hey ${name},</p>
    <p style="${STYLES.p}">Thank you for joining GymSword. You are now part of a community built on strength, discipline, and performance.</p>
    <div style="${STYLES.box}">
      <h3 style="margin:0 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;color:#111;letter-spacing:1px">Your Benefits</h3>
      <ul style="margin:0;padding:0 0 0 16px;font-size:13px;color:#555;line-height:2">
        <li>Earn rewards with every purchase</li>
        <li>Refer friends and get bonus coins</li>
        <li>Early access to new drops</li>
        <li>Exclusive member-only offers</li>
      </ul>
    </div>
    <table cellpadding="0" cellspacing="0"><tr><td><a href="${SITE_URL}/shop" style="${STYLES.btn}">Start Shopping →</a></td></tr></table>
    <p style="margin:20px 0 0;font-size:13px;color:#888;line-height:1.6">Forge your legacy.<br><strong>The GymSword Team</strong></p>
  `);
}

// ─── Forgot Password OTP ────────────────────────────────────

function forgotPasswordOTP(name, otp) {
  return minimalShell(`
    <p style="margin:0 0 16px;font-size:14px;color:#333;line-height:1.5">Hello ${name},</p>
    <div style="margin:0 0 20px">
      <span style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px">One-Time Password</span>
      <div style="font-size:36px;font-weight:900;color:#111;letter-spacing:5px">${otp}</div>
    </div>
    <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.6">This is your one-time-password for GymSword password reset. We request you to not share this OTP with anyone else.</p>
    <div style="margin:0 0 20px;padding:14px 16px;background:#f8f8f8;border-radius:2px">
      <p style="margin:0 0 2px;font-size:13px;color:#777;line-height:1.5">This OTP will expire in <strong style="color:#555">10 minutes</strong>.</p>
      <p style="margin:0;font-size:13px;color:#777;line-height:1.5">Never share your OTP with anyone, including GymSword support staff.</p>
    </div>
    <p style="margin:0;font-size:14px;color:#333">Regards,<br>GymSword Team</p>
  `);
}

// ─── Login Notification ─────────────────────────────────────

function loginNotification(name, time, device, browser, ip) {
  return minimalShell(`
    <p style="margin:0 0 16px;font-size:14px;color:#333;line-height:1.5">Hello ${name},</p>
    <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6">A new sign-in was detected on your GymSword account.</p>
    <div style="margin:0 0 20px;padding:14px 16px;background:#f8f8f8;border-radius:2px;font-size:13px;color:#555;line-height:1.8">
      <strong style="color:#333">Time:</strong> ${time}<br>
      <strong style="color:#333">Device:</strong> ${device || 'Unknown'}<br>
      <strong style="color:#333">Browser:</strong> ${browser || 'Unknown'}<br>
      <strong style="color:#333">IP Address:</strong> ${ip || 'Unknown'}
    </div>
    <p style="margin:0 0 16px;font-size:13px;color:#777;line-height:1.5">If this was you, ignore this alert. If not, please secure your account immediately.</p>
    <table cellpadding="0" cellspacing="0"><tr><td><a href="${SITE_URL}/account/settings" style="display:inline-block;background:#111;color:#fff!important;text-decoration:none;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:12px 28px;border-radius:2px">Secure Account</a></td></tr></table>
    <p style="margin:16px 0 0;font-size:14px;color:#333">Regards,<br>GymSword Team</p>
  `);
}

// ─── Order Confirmation (Detailed) ──────────────────────────

function orderConfirmation(name, order, items) {
  const itemsHtml = items.map((i, idx) => `
    <tr${idx % 2 === 1 ? ` style="background:#f9f9f9"` : ''}>
      <td style="${STYLES.tableCell}">
        <table cellpadding="0" cellspacing="0"><tr>
          ${i.image_url ? `<td width="48" style="padding-right:10px"><img src="${i.image_url}" width="48" height="48" style="display:block;object-fit:cover;background:#f4f4f4"></td>` : ''}
          <td><strong style="font-size:13px;color:#111">${i.name}</strong></td>
        </tr></table>
      </td>
      <td style="${STYLES.tableCell};text-align:center">×${i.quantity}</td>
      <td style="${STYLES.tableCell};text-align:right;font-weight:700">₹${(i.price * i.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const shipping = order.shipping || 0;
  const savings = (order.discount_amount || 0);

  return shell(`
    <h1 style="${STYLES.h1}">Order Confirmed</h1>
    <p style="${STYLES.p}">Hey ${name},</p>
    <p style="${STYLES.p}">Thank you for your order! Your order has been confirmed and is being processed.</p>

    <div style="${STYLES.box}">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#333;line-height:1.8">
        <tr><td style="color:#888;width:80px">Order ID</td><td style="font-weight:700">#${order.order_number || order.id}</td></tr>
        <tr><td style="color:#888">Date</td><td>${new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
        ${order.tracking_number ? `<tr><td style="color:#888">Tracking</td><td>${order.tracking_number}</td></tr>` : ''}
        ${order.estimated_delivery ? `<tr><td style="color:#888">Est. Delivery</td><td>${new Date(order.estimated_delivery).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>` : ''}
      </table>
    </div>

    <h2 style="${STYLES.h2}">Order Summary</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:collapse">
      <thead><tr>
        <th style="${STYLES.tableHead}">Item</th>
        <th style="${STYLES.tableHead};text-align:center;width:40px">Qty</th>
        <th style="${STYLES.tableHead};text-align:right;width:80px">Total</th>
      </tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 4px;font-size:13px;color:#555;line-height:2">
      <tr><td style="width:100px">Subtotal</td><td style="text-align:right">₹${order.subtotal.toFixed(2)}</td></tr>
      ${savings > 0 ? `<tr><td>Discount ${order.coupon_code ? `(${order.coupon_code})` : ''}</td><td style="text-align:right;color:#4ade80">-₹${savings.toFixed(2)}</td></tr>` : ''}
      <tr><td>Shipping</td><td style="text-align:right">${shipping > 0 ? `₹${shipping.toFixed(2)}` : 'FREE'}</td></tr>
      <tr><td>Taxes (GST)</td><td style="text-align:right">₹${(order.tax || 0).toFixed(2)}</td></tr>
    </table>
    <hr style="${STYLES.divider}">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:16px;font-weight:900;color:#111;line-height:2">
      <tr><td>Total</td><td style="text-align:right">₹${order.total_amount.toFixed(2)}</td></tr>
    </table>
    ${savings > 0 ? `<p style="margin:12px 0 0;font-size:13px;color:#4ade80;font-weight:600">You saved ₹${savings.toFixed(2)}</p>` : ''}

    <hr style="${STYLES.divider}">

    <h2 style="${STYLES.h2}">Customer Information</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#555;line-height:1.8">
      ${order.shipping_address ? `<tr><td valign="top" style="padding-right:20px;width:50%">
        <strong style="color:#111;display:block;margin-bottom:4px">Shipping Address</strong>
        ${order.shipping_address.replace(/\n/g, '<br>')}
      </td>` : ''}
      ${order.billing_address ? `<td valign="top" style="width:50%">
        <strong style="color:#111;display:block;margin-bottom:4px">Billing Address</strong>
        ${order.billing_address.replace(/\n/g, '<br>')}
      </td>` : ''}</tr></table>
    </table>

    <hr style="${STYLES.divider}">

    <table cellpadding="0" cellspacing="0"><tr><td><a href="${SITE_URL}/order/${order.id}" style="${STYLES.btn}">View Order →</a></td></tr></table>
    <p style="margin:12px 0 0;font-size:13px;color:#888">Track your order anytime: <a href="${SITE_URL}/track-order/${order.id}" style="color:#111;font-weight:600;text-decoration:underline">${SITE_URL}/track-order/${order.id}</a></p>
  `);
}

// ─── Shipping Status Email ──────────────────────────────────

function shippingStatus(name, order, status, items) {
  const statusSeq = ['pending','confirmed','processing','shipped','out_for_delivery','delivered'];
  const statusLabels = {
    pending: 'Order Placed', confirmed: 'Confirmed', processing: 'Packed',
    shipped: 'Shipped', out_for_delivery: 'Out For Delivery', delivered: 'Delivered',
    cancelled: 'Cancelled', returned: 'Returned',
  };
  const label = statusLabels[status] || status;
  const idx = statusSeq.indexOf(status);

  let itemsHtml = '';
  if (items && items.length) {
    itemsHtml = items.map((i, idx2) => `
      <tr${idx2 % 2 === 1 ? ` style="background:#f9f9f9"` : ''}>
        <td style="${STYLES.tableCell}"><strong>${i.name}</strong></td>
        <td style="${STYLES.tableCell};text-align:center">×${i.quantity}</td>
        <td style="${STYLES.tableCell};text-align:right">₹${(i.price * i.quantity).toFixed(2)}</td>
      </tr>
    `).join('');
  }

  return shell(`
    <h1 style="${STYLES.h1}">${label}</h1>
    <p style="${STYLES.p}">Hey ${name},</p>
    <p style="${STYLES.p}">Your order status has been updated.</p>

    <div style="${STYLES.box}">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#333;line-height:1.8">
        <tr><td style="color:#888;width:100px">Order ID</td><td style="font-weight:700">#${order.order_number || order.id}</td></tr>
        <tr><td style="color:#888">Status</td><td style="font-weight:700">${label}</td></tr>
        ${order.tracking_number ? `<tr><td style="color:#888">Tracking No.</td><td>${order.tracking_number}</td></tr>` : ''}
        ${order.estimated_delivery ? `<tr><td style="color:#888">Est. Delivery</td><td>${new Date(order.estimated_delivery).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>` : ''}
      </table>
    </div>

    ${idx >= 0 ? `
    <div style="${STYLES.box};padding:16px 24px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>${statusSeq.map((s, i) => `
          <td style="text-align:center;padding:0 4px;width:${100/statusSeq.length}%">
            <div style="width:24px;height:24px;border-radius:50%;margin:0 auto 6px;background:${i <= idx ? '#111' : '#ddd'};color:#fff;font-size:11px;font-weight:700;line-height:24px">✓</div>
            <div style="font-size:9px;color:${i <= idx ? '#111' : '#999'};font-weight:${i <= idx ? '700' : '400'};text-transform:uppercase">${statusLabels[s].replace(' ','<br>')}</div>
          </td>
        `).join('')}</tr>
      </table>
    </div>` : ''}

    ${itemsHtml ? `
    <h2 style="${STYLES.h2}">Order Summary</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:collapse">
      <thead><tr>
        <th style="${STYLES.tableHead}">Item</th>
        <th style="${STYLES.tableHead};text-align:center;width:40px">Qty</th>
        <th style="${STYLES.tableHead};text-align:right;width:80px">Total</th>
      </tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#555;line-height:2">
      <tr><td style="width:100px">Subtotal</td><td style="text-align:right">₹${(order.subtotal || 0).toFixed(2)}</td></tr>
      ${(order.discount_amount || 0) > 0 ? `<tr><td>Discount</td><td style="text-align:right;color:#4ade80">-₹${(order.discount_amount || 0).toFixed(2)}</td></tr>` : ''}
      <tr><td>Shipping</td><td style="text-align:right">${(order.shipping || 0) > 0 ? `₹${(order.shipping || 0).toFixed(2)}` : 'FREE'}</td></tr>
    </table>
    <hr style="${STYLES.divider}">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:16px;font-weight:900;color:#111;line-height:2">
      <tr><td>Total</td><td style="text-align:right">₹${(order.total_amount || 0).toFixed(2)}</td></tr>
    </table>
    ` : ''}

    <hr style="${STYLES.divider}">
    <table cellpadding="0" cellspacing="0"><tr><td><a href="${SITE_URL}/track-order/${order.id}" style="${STYLES.btn}">Track My Order →</a></td></tr></table>
  `);
}

// ─── Public API ──────────────────────────────────────────────

async function sendVerificationOTP(user, otp) {
  await sendMail({ to: user.email, subject: 'GymSword Login OTP', html: verificationOTP(user.name, otp), userId: user.id, type: 'email_verification' });
}

async function sendWelcomeEmail(user) {
  await sendMail({ to: user.email, subject: 'Welcome to GymSword', html: welcome(user.name), userId: user.id, type: 'welcome' });
}

async function sendForgotPasswordOTP(user, otp) {
  await sendMail({ to: user.email, subject: 'GymSword Password Reset OTP', html: forgotPasswordOTP(user.name, otp), userId: user.id, type: 'forgot_password' });
}

async function sendLoginNotification(user, details) {
  await sendMail({ to: user.email, subject: 'New Login Detected', html: loginNotification(user.name, details.time, details.device, details.browser, details.ip), userId: user.id, type: 'login_notification' });
}

async function sendLoginOTP(user, otp) {
  await sendMail({ to: user.email, subject: 'GymSword Login Verification Code', html: verificationOTP(user.name, otp), userId: user.id, type: 'login_otp' });
}

async function sendOrderConfirmation(user, order, items, invoicePath) {
  const attachments = invoicePath ? [{ filename: `invoice-${order.id}.pdf`, path: invoicePath }] : [];
  await sendMail({
    to: user.email,
    subject: `Order Confirmed - #${order.order_number || order.id}`,
    html: orderConfirmation(user.name, order, items),
    userId: user.id,
    type: 'order_confirmation',
    attachments,
  });
}

async function sendShippingStatus(user, order, status, items) {
  await sendMail({
    to: user.email,
    subject: `Order ${statusLabels[status] || status} - #${order.order_number || order.id}`,
    html: shippingStatus(user.name, order, status, items),
    userId: user.id,
    type: `shipping_${status}`,
  });
}

const statusLabels = {
  pending: 'Placed', confirmed: 'Confirmed', processing: 'Packed',
  shipped: 'Shipped', out_for_delivery: 'Out For Delivery', delivered: 'Delivered',
  cancelled: 'Cancelled', returned: 'Returned',
};

module.exports = {
  sendVerificationOTP,
  sendWelcomeEmail,
  sendForgotPasswordOTP,
  sendLoginNotification,
  sendLoginOTP,
  sendOrderConfirmation,
  sendShippingStatus,
};
