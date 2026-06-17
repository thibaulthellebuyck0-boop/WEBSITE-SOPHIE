const nodemailer = require("nodemailer");

/** Inkomende formulieren, afspraken en meldingen van de website. */
const NOTIFICATION_EMAIL =
  process.env.NOTIFICATION_EMAIL || "info@sophietechnologies.be";

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

function isMailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

/**
 * @param {{ subject: string, html: string, text?: string }} mail
 * @returns {Promise<boolean>}
 */
async function sendNotificationEmail(mail) {
  const transporter = getTransporter();
  if (!transporter) return false;

  try {
    await transporter.sendMail({
      from: `"Sophie Technologies" <${process.env.GMAIL_USER}>`,
      to: NOTIFICATION_EMAIL,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    return true;
  } catch (err) {
    console.error("Notification e-mail mislukt:", err.message);
    return false;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = {
  NOTIFICATION_EMAIL,
  isMailConfigured,
  sendNotificationEmail,
  escapeHtml,
};
