const nodemailer = require('nodemailer');
require('dotenv').config();

let transporterPromise = (async () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    console.log(`Mailer: Configuring custom SMTP server (${host}:${port})...`);
    return nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: parseInt(port) === 465,
      auth: { user, pass }
    });
  } else {
    console.log('Mailer: No custom SMTP credentials. Setting up temporary Ethereal test account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log(`Mailer: Ethereal test account created! User: ${testAccount.user}`);
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (err) {
      console.error('Mailer: Failed to create Ethereal test account, fallback to console logger:', err.message);
      return null;
    }
  }
})();

async function sendAlertEmail(subject, text, html) {
  const transporter = await transporterPromise;
  const mailOptions = {
    from: process.env.SMTP_FROM || 'wisepenny-alerts@example.com',
    to: process.env.SMTP_TO || 'user@example.com',
    subject,
    text,
    html
  };

  if (!transporter) {
    console.log('\n--- EMAIL ALERT SIMULATION (NO SMTP) ---');
    console.log(`Subject: ${subject}`);
    console.log(`To: ${mailOptions.to}`);
    console.log(`Body: ${text}`);
    console.log('----------------------------------------\n');
    return { simulated: true };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Mailer: Email sent successfully!');
    console.log('Message ID:', info.messageId);
    
    // If using Ethereal, log the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('\n==================================================');
      console.log(`📧 VIEW SENT ALERT EMAIL AT: ${previewUrl}`);
      console.log('==================================================\n');
      return { messageId: info.messageId, previewUrl };
    }
    return { messageId: info.messageId };
  } catch (error) {
    console.error('Mailer: Failed to send email alert:', error);
    throw error;
  }
}

module.exports = {
  sendAlertEmail
};
