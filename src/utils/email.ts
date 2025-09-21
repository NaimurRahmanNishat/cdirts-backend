import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendActivationEmail = async (email: string, activationCode: string) => {
  const templatePath = path.join(__dirname, "../templates/activation.ejs");

  const html = await ejs.renderFile(templatePath, { activationCode });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Activate Your Account",
    html,
  });
};