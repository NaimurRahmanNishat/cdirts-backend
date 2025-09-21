"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendActivationEmail = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const nodemailer_1 = __importDefault(require("nodemailer"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const sendActivationEmail = async (email, activationCode) => {
    const templatePath = path_1.default.join(__dirname, "../templates/activation.ejs");
    const html = await ejs_1.default.renderFile(templatePath, { activationCode });
    await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Activate Your Account",
        html,
    });
};
exports.sendActivationEmail = sendActivationEmail;
//# sourceMappingURL=email.js.map