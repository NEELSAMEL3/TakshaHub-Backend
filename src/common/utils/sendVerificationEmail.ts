import { transporter } from "../../config/mail.service";

export const sendVerificationEmail = async (
  email: string,
  otp: string,
  type: "verification" | "password-reset" = "verification"
) => {
  const subject = type === "password-reset" 
    ? "Reset your password - OTP" 
    : "Verify your email - OTP";
  
  const message = type === "password-reset"
    ? "Your password reset OTP code is:"
    : "Your OTP code is:";

  await transporter.sendMail({
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center;">
        <h2>${type === "password-reset" ? "Password Reset" : "Email Verification"}</h2>
        <p>${message}</p>
        <h1 style="letter-spacing: 5px;">${otp}</h1>
        <p>This OTP will expire in ${type === "password-reset" ? "15" : "10"} minutes.</p>
      </div>
    `,
  });
};``