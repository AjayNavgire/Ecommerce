const mongooes = require("mongoose");
let  DB_URI = process.env.DB_URI || "mongodb://localhost:27017/Ecommerce" 
const connectDatabase = () => {
  
    mongooes
        .connect(DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        .then(
            (data) => {
                console.log(`Mongodb connected with server: ${data.connection.host}`);
            })
}

module.exports = connectDatabase