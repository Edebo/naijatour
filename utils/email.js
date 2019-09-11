const nodemailer = require('nodemailer');

const sendMail = async options => {
  //1)create transporter
  const transporter = nodemailer.createTransport({
    //get all this from mailtrap
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  //2)define the mail options
  const mailOptions = {
    from: 'Adebowale Akande <akandeadebowale0@gmail.com',
    to: options.email,
    subject: options.subject,
    text: options.message
    //html
  };

  //3)sending the mail
  await transporter.sendMail(mailOptions);
};

module.exports = sendMail;
