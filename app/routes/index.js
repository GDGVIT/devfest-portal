var express = require("express");
var passport = require('passport');
var User = require("../models/user");
var router = express.Router();

module.exports.router = router;
module.exports.init = function(inject){
    router.get("/",function(req,res){
        console.log(res.locals.message);
        res.render("index");
    });
}
