const express = require('express');
const app = express();
const path = require('path');
const hbs = require('hbs');
const collection = require('./mongodb');

const templatePath = path.join(__dirname, '../templates');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../images')));
app.set('view engine', 'hbs');
app.set('views', templatePath); 

// Set API URL to use http://localhost:3000 replaced with http://api_url
const API_URL = process.env.API_URL || 'http://localhost:3000';

app.get ('/', (req, res) => {
    res.render('login');
}
)

app.get('/login', (req, res) => {
    res.render('login');
});
app.get ('/signup', (req, res) => {
    res.render('signup');
}
)

app.post('/signup', async (req, res) => {
    try {
        const data = {
            name: req.body.name,
            password: req.body.password
        };
        await collection.insertMany([data]);
        res.render('home', { name: data.name });
    } catch (error) {
        res.status(500).send('Error creating account');
    }
});

 app.post('/login', async(req, res) => {

    try {
        const check = await collection.findOne({name: req.body.name, password: req.body.password});
        if (check && check.password === req.body.password) {
            res.render('home', { name: check.name });
             
        } else {
            res.render('login', { error: 'Invalid credentials' });
        }
    }
    catch(error){

        res.render('login', { error: 'Invalid credentials' });
    }

    
  
 })

app.listen (3000, () => {
    console.log('Server is running on http://localhost:3000');
});
