const express = require("express");
const { 
    addTask,
    updateTask,
    removeTask
} = require("../controllers/taskController");

const {isAuthenticatedUser, authorizedRoles} = require("../middleware/auth");

const router = express.Router();

router.route("/newtask").post(isAuthenticatedUser, addTask);

router
  .route("/task/:taskId")
  .get(isAuthenticatedUser, updateTask)
  .delete(isAuthenticatedUser, removeTask);



module.exports = router;