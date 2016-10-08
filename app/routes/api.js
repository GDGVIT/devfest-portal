var express = require("express");
var passport = require('passport');
var User = require("../models/user");
var Team = require("../models/team");
var router = express.Router();
var config = require("../../config");
var inter = require("../interceptors");
var jwt = require("jsonwebtoken");

module.exports.router = router;
/*

{
    "status" : status_code,
    "message" : status_message,
    "user" : {
        "auth_token" : authentication_token,
        "name" : users_name,
        "email" : email,
        "reg_no" : user_reg_no,
        "phone" :user_phone_number ,
        "block_room" :user_block_room,
        "gender" : m/f,
        "linkedin" : linkedin_url,
        "github" : github_url,
        "behance" : behance_url,
        "isAdmin" : true/false,
        "skills" : [string-array of skills],
        "slot_last_used" : *slot_countdown_time,
        "slot_tries" : times_slot_triggered
    },
    "team" : {
        "name" : team_name,
        "members" : [{
            "name" :member_name,
            "position" : member_position,
            "status" : member_status
        }]
    }
}
*/
module.exports.init = function(inject){
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

                jwt.sign({
                    uid : user._id.toString()
                }, signingKey, { algorithm: "HS256" }, function(err, token) {
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

                    if(!team)return res.json(json);
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
