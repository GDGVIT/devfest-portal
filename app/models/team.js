var mongoose = require("mongoose");
var passportLocalMongoose = require('passport-local-mongoose');

var userSchema = mongoose.Schema({
    name : {
        type : String,
        required : true,
        unique : true,
        uppercase : true
    },
    members : {
        type : [{
            user : {
                type: mongoose.Schema.ObjectId,
                ref: 'User'
            },
            status : {
                type : String,
                enum : ["invited","joined","rejected","requested","admin"]
            }
        }],
        default : []
    },
    admin : {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    shortlisted : Boolean,
    idea : String,
    projectUrl : String
});

module.exports = mongoose.model("Team",userSchema);
