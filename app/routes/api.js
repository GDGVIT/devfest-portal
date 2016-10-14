var express = require("express");
var passport = require('passport');
var User = require("../models/user");
var Team = require("../models/team");
var router = express.Router();
var config = require("../../config");
var apis = require("../../apis");
var data = require("../../data");
var inter = require("../interceptors").api;
var jwt = require("jsonwebtoken");

var api_names = {};


module.exports.router = router;
module.exports.init = function(inject){

    for(var api_category in apis){
        apis[api_category].forEach(function (api) {
            api_names[api.name] = api;
        });
    }

    router.post("/teamapis",inter.authenticate,inter.putTeam,function(req,res){
        // if(!req.isAdmin){
        //     return res.json({
        //         status : 401,
        //         message : "Only admin can access slot details"
        //     });
        // }
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

    router.post("/allapis",function(req,res,next){
        var category = req.body.category || "social";
        category = category.toString();
        var ret = apis[category];
        return res.json(ret);
    });

    router.post("/slot",inter.authenticate,function(req,res,next){
        if(req.body.winner==undefined || !req.body.slots){
            console.log(req.body);
            return res.json({
                status : 400,
                message : "Bad Request"
            });
        }
        var accessTime = new Date(req.user.slot_last_used+1800000);

        if(req.user.winner){
            return res.json({
                status : 200,
                message : "ok",
                slot : {
                    winner : true
                }
            });
        }else if(new Date() < accessTime){
            return res.json({
                status : "400",
                message : "Request denied. Please wait 30 minutes before next call."
            });
        }else{
            req.user.winner = req.body.winner;
            req.user.slot_last_used = new Date().getTime();
            req.user.slot_tries++;
            req.user.slots = [
                req.body.slots[0],
                req.body.slots[1],
                req.body.slots[2],
            ];
            req.user.save(function(err){
                if(err) return res.json({
                    status : 500,
                    message : "Internal Server Error"
                });
                return res.json({
                    status : 200,
                    message : "ok",
                    slot : {
                        winner : req.body.winner
                    }
                });
            });
        }
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
                if(!user.verified)return res.json({
                    status : 406,
                    message : "Email not verified"
                });
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

    function generateCoupon(req,res,type,next){
        jwt.sign({
            userId : req.user._id.toString(),
            id : req.user.coupons.length
        },config.api.signingKey,{algorithm : "HS256"},function (err, token) {
            if(err)return res.json({
                status : 500,
                message : "Internal Server Error"
            });
            req.user.coupons.push({
                code : token,
                couponType : type,
                used : false
            });
        });
    }

    router.post("/coupons",inter.authenticate,function(req,res,next){
        if(!req.user.coupons || req.user.coupons.length==0){
            req.user.coupons = [];
            generateCoupon(req,res,"dinner",function () {
                generateCoupon(req,res,"snacks",function () {
                    req.user.save(function(err){
                        if(err)return res.json({
                            status : 500,
                            message : "Internal Server Error"
                        });
                        next();
                    });
                });
            });
        }else{
            next();
        }
    },function (req,res,next) {
        return res.json({
            status : 200,
            message : "ok",
            coupons : req.user.coupons
        });
    });

    router.post("/redeemCoupon",inter.authenticate,function (req, res, next) {
        if(req.user.email != "mohdakram.ansari2015@vit.ac.in"){
            return res.json({
                status : 401,
                message : "Not an admin"
            });
        }
        if(!req.body.coupon){
            return res.json({
                status : 400,
                message : "Bad request"
            });
        }
        jwt.verify(req.body.coupon.toString(),config.api.signingKey,function (err, obj) {
            if(err){
                return res.json({
                    status : 500,
                    message : "Failed to verify token"
                });
            }
            User.findById(obj.userId,function (err, user) {
                if(err)return res.json({
                    status : 500,
                    message : "Internal Server Error"
                })
                if(!user)return res.json({
                    status : 500,
                    message : "User not found"
                })
                if(!user.coupons[obj.id])return res.json({
                    status : 500,
                    message : "Coupon not found"
                });
                var coupon = user.coupons[obj.id];
                if(coupon.used)return res.json({
                    status : 500,
                    message : "Coupon used"
                });
                coupon.used = true;
                user.save(function(err){
                    if(err)return res.json({
                        status : 500,
                        message : "Internal Server Error"
                    });
                    return res.json(coupon);
                })
            })
        })
    })

    router.post("/timeline",function(req,res){
        return res.json({
            status : 200,
            message : "My message",
            timeline : data.timeline
        });
    });

    router.post("/speakers",function(req,res){
        return res.json({
            status : 200,
            message : "My message",
            speakers : data.speakers
        });
    });

    router.post("/faq",function(req,res){
        return res.json({
            status : 200,
            message : "My faq",
            faqs : data.faqs
        });
    });
}
