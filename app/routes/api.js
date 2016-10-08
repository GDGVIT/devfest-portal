var express = require("express");
var passport = require('passport');
var User = require("../models/user");
var Team = require("../models/team");
var router = express.Router();
var config = require("../../config");
var apis = require("../../apis");
var inter = require("../interceptors").api;
var jwt = require("jsonwebtoken");

module.exports.router = router;
module.exports.init = function(inject){

    router.post("/apis",inter.authenticate,inter.putTeam,function(req,res){
        if(!req.isAdmin){
            return res.json({
                status : 401,
                message : "Only admin can access slot details"
            });
        }
        if(!req.team.apis || req.team.apis.length==0){
            req.team.apis = [
                apis[Math.floor(Math.random()*apis.length)],
                apis[Math.floor(Math.random()*apis.length)],
                apis[Math.floor(Math.random()*apis.length)]
            ];
            req.team.save();
        }
        return res.json({
            status : 200,
            message : "ok",
            apis : req.team.apis
        });
    });

    router.post("/login",function (req, res, next) {
        if(!req.body.email || !req.body.password){
            return res.json({
                status : 400,
                messasge : "Bad request"
            });
        }
        var email = req.body.email.toString().toLowerCase();
        var pass = req.body.password.toString();
        User.findOne({
            email : email
        }).exec(function(err,user){
            if(err)return res.json({
                status : 500,
                messasge : "Internal Server Error"
            });
            if(!user)return res.json({
                status : 401,
                messasge : "Authentication failed"
            });
            user.authenticate(pass,function(err,user,flash){
                if(err)return res.json({
                    status : 500,
                    message : "Internal Server Error"
                });
                if(!user)return res.json({
                    status : 401,
                    message : "Authentication failed"
                });
                console.log("Authentication successful");
                jwt.sign({
                    uid : user._id.toString()
                }, config.api.signingKey, { algorithm: "HS256" }, function(err, token) {
                    if(err)return res.json({
                        status : 500,
                        message : "Internal Server Error"
                    });

                    var json = {
                        "status" : 200,
                        "message" : "ok",
                        "user" : {
                            "auth_token" : token,
                            "name" : user.name,
                            "email" : user.email,
                            "reg_no" : user.regNo,
                            "phone" : user.contact ,
                            "block_room" : user.blockRoom,
                            "gender" : user.gender,
                            "linkedin" : user.linkedin,
                            "github" : user.github,
                            "behance" : user.behance,
                            "isAdmin" : false,
                            "skills" : user.skills,
                            "slot_last_used" : user.slot_last_used,
                            "slot_tries" : user.slot_tries
                        },
                        "team" : undefined
                    };

                    if(!user.team)return res.json(json);
                    Team.findOne(user.team).populate("members.user").exec(function(err,team){
                        if(err)return res.json({
                            status : 500,
                            message : "Internal Server Error"
                        });
                        if(!team)return res.json({
                            status : 500,
                            message : "Team not found"
                        });
                        json.team = {
                            name : team.name,
                            members : []
                        };
                        team.members.forEach(function(member){
                            json.team.members.push({
                                name : member.user.name,
                                status : member.status,
                                position : member.status
                            });
                        });
                        if(team.admin.toString() == user._id.toString()){
                            json.user.isAdmin = true;
                        }
                        return res.json(json);
                    })
                });

            });
        });
    });


}
