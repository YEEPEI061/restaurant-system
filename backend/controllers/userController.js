const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

const {
  broadcast
} = require('../services/websocketService');

async function getUsers(req, res) {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);

    res.status(500).json({
      message: 'Failed to retrieve users'
    });
  }
}

async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.status(200).json({
      user
    });
  } catch (error) {
    console.error('Get user error:', error);

    res.status(500).json({
      message: 'Failed to retrieve user'
    });
  }
}

async function createUser(req, res) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
      active
    } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: 'An account with this email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role: role || 'guest',
      active: active !== undefined ? active : true
    });

    const safeUser = user.toObject();
    delete safeUser.password;

    broadcast({
      type: 'user.created',
      message: 'A new user has been created.',
      data: {
        userId: user._id
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: safeUser
    });
  } catch (error) {
    console.error('Create user error:', error);

    res.status(500).json({
      message: 'Failed to create user'
    });
  }
}

async function updateUser(req, res) {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
      active
    } = req.body;

    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: user._id }
      });

      if (existingUser) {
        return res.status(409).json({
          message: 'An account with this email already exists'
        });
      }

      user.email = email;
    }

    if (firstName !== undefined) {
      user.firstName = firstName;
    }

    if (lastName !== undefined) {
      user.lastName = lastName;
    }

    if (password !== undefined) {
      user.password = await bcrypt.hash(
        password,
        12
      );
    }

    if (phone !== undefined) {
      user.phone = phone;
    }

    if (role !== undefined) {
      user.role = role;
    }

    if (active !== undefined) {
      user.active = active;
    }

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    broadcast({
      type: 'user.updated',
      message: 'A user has been updated.',
      data: {
        userId: user._id
      }
    });

    res.status(200).json({
      message: 'User updated successfully',
      user: safeUser
    });
  } catch (error) {
    console.error('Update user error:', error);

    res.status(500).json({
      message: 'Failed to update user'
    });
  }
}

async function deleteUser(req, res) {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    if (user._id.toString() === req.user.userId.toString()) {
      return res.status(400).json({
        message: 'You cannot delete your own admin account'
      });
    }

    await User.deleteOne({
      _id: user._id
    });

    broadcast({
      type: 'user.deleted',
      message: 'A user has been deleted.',
      data: {
        userId: user._id
      }
    });

    res.status(200).json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);

    res.status(500).json({
      message: 'Failed to delete user'
    });
  }
}

async function updateUserStatus(req, res) {
  try {
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({
        message: 'Active must be true or false'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid user ID'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { active },
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    broadcast({
      type: 'user.updated',
      message: 'A user status has been updated.',
      data: {
        userId: user._id
      }
    });

    res.status(200).json({
      message: 'User status updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);

    res.status(500).json({
      message: 'Failed to update user status'
    });
  }
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus
};