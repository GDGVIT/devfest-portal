var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var config = require("../../config");
var fs = require("fs");

var jwt = require("jsonwebtoken");

var emailFormat = fs.readFileSync(__dirname+"/emailFormat.txt","utf8");

var signingKey = config.signingKey;

var options = {
    host: 'smtp.gmail.com',
    port: 25,
    auth: {
        user: config.gmail.user,
        pass: config.gmail.password
    }
};

var mailer = nodemailer.createTransport(smtpTransport(options));


module.exports.sendMail = function(user,callback){
    jwt.sign({
        email : user.email,
        regNo : user.regNo,
        userId : user._id.toString(),
        sentAt : new Date().getTime
    }, signingKey, { algorithm: "HS256" }, function(err, token) {
        if(err)return callback(err);
        var link = config.verificationLink + token;
        var html = emailFormat.split("{{link}}").join(link);

        console.log("Link generated");
        var email = {
            to: [user.email],
            from: "devfest@gdgvitvellore.com",
            subject: "Verify your GDG Devfest'16",
            text: "Verify your GDG Devfest'16",
            html: html
        };
        console.log("mail sent");
        mailer.sendMail(email,callback);
    });
}

module.exports.verify = function(token,callback){
    jwt.verify(token,signingKey,callback);
}
