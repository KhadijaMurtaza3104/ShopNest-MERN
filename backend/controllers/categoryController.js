const mongoose = require("mongoose");
const Category = require("../models/Category");
const Product = require("../models/Product");

// GET ALL CATEGORIES
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({
      name: 1
    });

    res.status(200).json(categories);
  } catch (error) {
    console.error("Get categories error:", error);

    res.status(500).json({
      message: "Failed to fetch categories"
    });
  }
};

// CREATE CATEGORY
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body || {};

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Category name is required"
      });
    }

    if (
      description !== undefined &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        message: "Description must be a string"
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || ""
    });

    res.status(201).json({
      message: "Category created successfully",
      category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Category already exists"
      });
    }

    console.error("Create category error:", error);

    res.status(500).json({
      message: "Failed to create category"
    });
  }
};

// DELETE CATEGORY
const deleteCategory = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid category ID"
      });
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found"
      });
    }

    const productCount = await Product.countDocuments({
      category: category._id
    });

    if (productCount > 0) {
      return res.status(409).json({
        message: "Cannot delete a category containing products"
      });
    }

    await category.deleteOne();

    res.status(200).json({
      message: "Category deleted successfully"
    });
  } catch (error) {
    console.error("Delete category error:", error);

    res.status(500).json({
      message: "Failed to delete category"
    });
  }
};

module.exports = {
  getCategories,
  createCategory,
  deleteCategory
};