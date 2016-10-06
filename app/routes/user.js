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
    //router.use(inter.autoLogin);
    router.use(inter.isLoggedIn);
    router.use(inter.isVerified);

    router.post("/saveProfile",function(req,res){
        console.log(req.body);
        req.name = req.body.name ? req.body.name.toString() : "";
        req.regNo = req.body.regNo ? req.body.regNo.toString().toUpperCase() : "";
        req.contact = req.body.contact ? req.body.contact.toString() : "";
        req.skills = req.body.skills ? req.body.skills.toString().split(",") : [];
        req.skills.forEach(function(skill,i){
            req.skills[i] = skill.toUpperCase().trim();
        });

        if(!/^[a-zA-Z ]+$/.test(req.name)){
            req.flash("message","Invalid name. Name can contain only letters and space.");
            return res.redirect("/profile");
        }

        if(!/^\d\d\w\w\w\d\d\d\d$/i.test(req.regNo)){
            req.flash("message","Invalid registration number.");
            return res.redirect("/profile");
        }

        if(!/^(\+91|91|\+91 |91 )?\d{9,11}$/.test(req.contact)){
            req.flash("message","Invalid contact number.");
            return res.redirect("/profile");
        }

        req.user.name = req.name;
        req.user.regNo = req.regNo;
        req.user.contact = req.contact;
        req.user.skills = req.skills;
        req.user.save(function(err){
            if(err){
                req.flash("message","Internal server error.");
                return res.redirect("/profile");
            }
            else{
                req.flash("message","Profile updated.");
                return res.redirect("/profile");
            }
        });
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
                User.find({}).select({
                    name : 1,
                    _id : 1,
                    email : 1,
                    regNo : 1
                }).lean().exec(function (err, users) {
                    if(err)return res.sendStatus(500);
                    res.locals.users = users;
                    res.render("team/team");
                });
            });
    });
}
