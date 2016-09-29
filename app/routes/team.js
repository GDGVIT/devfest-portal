var express = require("express");
var passport = require('passport');
var User = require("../models/user");
var Team = require("../models/team");
var router = express.Router();
var config = require("../../config");
var inter = require("../interceptors");

module.exports.router = router;
module.exports.init = function(inject){

    router.use(inter.autoLogin);
    router.use(inter.isLoggedIn);
    //router.use(inter.isVerified);

    function getId(n) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

        for (var i = 0; i < n; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    router.post("/create", function (req, res, next) {
        if(req.user.team){
            return res.json({
                success : false,
                message : "Sorry. You can't create more than one team."
            })
        }
        Team.findOne({
            name: req.body.name
        }, function (err, team) {
            if (err){throw err;return res.sendStatus(500);}
            console.log(team);
            if (team)return res.json({
                success: false,
                message: "Team with this name already exists"
            });
            console.log(team);
            next();
        });
    },function (req, res, next) {
        var team = new Team({
            name: req.body.name,
            admin: req.user._id,
            members : [{
                user : req.user._id,
                status : "admin"
            }]
        });
        team.save(function (err) {
            if (err){console.log(err);return res.sendStatus(500);}
            req.user.team = team._id;
            req.user.save(function(err){
                if(err){throw err;return res.sendStatus(500);}
                return res.json({
                    success : true
                });
            });
        });
    });

    router.post("/delete",function (req, res, next) {
        if(!req.user.team){
            return res.json({
                success : false,
                message : "Sorry. You are not the admin of any team."
            });
        }
        Team.findById(req.user.team)
            .exec(function(err,team){
                if(err)return res.sendStatus(500);
                if(!team)return res.json({
                    success : false,
                    message : "Request failed. Team not found."
                });
                if(team.admin.toString() != req.user._id.toString()){
                    return res.json({
                        success : false,
                        message : "Sorry. You are not the admin of any team."
                    });
                }
                team.remove(function(err){
                    if(err)return res.sendStatus(500);
                    req.user.team = undefined;
                    req.user.save(function(err){
                        if(err)return res.sendStatus(500);
                        return res.json({success : true});
                    });
                });
            });
    });

    router.get("/inviteUser", function(req,res,next){
        User.findOne({
            email : req.query.email.toLowerCase()
        },function (err, user) {
            if(err)return res.sendStatus(500);
            if(!user){
                req.flash("errMessage","No user found by that email.");
                res.redirect("edit");
            }else{
                var found = false;
                req.team.members.forEach(function(member){
                    if(found)return;
                    if(member.user.toString() == user._id.toString()){
                        if(member.status == "joined"){
                            req.flash("errMessage","User is already a member of the team.")
                            found = true;
                        }else if(member.status == "rejected"){
                            req.flash("errMessage","User has rejected team invite.");
                            found = true;
                        }
                    }
                });
                if(found){
                    return res.redirect("edit");
                }
                req.team.members.push({
                    user : user._id,
                    status : "invited"
                });
                req.team.save(function (err) {
                    if(err)return res.sendStatus(500);
                    req.flash("Invite sent to user");
                    res.redirect("edit");
                });
            }
        })
    });

    // router.get("/processInvite", function (req, res, next) {
    //     Team.findOne({
    //         id : req.query._id,
    //         members : {
    //             user : req.user._id,
    //             status : "invited"
    //         }
    //     },function (err, team) {
    //         if(err || !team){
    //             req.flash("errMessage","Invitation not found");
    //             return res.redirect("edit");
    //         }
    //         team.members.forEach(function (member) {
    //             if(member.user.toString() == req.user._id.toString()){
    //                 member.status = req.query.accept == "true" ? "joined" : "rejected";
    //             }
    //         });
    //     })
    // })
}
