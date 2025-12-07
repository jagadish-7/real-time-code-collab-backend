const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();
require('dotenv').config();


router.post('/signup', async (req, res) => {
  const { firstname, lastname, email, password } = req.body;
  const alreadyRegistered = await User.findOne({email})

  if(alreadyRegistered)
  {
    res.status(400).json({error:"User already exists", userExists:true});
    return;
  }

  try {




    const user = new User({ firstname, lastname, email, password });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '48h' });
    res.json({ token, success: true });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials', success: false });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials', success: false });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '48h' });
    res.json({ token, userId: user._id, success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});





// Update user details
router.put('/update', async (req, res) => {
  const { firstname, lastname, email, password } = req.body;


  // const alreadyRegistered = await User.findOne({email})

  // if(alreadyRegistered)
  // {
  //   res.status(400).json({error:"Email already used", emailExists:true});
  //   return;
  // }
  
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.firstname = firstname || user.firstname;
    user.lastname = lastname || user.lastname;
    user.email = email || user.email;
    user.password = password || user.password;
    

    await user.save();
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});





router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
