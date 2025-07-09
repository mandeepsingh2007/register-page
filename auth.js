const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // make sure correct path
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Register
router.post('/register', async (req, res) => {
  const { username, password, role, email, githubUsername } = req.body;

  if (!username || !password || !role || !email) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'Username taken' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserData = {
      username,
      password: hashedPassword,
      role,
      wallet: 0,
      email
    };

    // If user is hunter and githubUsername was provided, store it
    if (role === 'hunter' && githubUsername) {
      newUserData.githubUsername = githubUsername;
    }

    const newUser = new User(newUserData);
    await newUser.save();

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
        wallet: newUser.wallet,
        email: newUser.email,
        githubUsername: newUser.githubUsername || null
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        wallet: user.wallet,
        email: user.email,
        githubUsername: user.githubUsername || null
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Me route to get logged in user from token
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
