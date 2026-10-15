const MenuItem = require('../models/MenuItem');

async function generateNextDishId() {
  const menuItems = await MenuItem.find(
    {},
    {
      dishId: 1
    }
  );

  let maxNumber = 0;

  menuItems.forEach(item => {
    const match = /^M-(\d+)$/.exec(item.dishId);

    if (match) {
      const number = parseInt(match[1], 10);

      if (number > maxNumber) {
        maxNumber = number;
      }
    }
  });

  return `M-${String(maxNumber + 1).padStart(3, '0')}`;
}

// GET all menu items
async function getMenuItems(req, res) {
  try {
    const menuItems = await MenuItem.find().sort({
      createdAt: -1
    });

    res.status(200).json({
      count: menuItems.length,
      menuItems
    });
  } catch (error) {
    console.error('Get menu items error:', error);

    res.status(500).json({
      message: 'Failed to retrieve menu items'
    });
  }
}

// GET one menu item
async function getMenuItemById(req, res) {
  try {
    const menuItem = await MenuItem.findOne({
      dishId: req.params.id
    });

    if (!menuItem) {
      return res.status(404).json({
        message: 'Menu item not found'
      });
    }

    res.status(200).json({
      menuItem
    });
  } catch (error) {
    console.error('Get menu item error:', error);

    res.status(500).json({
      message: 'Failed to retrieve menu item'
    });
  }
}

// CREATE a menu item
async function createMenuItem(req, res) {
  try {

    const {
      name,
      description,
      category,
      price,
      available,
      signature,
      dietary,
      image,
      provenance,
      pairing,
      allergens
    } = req.body;

    // Generate the next dish ID automatically
    const dishId = await generateNextDishId();

    const menuItem = await MenuItem.create({
      dishId,
      name,
      description,
      category,
      price,
      available,
      signature,
      dietary,
      image,
      provenance,
      pairing,
      allergens
    });

    res.status(201).json({
      message: 'Menu item created successfully',
      menuItem
    });

  } catch (error) {
    console.error('Create menu item error:', error);

    res.status(500).json({
      message: 'Failed to create menu item'
    });
  }
}

// UPDATE a menu item
async function updateMenuItem(req, res) {
  try {
    const menuItem = await MenuItem.findOne({
      dishId: req.params.id
    });

    if (!menuItem) {
      return res.status(404).json({
        message: 'Menu item not found'
      });
    }

    const allowedFields = [
      'name',
      'description',
      'category',
      'price',
      'available',
      'signature',
      'dietary',
      'image',
      'provenance',
      'pairing',
      'allergens'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        menuItem[field] = req.body[field];
      }
    });

    await menuItem.save();

    res.status(200).json({
      message: 'Menu item updated successfully',
      menuItem
    });
  } catch (error) {
    console.error('Update menu item error:', error);

    res.status(500).json({
      message: 'Failed to update menu item'
    });
  }
}

// DELETE a menu item
async function deleteMenuItem(req, res) {
  try {
    const menuItem = await MenuItem.findOne({
      dishId: req.params.id
    });

    if (!menuItem) {
      return res.status(404).json({
        message: 'Menu item not found'
      });
    }

    await MenuItem.deleteOne({
      _id: menuItem._id
    });

    res.status(200).json({
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Delete menu item error:', error);

    res.status(500).json({
      message: 'Failed to delete menu item'
    });
  }
}

// UPDATE menu item availability
async function updateAvailability(req, res) {
  try {
    const { available } = req.body;

    if (typeof available !== 'boolean') {
      return res.status(400).json({
        message: 'Available must be true or false'
      });
    }

    const menuItem = await MenuItem.findOneAndUpdate(
      {
        dishId: req.params.id
      },
      {
        available
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!menuItem) {
      return res.status(404).json({
        message: 'Menu item not found'
      });
    }

    res.status(200).json({
      message: 'Menu item availability updated successfully',
      menuItem
    });
  } catch (error) {
    console.error('Update availability error:', error);

    res.status(500).json({
      message: 'Failed to update menu item availability'
    });
  }
}

module.exports = {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateAvailability
};