import nodemailer from 'nodemailer'
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
    service : "gmail",
    auth : {
        user : process.env.EMAIL,
        pass : process.env.EMAIL_PASS,
    }
});

export const sendOTP = async(email, otp) => {
    await transporter.sendMail({
        to : email,
        subject : "Login OTP",
        text : `Your OTP is ${otp}`
    });
};