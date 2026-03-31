import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_MAIL,  // ✅ fixed
    pass: process.env.BREVO_SMTP_PASS,  // ✅ fixed
  },
});

export const sendOTP = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"DayFlow" <${process.env.BREVO_SMTP_MAIL}>`, // IMPORTANT
      to: email,
      subject: "Login OTP",
      text: `Your OTP is ${otp}`,
    });

    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("MAIL ERROR:", error);
  }
};