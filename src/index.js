const express = require('express');
const app = express();
const path = require('path');
const hbs = require('hbs');
const collection = require('./mongodb');

const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

const templatePath = path.join(__dirname, '../templates');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../images')));

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // For local development without HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());

// Logout route
app.get('/logout', (req, res, next) => {
    if (req.isAuthenticated()) {
        req.session.destroy(function(err) {
            if (err) {
                return next(err);
            }
            res.clearCookie('connect.sid');
            res.redirect('/login');
        });
    } else {
        res.redirect('/login');
    }
});

app.set('view engine', 'hbs');
app.set('views', templatePath);

// Passport serialize and deserialize user
passport.serializeUser(function(user, done) {
    console.log('serializeUser called with user:', user);
    done(null, user._id || user.id);
});

passport.deserializeUser(async function(id, done) {
    try {
        console.log('deserializeUser called with id:', id);
        const user = await collection.findOne({ _id: id }) || await collection.findOne({ oauthID: id });
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: 'GOOGLE_CLIENT_ID',
    clientSecret: 'GOOGLE_CLIENT_SECRET',
    callbackURL: '/auth/google/callback'
}, async function(accessToken, refreshToken, profile, done) {
    try {
        let user = await collection.findOne({ oauthID: profile.id });
        if (!user) {
            user = await collection.insertOne({
                oauthID: profile.id,
                name: profile.displayName,
                provider: 'google'
            });
            user = user.ops[0];
        }
        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));

// LinkedIn OAuth Strategy
passport.use(new LinkedInStrategy({
    clientID: 'LINKEDIN_CLIENT_ID',
    clientSecret: 'LINKEDIN_CLIENT_SECRET',
    callbackURL: '/auth/linkedin/callback',
    scope: ['r_emailaddress', 'r_liteprofile']
}, async function(accessToken, refreshToken, profile, done) {
    try {
        let user = await collection.findOne({ oauthID: profile.id });
        if (!user) {
            user = await collection.insertOne({
                oauthID: profile.id,
                name: profile.displayName,
                provider: 'linkedin'
            });
            user = user.ops[0];
        }
        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));

// Facebook OAuth Strategy
passport.use(new FacebookStrategy({
    clientID: 'FACEBOOK_CLIENT_ID',
    clientSecret: 'FACEBOOK_CLIENT_SECRET',
    callbackURL: '/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'emails']
}, async function(accessToken, refreshToken, profile, done) {
    try {
        let user = await collection.findOne({ oauthID: profile.id });
        if (!user) {
            user = await collection.insertOne({
                oauthID: profile.id,
                name: profile.displayName,
                provider: 'facebook'
            });
            user = user.ops[0];
        }
        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

app.get('/', (req, res) => {
    res.render('login');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

const nodemailer = require('nodemailer');

app.post('/forgot-password', async (req, res) => {
    try {
        const email = req.body.email;

        // Create reusable transporter object using SMTP transport
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'hakorimanasharif12@gmail.com', // Your email
                pass: process.env.EMAIL_PASSWORD || 'your_email_password'   // Use environment variable or replace with your email password or app password
            }
        });

        // Generate a reset token (for demo, a simple random string)
        const resetToken = Math.random().toString(36).substr(2);

        // TODO: Save resetToken and associate with user in DB with expiration

        // Compose reset link
        const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

        // Send mail with defined transport object
        let info = await transporter.sendMail({
            from: '"Kegelson Support" <your_email@gmail.com>', // sender address
            to: email, // list of receivers
            subject: "Password Reset Request", // Subject line
            text: `You requested a password reset. Click the link to reset your password: ${resetLink}`, // plain text body
            html: `<p>You requested a password reset.</p><p>Click the link to reset your password: <a href="${resetLink}">${resetLink}</a></p>` // html body
        });

        console.log("Message sent: %s", info.messageId);

        res.render('login', { error: 'Password reset link sent to your email.' });
    } catch (error) {
        console.error('Error sending password reset email:', error);
        res.status(500).send('Error processing password reset');
    }
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

// Protected home route
app.get('/home', ensureAuthenticated, (req, res) => {
    res.render('home', { name: req.user.name });
});

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

app.post('/login', async (req, res, next) => {
    try {
        const user = await collection.findOne({ name: req.body.name, password: req.body.password });
        if (user && user.password === req.body.password) {
            req.login(user, function(err) {
                if (err) { 
                    console.error('Login error:', err);
                    return next(err); 
                }
                return res.redirect('/home');
            });
        } else {
            res.render('login', { error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login exception:', error);
        res.render('login', { error: 'Invalid credentials' });
    }
});

// Google OAuth routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('/home');
    });

// LinkedIn OAuth routes
app.get('/auth/linkedin',
    passport.authenticate('linkedin'));

app.get('/auth/linkedin/callback',
    passport.authenticate('linkedin', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('/home');
    });

// Facebook OAuth routes
app.get('/auth/facebook',
    passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('/home');
    });

const axios = require('axios');

app.post('/api/nexa-chat', async (req, res) => {
    const userMessage = req.body.message;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: userMessage }],
            max_tokens: 150,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const botReply = response.data.choices[0].message.content;
        res.json({ reply: botReply });
    } catch (error) {
        console.error('Error communicating with OpenAI:', error);
        res.status(500).json({ error: 'Error communicating with AI service' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
