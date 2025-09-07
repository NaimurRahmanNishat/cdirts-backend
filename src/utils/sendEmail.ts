import nodemailer from "nodemailer";

const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, 
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, 
      auth: {
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS, 
      },
    });

    const mailOptions = {
      from: `"Your App" <${process.env.SMTP_USER}>`, to, subject, text };

    await transporter.sendMail(mailOptions);
    console.log("📧 Sending email to:", to, "with subject:", subject);;
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error("Email could not be sent");
  }
};

export default sendEmail;