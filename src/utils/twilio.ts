import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_SID!,
  process.env.TWILIO_AUTH!
);

export async function sendSMS(phone: string, otp: string) {
  try {
    await client.messages.create({
      body: `Your OTP code is: ${otp}`,
      from: process.env.TWILIO_PHONE,
      to: phone,   // must be use this format (+880... for Bangladeshi number)
    });
    console.log(`✅ OTP sent to ${phone}`);
  } catch (error) {
    console.error("SMS sending failed:", error);
    throw new Error("SMS sending failed");
  }
}
