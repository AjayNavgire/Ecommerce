const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); 
const crypto = require("crypto")

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please Enter Your Name"],
        maxLength: [30, "Name cannot exceed 30 characters"],
        minLength: [4, "Name should have more than 4 characters"]
    },
    email: {
        type: String,
        required: [true, "Please Enter Your Email"],
        unique: true,
        validate: [validator.isEmail, "Please Enter a valid Email"]
    },
    password: {
        type: String,
        required: [true, "Please Enter Your Password"],
        minLength: [8, "Password should be greater than 8 characters"],
        select: false
    },
    avatar: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    role: {
        type: String,
        default: "user"
    },

    createdAt: {
        type: Date,
        default: Date.now()
    },

    tasks : [
        {
            title: String,
            description : String,
            completed: Boolean,
            createdAt: Date,
        }
    ],

    verified: {
        type: Boolean,
        default: false
    },

    otp: Number,
    otp_expiry: Date,
    resetPasswoedOtp: Number,
    resetPasswordToken: String,
    resetPasswordExpire: Date
});


userSchema.pre("save", async function (next) {

    // Hash Password    
    if (!this.isModified("password")) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);
});

// JWT TOKEN
userSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
}

// Compare Password
userSchema.methods.comparePassword = async function (enterPassword) {
    return await bcrypt.compare(enterPassword, this.password);
};

// Generating Password Reset Token
userSchema.methods.getResetPasswordToken = function () {

    // Generating Token 
    const resetToken = crypto.randomBytes(20).toString("hex")


    //Hashing and add to userSchema
    this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex")

    this.resetPasswordExpire = Date.now() + 15*60*1000;

    return resetToken;
};


userSchema.index({ otp_expiry: 1 }, { expireAfterSeconds: 0 });

 

module.exports = mongoose.model("user", userSchema)