import nodemailer from "nodemailer";

export function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendVerificationEmail({ to, name, verifyUrl }) {
  if (!hasSmtpConfig()) {
    console.log(`Email verification link for ${to}: ${verifyUrl}`);
    return { sent: false, verifyUrl };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: "Verify your Omega Tracker email",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.55;color:#1c2230">
        <h2>Verify your email</h2>
        <p>Hi ${name || "there"},</p>
        <p>Confirm this email address to activate your Omega Tracker account.</p>
        <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 18px;background:#6f725f;color:#fff;text-decoration:none;border-radius:8px">Verify email</a></p>
        <p>If the button does not work, paste this link into your browser:</p>
        <p>${verifyUrl}</p>
      </div>
    `,
  });

  return { sent: true };
}
