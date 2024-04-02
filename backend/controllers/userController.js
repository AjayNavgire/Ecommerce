const ErrorHandler = require("../utils/errorhandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const cloudinary = require("cloudinary");
const fs = require("fs")

// Register a User
exports.registerUser = catchAsyncError(async (req, res, next) => {
    const { name, email, password } = req.body;

 
    const  avatar  = req.files.avatar.tempFilePath;
 

    const otp = Math.floor(Math.random() * 100000)

    const mycloud = await cloudinary.v2.uploader.upload(avatar, {
        folder: "users"
    })

    fs.rmSync("./tmp", { recursive : true});

    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: mycloud.public_id,
            url: mycloud.secure_url
        },
        otp,
        otp_expiry: new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000)
    });

    
    await sendEmail(
        {
        email : email, 
        subject:"Verifty your account", 
        message: `Your OTP is ${otp}`
    });
    sendToken(user, 201, res, "OPT sent to your email, please verify your account");

})

// Verify User
exports.verify = catchAsyncError(async (req, res) => {

      const otp = Number(req.body.otp);

      const user = await User.findById(req.user._id);
  
      if (user.otp !== otp || user.otp_expiry < Date.now()) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid OTP or has been Expired" });
      }
  
      user.verified = true;
      user.otp = null;
      user.otp_expiry = null;
  
      await user.save();
  
      sendToken(user, 200, res,"Account Verified");
    
  });


// Login User
exports.loginUser = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;


    // Checking if user has given password and email both

    if (!email || !password) {
        return next(new ErrorHandler("Please Enter Email & Password", 400));
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return next(new ErrorHandler("Invalid email or password", 401))
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid email or password", 401))
    }

    sendToken(user, 200, res)
})
 

// Logout User
exports.logout = catchAsyncError(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })

    res.status(200).json({
        success: true,
        message: "Logged Out"
    })
})

// Forgot Password
exports.forgotPassword = catchAsyncError(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new ErrorHandler("User not found", 404))
    }

    // Get Reset Password Token
    const resetToken = user.getResetPasswordToken()

    await user.save({ validateBeforeSave: false });

    const resetPasswordUrl = `${req.protocol}://${req.get(
        "host"
    )}/api/v1/password/reset/${resetToken}`

    const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, 
    please ignore it`;

    try {

        await sendEmail({
            email: user.email,
            subject: `Ecommerce Password Recovery`,
            message,
        });

        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully`
        })
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        return next(new ErrorHandler(error.message, 500))
    }

})

//Reset Password
exports.resetPassword = catchAsyncError(async (req, res, next) => {


    // Creating Token hash
    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex")

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {$gt: Date.now()}
    })

    if(!user){
        return next(new ErrorHandler("Reset Password Token is invalid or has been expired", 404))
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandler("Password does not match", 404))
    }

    user.password = req.body.password ;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;


    await user.save();

    sendToken(user, 200, res)
})

// Get User Details
exports.getUserDetails = catchAsyncError(async(req, res, next) =>{
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        success: true,
        user,
    })
})

// Update User Password
exports.updatePassword = catchAsyncError(async(req, res, next) =>{
    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword)

    if(!isPasswordMatched){
        return next (new ErrorHandler ("Old password is incorrect", 400));
    }

    if(req.body.newPassword !== req.body.confirmPassword){
        return next (new ErrorHandler("Password does not match", 400))
    }

    user.password = req.body.newPassword;

    await user.save();

  sendToken(user, 200, res)
})

// Update User Profile
exports.updateProfile = catchAsyncError(async(req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email
    };

    const  avatar  = req.files.avatar.tempFilePath;

    if(avatar){

        await cloudinary.v2.uploader.destroy(req.user.avatar.public_id);

        const mycloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "users"
        })
    
        fs.rmSync("./tmp", { recursive : true});

        newUserData.avatar = {
            public_id: mycloud.public_id,
            url: mycloud.secure_url
        }
    }

    const user = await User.findByIdAndUpdate(req.user.id, newUserData,{
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
    })
})

// Get all users (admin)
exports.getAllUser = catchAsyncError(async(req, res, next) =>{
    const users = await User.find();

    res.status(200).json({
        success: true,
        users
    })
})

// Get single user (admin)
exports.getSingleUser = catchAsyncError(async(req, res, next) =>{
    const user = await User.findById(req.params.id);

    if(!user){
        return next (new ErrorHandler(`User does not exist with id: ${req.params.id}`))
    }

    res.status(200).json({
        success: true,
        user
    })
})

// Update User Role -- Admin
exports.updateUserRole = catchAsyncError(async(req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    };

    // We will add cloudinary later

    const user = await User.findByIdAndUpdate(req.params.id, newUserData,{
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
    })
})

// Delete User 
exports.deleteUser = catchAsyncError(async(req, res, next) => {
  const user = await User.findById(req.params.id);

  if(!user){
      return next(
          new ErrorHandler(`User does not exist with Id: ${req.params.id}`)
      )
  }

  await user.remove()

    res.status(200).json({
        success: true,
        message: "User Deleted Successfully"
    })
})

// 