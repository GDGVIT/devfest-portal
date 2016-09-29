var express = require("express");
var passport = require('passport');
var User = require("../models/user");
var Team = require("../models/team");
var router = express.Router();
var config = require("../../config");
var inter = require("../interceptors");

module.exports.router = router;
module.exports.init = function (inject) {

    router.use(function (req, res, next) {
        console.log(req.isAuthenticated());
        next();
    });
    router.use(inter.autoLogin);

    router.use(function (req, res, next) {
        console.log(req.isAuthenticated());
        next();
    });
    router.use(inter.isLoggedIn);
    //router.use(inter.isVerified);

    router.get("/",function(req,res){
        res.render("profile");
    });
    router.get("/main",function (req, res) {
        if(req.user.team){
            return res.send("<script>window.location.hash='#/team'</script>");
        }
        Team.find({
            "members.user" : req.user._id
        }).populate("admin").exec(function (err, teams) {
            if(err){
                console.log(err);
                return res.sendStatus(500);
            }
            res.locals.invitations = teams;
            console.log(err,teams);
            res.render("team/main");
        });
    });
    router.get("/create",function(req,res){
        if(req.user.team){
            return res.send("<script>window.location.hash='#/team'</script>");
        }
        res.render("team/create")
    });
    router.get("/team",function(req,res){
        if(!req.user.team){
            return res.redirect("main");
        }
        Team.findById(req.user.team)
            .populate("members.user")
            .lean()
            .exec(function (err, team) {
                if(err){
                    console.log(err);
                    return res.sendStatus(500);
                }
                if(!team)return res.sendStatus(500);
                res.locals.team = team;
                res.locals.isTeamAdmin = team.admin.toString()==req.user._id.toString();
                res.render("team/team");
            });
    });
}
