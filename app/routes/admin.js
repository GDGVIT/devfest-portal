var express = require("express");
var passport = require('passport');
var User = require("../models/user");
var email = require("../util/email");
var router = express.Router();
//var config = require("../../config");

var basicAuth = require('basic-auth');

module.exports.router = router;
module.exports.init = function(inject){

    router.use(function (req, res, next) {
        function unauthorized(res) {
          res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
          return res.send(401);
        };

        var user = basicAuth(req);

        if (!user || !user.name || !user.pass) {
          return unauthorized(res);
        };

        if (user.name+":"+user.pass == process.env.ADMIN) {
          return next();
        } else {
          return unauthorized(res);
        };
    });

    router.get("/users",function(req,res){
        User.find({}).populate("team").exec(function(err,users){
            if(err)return res.sendStatus(500);
            res.locals.users = users;
            return res.render("admin_usersList");
        });
    });

    router.get("/user/:email",function(req,res){
        User.findOne({
            email : req.params.email
        },function(err,user){
            if(err)return res.sendStatus(500);
            if(!user)return res.send("User not found");
            //console.log(user);
            res.locals.u = user;
            if(!user.skills)user.skills = [];
            res.render("admin_userDetails",{
                u : user
            });
        });
    });

}
