const nodemailer = require('nodemailer');

function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getFrontendBase() {
  const base = (process.env.FRONTEND_URL || 'http://localhost:5173/RKVP').replace(/\/$/, '');
  return base;
}

function buildResetUrl(rawToken) {
  return `${getFrontendBase()}/auth/reset-password?token=${encodeURIComponent(rawToken)}`;
}

function createTransport() {
  const port = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendPasswordResetEmail(to, resetUrl) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const transport = createTransport();

  await transport.sendMail({
    from,
    to,
    subject: 'Сброс пароля — Святое Торжище',
    text: `Здравствуйте!\n\nДля сброса пароля перейдите по ссылке (действует 1 час):\n${resetUrl}\n\nЕсли вы не запрашивали сброс, проигнорируйте это письмо.`,
    html: `<p>Здравствуйте!</p><p>Для сброса пароля перейдите по ссылке (действует 1 час):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Если вы не запрашивали сброс, проигнорируйте это письмо.</p>`,
  });
}

module.exports = {
  isMailConfigured,
  buildResetUrl,
  sendPasswordResetEmail,
};
