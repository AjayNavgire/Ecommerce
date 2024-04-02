const ErrorHandler = require("../utils/errorhandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto")


exports.addTask = catchAsyncError(async (req, res) => {
 
        const { title, description } = req.body;

        const user = await User.findById(req.user._id);

        user.tasks.push({
            title,
            description,
            completed: false,
            createdAt: new Date(Date.now()),
        });

        await user.save();

        res.status(200).json({ success: true, message: "Task added successfully" });
    
});

exports.removeTask = catchAsyncError (async (req, res) => {
    
        const { taskId } = req.params;

        const user = await User.findById(req.user._id);

        user.tasks = user.tasks.filter(
            (task) => task._id.toString() !== taskId.toString()
        );

        await user.save();

        res
            .status(200)
            .json({ success: true, message: "Task removed successfully" });
   
});

exports.updateTask = catchAsyncError(async (req, res) => {
 
        const { taskId } = req.params;

        const user = await User.findById(req.user._id);

        user.task = user.tasks.find(
            (task) => task._id.toString() === taskId.toString()
        );

        user.task.completed = !user.task.completed;

        await user.save();

        res
            .status(200)
            .json({ success: true, message: "Task Updated successfully" });
   
});