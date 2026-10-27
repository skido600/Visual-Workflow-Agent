export class SMTPservice {
  private static EMAIL_API_URL =
    "https://emailsender-theta.vercel.app/send-email";

  // private static resend = new Resend(process.env.RESEND_API_KEY);

  public static async sendEmail({
    to,
    subject,
    html,
    text,
  }: any): Promise<void> {
    const response = await fetch(this.EMAIL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Email sending failed (${response.status}): ${errorText}`,
      );
    }
  }
}
