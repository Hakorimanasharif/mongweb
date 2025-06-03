const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb+srv://hakorimanasharif12:nQwgHHW7obwZ92N4@cluster0.we3s9v8.mongodb.net/test';

mongoose.connect(uri)
.then(() => {
    console.log('Connected to MongoDB');
})
//api_url=http://localhost:3000
.catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});

const Loginschema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
        
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    messages: [{
        sender: String,
        text: String,
        timestamp: Date
    }]
});

const collection = mongoose.model('Collection1', Loginschema);

module.exports = collection;
