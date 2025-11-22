// const nodemailer = require("nodemailer");
// require("dotenv").config();

// const sendEmail = async (to, subject, html) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER,     
//       pass: process.env.EMAIL_PASS,      
//     },
//   });

//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to,
//     subject,
//     html,
//   };

//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;






const brevo = require("@getbrevo/brevo");
require("dotenv").config();

const sendEmail = async (to, subject, html) => {
  try {
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    const sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.sender = {
      email: process.env.EMAIL_USER, // Gmail allowed
      name: "Book Swap",
    };

    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log("OTP Email Sent via Brevo!");
  } catch (error) {
    console.error("Brevo Error:", error);
    throw new Error("Email failed");
  }
};

module.exports = sendEmail;
