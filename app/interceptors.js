var passport = require('passport');

var $ = module.exports;

$.allRequest = function(req,res,next){
    res.locals.message = req.flash("message")[0] || "";
    res.locals.errMessage = req.flash("errMessage")[0] || "";
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
        req.body.username = "mdakram28";
        req.body.password = "1234";
        passport.authenticate("local")(req,res,next);
    }
}
