// import { Issue } from "../models/issu.model";
// import { Request, Response } from "express";

// // OTP Generator
// function generateOTP() {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }

// export const createIssue = async (req:Request, res:Response) => {
//   try {
//     const { title, description, phone, location } = req.body;
//     const otp = generateOTP();

//     const newIssue = await Issue.create({
//       title,
//       description,
//       phone,
//       location,
//       createdBy: req.user._id, // auth middleware থেকে আসবে
//       otpCode: otp,
//       otpExpire: new Date(Date.now() + 5 * 60 * 1000), // 5 min expire
//     });

//     // এখানে SMS Gateway দিয়ে OTP পাঠাবে
//     // sendSms(phone, `Your OTP is ${otp}`);

//     res.status(200).json({ 
//       message: "OTP sent to phone. Please verify to complete posting.", 
//       issueId: newIssue._id 
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const verifyIssue = async (req, res) => {
//   try {
//     const { issueId, otp } = req.body;

//     const issue = await Issue.findById(issueId);
//     if (!issue) return res.status(404).json({ message: "Issue not found" });

//     if (issue.otpCode !== otp || issue.otpExpire < new Date()) {
//       return res.status(400).json({ message: "Invalid or expired OTP" });
//     }

//     issue.verified = true;
//     issue.otpCode = undefined;
//     issue.otpExpire = undefined;
//     await issue.save();

//     res.status(200).json({ message: "Issue verified successfully", issue });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
