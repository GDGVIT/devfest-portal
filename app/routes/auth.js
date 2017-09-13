var express = require("express");
var passport = require('passport');
var User = require("../models/user");
//var config = require("../../config");
var email = require("../util/email-smtp");
var router = express.Router();
var msg91 = require("msg91")(process.env.MSG_91, "GDGVIT", "transactional" );

module.exports.router = router;
module.exports.init = function(inject){

    router.get("/register",function(req,res){
        if(req.isAuthenticated()){
            return res.redirect("/profile");
        }
        res.locals.errField = "";
        res.locals.req = req;
        res.render("register");
    });

    router.get("/verifyEmail",function(req,res){
        if(!req.query.key)return res.send("Invalid key");
        email.verify(req.query.key.toString(),function(err,obj){
            if(err){
                console.log(err);
                return res.send("Invalid key detected");
            }
            console.log(obj);
            if(!obj.email || !obj.regNo || !obj.userId || !obj.iat)return res.send("Invalid key detected");
            if((new Date()).getTime() - obj.iat*1000 > 24*60*60*1000){
                req.flash("message","Failed to verify email. Token expired. Please register again.");
                return res.redirect('/');
            }
            User.findOne({_id:obj.userId},function(err,user){
                if(err || !user){
                    req.flash("message","Failed to verify email. User not found.");
                    return res.redirect("/");
                }
                user.verified = true;
                user.verifiedAt = new Date();
                user.save(function(err){
                    if(err){
                        req.flash("message","Failed to verify email. Internal server error.");
                        return res.redirect("/");
                    }

                    req.flash("message","Email successfully verified. See you at the event!");
                    return res.redirect("/");
                });
            });
        });
    });

    router.post("/register",function(req,res,next){
        res.locals.req = req;
        res.locals.errField = "";

        req.name = req.body.name ? req.body.name.toString() : "";
        req.regNo = req.body.regNo ? req.body.regNo.toString().toUpperCase() : "";
        req.email = req.body.email ? req.body.email.toString().toLowerCase().trim() : "";
        req.contact = req.body.contact ? req.body.contact.toString() : "";
        req.gender = req.body.gender ? req.body.gender.toString().toLowerCase() : "";
        req.skills = req.body.skills ? req.body.skills.toString().split(",") : [];
        req.skills.forEach(function(skill,i){
            req.skills[i] = skill.toUpperCase().trim();
        });
        req.blockRoom = req.body.blockRoom ? req.body.blockRoom.toString() :"";
        req.github = req.body.github ? req.body.github.toString() : "";
        req.linkedIn = req.body.linkedIn ? req.body.linkedIn.toString() : "";
        req.behance = req.body.behance ? req.body.behance.toString() : "";

        req.password = req.body.password ? req.body.password.toString() : "";

        if(!/^[a-zA-Z ]+$/.test(req.name)){
            return res.render("register",{
                errField : "name"
            });
        }
        if(!/^.{5,}$/.test(req.password)){
            return res.render("register",{
                errField : "password"
            });
        }
        if(!/^\d\d\w\w\w\d\d\d\d$/i.test(req.regNo)){
            return res.render("register",{
                errField : "regNo"
            });
        }
        if(!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/i.test(req.email) || (!req.email.endsWith("@vitstudent.ac.in") && !req.email.endsWith("@vit.ac.in"))){
            return res.render("register",{
                errField : "email"
            });
        }
        if(!/^(\+91|91|\+91 |91 )?\d{9,11}$/.test(req.contact)){
            return res.render("register",{
                errField : "contact"
            });
        }

        User.findOne({
            email : req.email
        },function(err,user){
            if(err){
                req.flash("errMessage","Unable to sobmit. Internal server error.");
                return res.redirect("/register");
            }else{
                if(user){
                    if(user.verified){
                        return res.render("register",{
                            errField : "email",
                            errMessage : "Email already used and verified"
                        });
                    }
                    user.remove(function(err){
                        if(err){
                            req.flash("errMessage","Unable to submit. Internal server error.");
                            return res.redirect("/register");
                        }else{
                            next();
                        }
                    });
                }else{
                    next();
                }
            }
        })
    },function(req, res) {
        User.register(new User({
            name : req.name,
            regNo : req.regNo,
            username : req.email,
            email : req.email,
            dateRegistered : new Date(),
            contact : req.contact,
            gender : req.gender,
            skills : req.skills,
            github : req.github,
            linkedIn : req.linkedIn,
            behance : req.behance,
            blockRoom : req.blockRoom
        }), req.password, function(err, user) {
            if (err) {
                console.log(err);
                res.locals.errMessage = "Registration failed. Please recheck all the fields.";
                return res.render("register");
            }else{
		console.log("sending mail");
                email.sendMail(user,function(err){
                    console.log("mail sent done");
                    if(err){
                        console.log(err);
                        req.flash("message","Failed to send verification email.");
                        return res.redirect("/");
                    }
                    req.flash("message","User registered successfully. Verification email has been sent. The verification link will be valid only for 24 hours.");
                    user.verificationEmailSent = true;
                    user.save();
                    return res.redirect("/");
                })
            }
        });
    });

    router.get("/forgotPassword",function(req,res){
        if(req.isAuthenticated()){
            return res.redirect("/profile");
        }
        res.render("forgotPassword");
    });

    router.post("/sendOTP",function(req,res){
        if(req.isAuthenticated()){
            return res.redirect("/profile");
        }
        var email = "";
        if(req.body.email)email = req.body.email.toString().toLowerCase();
        console.log("Email :: ",email);
        User.findOne({
            email : email
        }).exec(function(err,user){
            if(err){
                return res.sendStatus(500);
            }
            if(!user){
                req.flash("message","User not found");
                return res.redirect("/forgotPassword");
            }
            if(user.otp!=undefined){
                if((user.otpGeneratedAt.getTime() + 900000) > new Date().getTime()){
                    user.otp = Math.floor(Math.random() * 89999)+10000;
                    user.save();
                    user.otpGeneratedAt = new Date();
                }
            }else{
                user.otp = Math.floor(Math.random() * 89999)+10000;
                user.save();
                user.otpGeneratedAt = new Date();
            }
            console.log("OTP generated :: "+user.otp);

            msg91.send(user.contact,"OTP for devfest gdg password reset : "+user.otp+". Valid for 15 minutes.",function(err,response){
                if(err){
                    req.flash("message","Failed to send message.");
                    return res.redirect("/forgotPassword");
                }
                return res.redirect("/otp");
            });

        });
    });

    router.get("/otp",function (req, res) {
        if(req.isAuthenticated()){
            return res.redirect("/profile");
        }
        res.render("otp");
    });

    router.post("/updatePassword",function(req,res){
        if(req.isAuthenticated()){
            return res.redirect("/profile");
        }
        if(!req.body.email || !req.body.otp || !req.body.password || !req.body.password || !req.body.confirmPassword){
            return res.sendStatus(400);
        }
        if(req.body.password != req.body.confirmPassword){
            req.flash("message","Passwords do not match.");
            return res.redirect("/otp");
        }
        var email = req.body.email.toString().toLowerCase();
        var otp = req.body.otp;
        var password = req.body.password;
        if(!/^.{5,}$/.test(req.password)){
            req.flash("message","Password is of minimum 5 characters.");
            return res.redirect("/otp");
        }
        User.findOne({
            email : email
        },function(err,user){
            if(err)return res.sendStatus(500)
            if(!user){
                req.flash("message","User not found");
                return res.redirect("/otp");
            }
            if(user.otp==undefined){
                req.flash("message","OTP not generated");
                return res.redirect("/otp");
            }
            console.log("otpGeneratedAt :: ",(new Date().getTime() - user.otpGeneratedAt.getTime()));
            if((new Date().getTime() - user.otpGeneratedAt.getTime()) > 900000){
                req.flash("message","OTP has expired.");
                return res.redirect("/otp");
            }
            if(user.otp.toString() != otp){
                req.flash("message","Invalid OTP.")
                return res.redirect("/otp")
            }
            user.otp = undefined;
            user.otpGeneratedAt = undefined;
            user.setPassword(password,function (err,user) {
                if(err){
                    req.flash("message","Password update failed.");
                    return res.redirect("/otp");
                }
                user.save();
                req.flash("message","Password updated successfully");
                return res.redirect("/login");
            });

        })
    });

    router.get("/login",function(req,res){
        if(req.isAuthenticated()){
            return res.redirect("/profile");
        }
        res.render("login");
    });

    router.post('/login',function(req,res,next){
        console.log(req.body);

        next();
    }, passport.authenticate('local',{
        failureRedirect: '/login',
        failureFlash: 'true'
    }), function(req, res) {
        console.log("Logged in");
        res.redirect('/profile');
    });

    router.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

}
