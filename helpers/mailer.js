"use strict";
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_ACCOUNT,
    pass: process.env.EMAIL_PASSWORD
  }
});

let sendEmail = function(to, subject, text, html) {
  // setup email data with unicode symbols
  let mailOptions = {
    from: '"Bloomen Platform" <' + process.env.EMAIL_ACCOUNT + ">", // sender address
    to: to,
    subject: subject, // Subject line
    text: text, // plain text body
    html: html // html body
  };

  return new Promise((resolve, reject) => {
    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return reject(error);
      }

      resolve(info);
    });
  });
};

module.exports = {
  sendEmail: sendEmail
};
