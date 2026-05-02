const nodemailer = require('nodemailer');
const logger = require('./logger');

const templates = {
  emailVerification: ({ name, verifyUrl }) => ({
    subject: 'Verify your Healing account',
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #fff; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #00f5a0; font-size: 32px; margin: 0;">Healing</h1>
          <p style="color: #888; margin: 4px 0 0;">Your trusted healthcare platform</p>
        </div>
        <h2 style="color: #fff; font-size: 24px;">Welcome, ${name}! 👋</h2>
        <p style="color: #ccc; line-height: 1.6;">Please verify your email address to activate your account and start booking appointments.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}" style="background: linear-gradient(135deg, #00f5a0, #00d4ff); color: #0a0a1a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">Verify Email Address</a>
        </div>
        <p style="color: #666; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, please ignore this email.</p>
      </div>
    `
  }),

  passwordReset: ({ name, resetUrl }) => ({
    subject: 'Reset your Healing password',
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #fff; padding: 40px; border-radius: 16px;">
        <h1 style="color: #00f5a0; font-size: 32px;">Healing</h1>
        <h2 style="color: #fff;">Password Reset Request</h2>
        <p style="color: #ccc;">Hi ${name}, you requested a password reset.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #00f5a0, #00d4ff); color: #0a0a1a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn't request this, please ignore.</p>
      </div>
    `
  }),

  appointmentConfirmation: ({ patientName, doctorName, scheduledAt, appointmentId, type }) => ({
    subject: `Appointment Confirmed - ${appointmentId}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #fff; padding: 40px; border-radius: 16px;">
        <h1 style="color: #00f5a0;">Healing</h1>
        <h2 style="color: #fff;">✅ Appointment Confirmed</h2>
        <p style="color: #ccc;">Hi ${patientName}, your appointment has been booked.</p>
        <div style="background: #1a1a2e; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <p style="margin: 8px 0; color: #ccc;"><strong style="color: #00f5a0;">Doctor:</strong> ${doctorName}</p>
          <p style="margin: 8px 0; color: #ccc;"><strong style="color: #00f5a0;">Date & Time:</strong> ${scheduledAt}</p>
          <p style="margin: 8px 0; color: #ccc;"><strong style="color: #00f5a0;">Type:</strong> ${type}</p>
          <p style="margin: 8px 0; color: #ccc;"><strong style="color: #00f5a0;">ID:</strong> ${appointmentId}</p>
        </div>
        <p style="color: #666; font-size: 14px;">Log in to your Healing dashboard to manage your appointment.</p>
      </div>
    `
  })
};

const sendEmail = async ({ email, subject, template, data, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  const content = template && templates[template]
    ? templates[template](data)
    : { subject, html };

  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'Healing'}" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: content.subject || subject,
    html: content.html || html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Email failed to ${email}: ${err.message}`);
    throw err;
  }
};

module.exports = sendEmail;
