const nodemailer = require("nodemailer");

// 1️⃣ Create reusable transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // your@gmail.com
    pass: process.env.GMAIL_APP_PASS, // 16-char app password
  },
});

// 2️⃣ Function to send password email
async function sendPasswordEmail(to, fullName, password) {
  const loginUrl = "https://app.skillspardha.com";

  const mailOptions = {
    from: `"SkillSpardha" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your SkillSpardha Login Password",
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eaeaea;border-radius:10px;background-color:#f9f9f9;">
      <h2 style="color:#1a73e8;text-align:center;">Welcome to SkillSpardha!</h2>
      <p>Hello <strong>${fullName}</strong>,</p>
      <p>We’re excited to have you on board. Your payment was successfully received ✅</p>
      <p>Here are your login credentials:</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
          <td style="padding:8px;border:1px solid #ddd;"><strong>Email:</strong></td>
          <td style="padding:8px;border:1px solid #ddd;">${to}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #ddd;"><strong>Password:</strong></td>
          <td style="padding:8px;border:1px solid #ddd;">${password}</td>
        </tr>
      </table>

      <div style="text-align:center;margin:30px 0;">
        <a href="${loginUrl}" style="background-color:#1a73e8;color:white;padding:12px 25px;text-decoration:none;border-radius:5px;font-weight:bold;display:inline-block;">
          Login to SkillSpardha
        </a>
      </div>

      <p style="font-size:12px;color:#555;">If you didn’t create an account, please ignore this email.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
      <p style="font-size:12px;color:#888;text-align:center;">&copy; 2026 SkillSpardha.com. All rights reserved.</p>
    </div>
  `,
  };

  await transporter.sendMail(mailOptions);
}

// 3️⃣ Export both
module.exports = {
  transporter,
  sendPasswordEmail,
};
