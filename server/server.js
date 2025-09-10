// filepath: c:\Users\Maureennkwocha\OneDrive\Documents\Skillhub-connect-demo\server\server.js
require('dotenv').config();
// ...existing code...
const express = require('express');
const mongoose = require('mongoose');
const Task = require('./models/task');
const passport = require('passport');
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const session = require('express-session');

const app = express();
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/serenity', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// API routes
app.get('/api/tasks', async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
});

app.get('/api/forums', (req, res) => {
  res.json([{ id: 1, topic: 'Construction Trends' }, { id: 2, topic: 'Tech Tools' }]);
});
app.get('/api/resources', (req, res) => {
  res.json([{ id: 1, title: 'BIM Tutorial' }, { id: 2, title: 'PlanSwift Guide' }]);
});

// Passport and LinkedIn OAuth setup
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LinkedInStrategy({
  clientID: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  callbackURL: 'http://localhost:5000/auth/linkedin/callback',
  scope: ['r_emailaddress', 'r_liteprofile']
}, (accessToken, refreshToken, profile, done) => {
  // Mock user save to MongoDB
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.get('/auth/linkedin', passport.authenticate('linkedin'));
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/' }), (req, res) => {
  res.redirect('/dashboard');
});

// Only one listen!
app.listen(5000, () => console.log('Server running on port 5000'));