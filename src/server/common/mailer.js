const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const config = require('../config')

const options = {
  auth: {
    api_user: config.sendGridUserName,
    api_key: config.sendGridPassword
  }
}

const client = nodemailer.createTransport(sgTransport(options));

module.exports = client
