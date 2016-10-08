var passport = require('passport');
var config = require("../config");
var jwt = require("jsonwebtoken");

var $ = module.exports;

$.allRequest = function(req,res,next){
    res.locals.message = req.flash("message")[0] || "";
    res.locals.errMessage = req.flash("errMessage")[0] || "";
        console.log(res.locals.message);
    //if(res.locals.message=="")res.locals.message = undefined;
    //if(res.locals.errMessage=="")res.locals.errMessage = undefined;
    res.locals.user = req.user;
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.errors = {};
    next();
}

$.protectedRoute = function(req,res,next){
    if(req.isAuthenticated()){
        next();
    }else{
        req.flash("errMessage","You need to be logged in to continue.");
        res.redirect("/auth/login");
    }
}

$.autoLogin = function(req,res,next){
    if(req.isAuthenticated()){
            next();
    }else{
        req.body.username = "mohdakram.ansari2015@vit.ac.in";
        req.body.password = "12345";
        passport.authenticate('local')(req,res,next);
    }
}

$.isLoggedIn = function (req, res, next) {
    if(req.isAuthenticated()){
        next();
    }else{
        return res.redirect("/login");
    }
}

$.isVerified = function (req, res, next) {
    if(req.user.verified){
        next();
    }else{
        req.flash("message","Email not verified");
        return res.redirect("/login");
    }
}

$.authenticate = function(req,res,next){
    var token = req.body.auth_token || req.query.authToken;
    if(!token)return res.json({
        status : 401,
        message : "Token not found"
    });
    jwt.verify(token,config.api.signingKey,function(err,obj){
        if(err)return res.json({
            status : 400,
            message : "Invalid token found"
        });
        User.findById(obj.uid,function(err,user){
            if(err)return res.json({
                status : 500,
                message : "Internal Server Error"
            });
            if(!user)return res.json({
                status : 401,
                message : "User not found"
            });
            req.user = user;
            next();
        })
    })
}
