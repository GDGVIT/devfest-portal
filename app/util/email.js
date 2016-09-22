var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var config = require("../../config");

var jwt = require("jsonwebtoken");
var fs = require("fs")

var emailFormat = fs.readFileSync(__dirname+"/emailFormat.txt","utf8");
console.log("Email format loaded");
var options = {
    auth: {
        api_key: config.sendgrid.key
    }
}

var signingKey = config.signingKey;

var options = {
    auth: {
        api_user: config.sendgrid.username,
        api_key:  config.sendgrid.password
    }
}

var mailer = nodemailer.createTransport(sgTransport(options));


module.exports.sendMail = function(user,callback){
console.log("signing");
    jwt.sign({
        email : user.email,
        regNo : user.regNo,
        userId : user._id.toString()
    }, signingKey, { algorithm: "HS256" }, function(err, token) {
        if(err)return callback(err);
        var link = config.verificationLink + token;
        var html = emailFormat.split("{{link}}").join(link);

        console.log("Link generated");
        var email = {
            to: [user.email],
            from: "noreply@gdgvitvellore.com",
            subject: "Email Confirmation",
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
