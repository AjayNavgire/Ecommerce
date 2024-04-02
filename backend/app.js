const express = require("express");
const app = express();
const cookieParser = require("cookie-parser")
const fileUpload = require("express-fileupload");
const cors = require("cors");

const errorMiddleware = require("./middleware/error");

app.use(express.json());
app.use(cookieParser());
app.use(
    fileUpload({
        limits: { fileSize: 50 * 1024 * 1024 },
        useTempFiles: true
    }));
app.use(cors());

// Route Imports
const product = require("./routes/productRoute");
const user = require("./routes/userRoute");
const task = require("./routes/taskRoute");


app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", task);

// Middleware for Errors
app.use(errorMiddleware)

app.get('/', (req, res)=>{
    res.send("Server is working")
})


module.exports = app;

// Add this comment