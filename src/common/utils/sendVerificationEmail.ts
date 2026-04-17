import { transporter } from "../../config/mail.service";

export const sendVerificationEmail = async (
  email: string,
  otp: string
) => {
  await transporter.sendMail({
    to: email,
    subject: "Verify your email - OTP",
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center;">
        <h2>Email Verification</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing: 5px;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
      </div>
    `,
  });
};``