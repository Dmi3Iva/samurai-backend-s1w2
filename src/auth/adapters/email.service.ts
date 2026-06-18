import * as nodemailer from "nodemailer";
import { appConfig } from "../../common/appConfig";
import { UUID } from "crypto";

const FROM_EMAIL = "auth@samurai-test.xyz";
const REGISTRATION_CONFIRMATION_EMAIL_SUBJECT = "Registration confirmation";

const createRegistrationConfirmationEmailHtml = (confirmationCode: string) => {
  const host = appConfig.FRONT_URL;
  return `<h1>Thank you for registration!</h1>
  <p>To finish registration please follow the link below:
       <a href='${host}?code=${confirmationCode}'>complete registration</a>
   </p>`;
};

export const emailService = {
  async sendRegistrationConfirmationEmail({
    toEmail,
    confirmationCode,
  }: {
    toEmail: string;
    confirmationCode: UUID;
  }): Promise<boolean> {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.resend.com",
        secure: true,
        port: 465,
        auth: {
          user: "resend",
          pass: appConfig.SEND_MAIL_API_KEY,
        },
      });

      const info = await transporter.sendMail({
        from: FROM_EMAIL,
        to: toEmail,
        subject: REGISTRATION_CONFIRMATION_EMAIL_SUBJECT,
        html: createRegistrationConfirmationEmailHtml(confirmationCode),
      });
      console.log("Message sent: %s", info.messageId);
      return true;
    } catch (e) {
      console.error("error while tried to send email", e);
      return false;
    }
  },
};
