var mongoose = require("mongoose");
var passportLocalMongoose = require('passport-local-mongoose');

var userSchema = mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    username : String,
    regNo : {
        type : String,
        uppercase : true,
        required : true,
        trim : true
    },
    email : {
        type : String,
        unique : true,
        lowercase : true,
        required : true,
        trim : true
    },
    password  : String,
    verified : {
        type : Boolean,
        default : false
    },
    verificationEmailSent : {
        type : Boolean,
        default : false
    },
    verifiedAt : Date,
    dateRegistered : {
        type : Date,
        required : true
    },
    contact : String,
    team : {
        type : mongoose.Schema.ObjectId,
        ref : "Team"
    },
    gender : {
        type : String,
        enum : ["male","female"],
        required : true,
        default : "male"
    },
    blockRoom : String,
    skills : {
        type : [String],
        default : []
    },
    github : String,
    linkedIn : String,
    behance : String,
    slot_last_used : {
        type : Number,
        default : 0
    },
    slot_tries : {
        type : Number,
        default : 0
    },
    slots : [String],
    winner : {
        type : Boolean,
        default : false
    },
    otp : {
        type : Number
    },
    otpGeneratedAt : Date,
    coupons : [{
        code : String,
        used : {
            type : Boolean,
            default : false
        }
    }]
});
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",userSchema);
