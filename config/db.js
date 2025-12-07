const mongoose = require('mongoose');




const connectDB = ()=>{
    mongoose.connect("mongodb://127.0.0.1:27017/code-flow-live");
    mongoose.connection.on('connected', () => console.log('Connected with database'));
    mongoose.connection.on('error', (err) => console.log('Connection failed with - ',err));
}


module.exports = connectDB;
