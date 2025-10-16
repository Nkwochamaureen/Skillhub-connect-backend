// index.js (Backend)

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const LinkedInStrategy = require('passport-openidconnect').Strategy;
const session = require('express-session');
const cors = require('cors');
const User = require('./user'); // Correctly require the User model

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

const OIDCStrategy = require('passport-openidconnect').Strategy;

// --- PASSPORT.JS CONFIGURATION (USING MODERN OIDC STRATEGY) ---
passport.use('linkedin', new OIDCStrategy({
    // --- Configuration for LinkedIn's OpenID Connect system ---
    issuer: 'https://www.linkedin.com',
    authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoURL: 'https://api.linkedin.com/v2/userinfo',

    // --- Your App's Credentials ---
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: process.env.LINKEDIN_CALLBACK_URL,
    scope: 'profile email openid', // The scopes your app was given

}, (issuer, profile, done) => {
    // This callback receives a clean 'profile' object from the new library
    console.log('OIDC Profile received:', profile);

    // The user's unique LinkedIn ID is in the 'sub' field
    const linkedinId = profile.id || profile._json.sub;
    const email = profile._json.email;
    const name = profile.displayName || profile._json.name;

    // We wrap our database logic in a self-calling async function
    (async () => {
        try {
            let user = await User.findOne({ linkedinId: linkedinId });

            if (!user) {
                user = await User.create({
                    linkedinId: linkedinId,
                    name: name,
                    email: email,
                });
                console.log('New user created:', user);
            } else {
                console.log('Existing user found:', user);
            }
            // Success! Pass the user to Passport to be serialized.
            return done(null, user);
        } catch (err) {
            console.error('Error in OIDC callback:', err);
            return done(err);
        }
    })();
}));

app.get('/auth/linkedin', passport.authenticate('linkedin'));


// --- CHANGE #3: Update your callback route's name ---
app.get('/auth/linkedin/callback',
    passport.authenticate('linkedin', { failureRedirect: 'http://localhost:3000' }),
    (req, res) => {
        res.redirect('http://localhost:3000/dashboard');
    }
);

// ... (Your /api/user route and app.listen remain exactly the same) ...

// Store user ID in session
passport.serializeUser((user, done) => done(null, user._id));

// Retrieve user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// --- MONGODB CONNECTION ---
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// --- API ROUTES ---

// Route to start the LinkedIn authentication process
app.get('/auth/linkedin',
  // The 'scope' here should match the strategy scope
  passport.authenticate('linkedin', { scope: ['profile', 'email', 'openid'] })
);

// The callback route that LinkedIn redirects to after authentication
app.get('/auth/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: 'http://localhost:3000' }), // Redirect to frontend on failure
  (req, res) => {
    // On successful authentication, redirect back to the frontend with a success flag
    res.redirect('http://localhost:3001/?Dashboard');
  }
);

// Route for the frontend to check if a user is logged in and get their data
app.get('/api/user', (req, res) => {
  if (req.user) {
    res.json(req.user); // Send user data if authenticated
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// --- START SERVER ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));