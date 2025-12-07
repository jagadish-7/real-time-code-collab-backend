const mongoose = require('mongoose');

const connectDB = ()=>{
    mongoose.connect(process.env.MONGO_URI);
    mongoose.connection.on('connected', () => console.log('Connected with database'));
    mongoose.connection.on('error', (err) => console.log('Connection failed with - ',err));
}


module.exports = connectDB;
