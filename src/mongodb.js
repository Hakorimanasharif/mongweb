const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/LoginSignUpTutorial')
.then(() => {
    console.log('Connected to MongoDB');
})
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
        
    }
});

const collection = mongoose.model('Collection1', Loginschema);

module.exports = collection