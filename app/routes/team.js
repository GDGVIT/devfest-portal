var express = require("express");
var passport = require('passport');
var User = require("../models/user");
var Team = require("../models/team");
var router = express.Router();
var config = require("../../config");
var inter = require("../interceptors");

var maxMembers = config.maxMembers;

module.exports.router = router;
module.exports.init = function(inject){

    //router.use(inter.autoLogin);
    router.use(inter.isLoggedIn);
    router.use(inter.isVerified);

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
                team.members.forEach(function(member){
                    User.findById(member.user,function (err, user) {
                        if(err)return res.sendStatus(500);
                        try{
                            if(user){
                                if(user.team && user.team.toString()==team._id.toString()){
                                    user.team = undefined;
                                    user.save(function(err){
                                    });
                                }
                            }
                        }catch(err){
                        }
                    });
                });
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

    router.get("/detach",function(req,res,next){
        req.user.team = undefined;
        req.user.save(function(err){
            if(err)throw err;
            return res.sendStatus(200);
        });
    });

    router.post("/leave",function(req,res,next){
        if(!req.user.team){
            return res.json({
                success : false,
                message : "Sorry. You are not the member of any team."
            });
        }

        Team.findById(req.user.team)
            .exec(function(err,team){
                if(err)return res.sendStatus(500);
                if(!team)return res.json({
                    success : false,
                    message : "Request failed. Team not found."
                });
                if(team.admin.toString() == req.user._id.toString()){
                    return res.json({
                        success : false,
                        message : "Sorry. You are the admin. You cannot abandon the team"
                    });
                }

                for(var i=0;i<team.members.length;i++){
                    if(team.members[i].user.toString()==req.user._id.toString()){
                        if(team.members[i].status=="joined"){
                            team.members.splice(i,1);
                            return team.save(function (err) {
                                if(err)return res.sendStatus(500);
                                req.user.team = undefined;
                                req.user.save(function(err){
                                    if(err)return res.sendStatus(500);
                                    return res.json({
                                        success : true
                                    });
                                });
                            });
                        }
                        return res.json({
                            success : false,
                            message : "You are not a member."
                        });
                    }
                }
                return res.json({
                    success : false,
                    message : "You are not a member"
                });
            });
    });

    router.post("/removeMember",function(req,res,next){
        if(!req.user.team){
            return res.json({
                success : false,
                message : "Sorry. You are not the member of any team."
            });
        }
        if(!req.body.userId)return res.sendStatus(500);

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
                        message : "Sorry. You are not the admin. You cannot remove a member."
                    });
                }

                for(var i=0;i<team.members.length;i++){
                    if(team.members[i].user.toString()==req.body.userId){
                        team.members.splice(i,1);
                        return team.save(function (err) {
                            if(err)return res.sendStatus(500);
                            User.findById(req.body.userId,function(err,user){
                                if(err)return res.sendStatus(500);
                                if(!user)return res.sendStatus(500);
                                if(user.team && user.team.toString()==team._id.toString()){
                                    user.team = undefined;
                                    user.save(function(err){
                                    });
                                }
                                return res.json({success : true});
                            });
                        });
                    }
                }
                return res.json({
                    success : false,
                    message : "Member not found"
                });
            });
    });


    router.post("/invite", function(req,res,next){
        if(!req.user.team){
            return res.json({
                success : false,
                message : "Sorry, you are not the admin of any team."
            })
        }
        if(!req.body.userId)return res.sendStatus(500);
        Team.findById(req.user.team)
        .exec(function(err,team){
            if(err)return res.sendStatus(500);
            if(!team){
                return res.json({
                    success : false,
                    message : "Team not found"
                });
            }
            if(team.admin.toString()!=req.user._id.toString()){
                return res.json({
                    success : false,
                    message : "Sorry, You are not the team admin"
                });
            }
            if(team.members.length>=maxMembers){
                return res.json({
                    success : false,
                    message : "Only "+maxMembers+" members per team are allowed to participate"
                });
            }
            for(var i=0;i<team.members.length;i++){
                if(team.members[i].user.toString()==req.body.userId){
                    var ret = {
                        success : false,
                        message : "User already in members list"
                    };
                    if(team.members[i].status=="invited"){
                        ret.message = "User already invited";
                    }
                    return res.json(ret);
                }
            }
            User.findById(req.body.userId).exec(function(err,user){
                if(err){
                    console.log(err);
                    return res.sendStatus(500);
                }
                if(!user){
                    return res.json({
                        success : false,
                        message : "Invalid user selected"
                    });
                }
                team.members.push({
                    user : user._id,
                    status : "invited"
                });
                team.save(function(err){
                    if(err){
                        console.log(err);
                        return res.sendStatus(500);
                    }
                    return res.json({
                        success : true
                    });
                });
            });
        });
    });

    router.get("/acceptInvite",function (req, res, next) {
        if(!req.query.teamId)return res.sendStatus(500);
        if(req.user.team){
            return res.redirect("/profile#/team");
        }
        Team.findById(req.query.teamId)
            .exec(function (err, team) {
                if(err)return res.sendStatus(500);
                if(!team)return res.send("Team not found");
                for(var i=0;i<team.members.length;i++){
                    if(team.members[i].user.toString()==req.user._id.toString()){
                        if(team.members[i].status=="invited"){
                            team.members[i].status = "joined";
                            return team.save(function (err) {
                                if(err)return res.sendStatus(500);
                                req.user.team = team._id;
                                req.user.save(function(err){
                                    if(err)return res.sendStatus(500);
                                    res.redirect("/profile#/team");
                                });
                            });
                        }
                        return res.sendStatus(500);
                    }
                }
                return res.send("Invitation not found");
            });
    });

    router.get("/deleteInvite",function(req,res,next){
        if(!req.query.teamId)return res.sendStatus(500);
        Team.findById(req.query.teamId)
            .exec(function (err, team) {
                if(err)return res.sendStatus(500);
                if(!team)return res.send("Team not found");
                for(var i=0;i<team.members.length;i++){
                    if(team.members[i].user.toString()==req.user._id.toString()){
                        if(team.members[i].status=="invited"){
                            team.members.splice(i,1);
                            return team.save(function (err) {
                                if(err)return res.sendStatus(500);
                                return res.redirect("/profile#/");
                            });
                        }
                        return res.sendStatus(500);
                    }
                }
                return res.send("Invitation not found");
            });
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
