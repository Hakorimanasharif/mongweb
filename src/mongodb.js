const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://hakorimanasharif12:Hakorimana12@cluster0.we3s9v8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
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

module.exports = collection;
