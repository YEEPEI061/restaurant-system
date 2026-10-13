const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function guestSignup(req, res) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone
    } = req.body;

    // Check whether the email is already registered
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: 'An account with this email already exists'
      });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create guest account
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role: 'guest'
    });

    // Never return the password
    res.status(201).json({
      message: 'Guest account created successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Guest signup error:', error);

    res.status(500).json({
      message: 'Failed to create guest account'
    });
  }
}

async function guestLogin(req, res) {
  try {
    const { email, password } = req.body;

    // Find guest account
    const user = await User.findOne({
      email,
      role: 'guest'
    });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Check whether the account is active
    if (!user.active) {
      return res.status(403).json({
        message: 'Your account has been deactivated'
      });
    }

    // Compare entered password with hashed password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
      }
    );

    // Return token and user information
    res.status(200).json({
      message: 'Guest login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Guest login error:', error);

    res.status(500).json({
      message: 'Failed to login'
    });
  }
}

async function adminLogin(req, res) {
    try {
      const { email, password } = req.body;
  
      // Find admin account
      const user = await User.findOne({
        email,
        role: 'admin'
      });
  
      if (!user) {
        return res.status(401).json({
          message: 'Invalid email or password'
        });
      }
  
      // Check whether the account is active
      if (!user.active) {
        return res.status(403).json({
          message: 'Your account has been deactivated'
        });
      }
  
      // Compare entered password with hashed password
      const passwordMatch = await bcrypt.compare(
        password,
        user.password
      );
  
      if (!passwordMatch) {
        return res.status(401).json({
          message: 'Invalid email or password'
        });
      }
  
      // Create JWT
      const token = jwt.sign(
        {
          userId: user._id,
          role: user.role
        },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || '1d'
        }
      );
  
      // Return token and admin information
      res.status(200).json({
        message: 'Admin login successful',
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
  
      res.status(500).json({
        message: 'Failed to login'
      });
    }
  }

  async function getCurrentUser(req, res) {
    try {
      const user = await User.findById(req.user.userId).select(
        '-password'
      );
  
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }
  
      res.status(200).json({
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          active: user.active
        }
      });
    } catch (error) {
      console.error('Get current user error:', error);
  
      res.status(500).json({
        message: 'Failed to get user information'
      });
    }
  }

module.exports = {
  guestSignup,
  guestLogin,
  adminLogin,
  getCurrentUser
};