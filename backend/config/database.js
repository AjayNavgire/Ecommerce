const mongooes = require("mongoose");
let  DB_URI = process.env.DB_URI || "mongodb+srv://ajaynawgire1:GCOzvACNdt1LeF3L@cluster0.6egmb0e.mongodb.net/" 
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