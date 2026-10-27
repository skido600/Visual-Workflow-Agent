import { SMTPservice } from "./email";
import { getAppUrl } from "./uth-tokens";
export const sendVerificationEmail = async (email: string, token: string) => {
  const url = `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}`;

  await SMTPservice.sendEmail({
    to: email,
    subject: "Verify your email",
    text: `Verify your email using this link: ${url}`,
    html: `
      <h2>Verify your email</h2>
      <p>Click below to verify your email address.</p>
      <a href="${url}">Verify email</a>
      <p>This link expires in 15 minutes.</p>
    `,
  });
};

export const sendPasswordResetEmail = async (email: string, otp: string) => {
  await SMTPservice.sendEmail({
    to: email,
    subject: "Your password reset code",
    text: `Your password reset code is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2>Reset your password</h2>
        <p>Use the code below to reset your password.</p>
        <div style="padding: 20px; background: #f4f4f5; border-radius: 12px; text-align: center;">
          <h1 style="letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't request a password reset, you can ignore this email.</p>
      </div>
    `,
  });
};
