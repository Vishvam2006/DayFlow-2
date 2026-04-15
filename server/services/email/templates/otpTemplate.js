import { buildEmailLayout } from "./baseTemplate.js";

export function buildOtpEmailTemplate({ otp, expiresInMinutes = 5 }) {
  const title = "Your DayFlow HRMS login code";
  const html = buildEmailLayout({
    title,
    previewText: `Your one-time login code is ${otp}. It expires in ${expiresInMinutes} minutes.`,
    eyebrow: "Secure Login",
    heading: "Your one-time verification code",
    intro: `Use the code below to complete your sign in. This code expires in ${expiresInMinutes} minutes.`,
    bodyHtml: `
      <div style="padding:20px;border:1px solid #cbd5e1;border-radius:16px;background:#f8fafc;text-align:center;">
        <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;font-weight:700;">Login OTP</p>
        <p style="margin:0;font-size:36px;line-height:1.1;letter-spacing:0.28em;font-weight:800;color:#0f172a;">
          ${otp}
        </p>
      </div>
      <p style="margin:20px 0 0;font-size:14px;line-height:1.7;color:#475569;">
        If you did not request this code, you can safely ignore this email. For your security, never share the OTP with anyone.
      </p>
    `,
  });

  const text = [
    "DayFlow HRMS",
    "",
    `Your login OTP is: ${otp}`,
    `This code expires in ${expiresInMinutes} minutes.`,
    "",
    "If you did not request this code, you can ignore this email.",
  ].join("\n");

  return {
    subject: title,
    html,
    text,
  };
}
