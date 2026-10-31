
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");

// Fields allowed when creating or updating products
const allowedFields = [
  "name",
  "description",
  "price",
  "category",
  "stock",
  "image",
  "featured",
];

const hasUnknownFields = (body) => {
  return Object.keys(body).some(
    (field) => !allowedFields.includes(field)
  );
};

const isValidPrice = (value) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0;

const isValidStock = (value) =>
  Number.isInteger(value) && value >= 0;

// =====================================
// CREATE PRODUCT - ADMIN ONLY
// POST /api/products
// =====================================
const createProduct = async (req, res) => {
  try {
    const body = req.body || {};

    if (hasUnknownFields(body)) {
      return res.status(400).json({
        message: "Unknown product field provided",
      });
    }

    const {
      name,
      description,
      price,
      category,
      stock,
      image = "",
      featured = false,
    } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      !mongoose.isValidObjectId(category) ||
      !isValidPrice(price) ||
      !isValidStock(stock)
    ) {
      return res.status(400).json({
        message: "Please provide valid product details",
      });
    }

    if (
      typeof image !== "string" ||
      typeof featured !== "boolean"
    ) {
      return res.status(400).json({
        message: "Invalid image or featured value",
      });
    }

    const categoryExists = await Category.findById(category);

    if (!categoryExists) {
      return res.status(404).json({
        message: "Selected category does not exist",
      });
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price,
      category,
      stock,
      image: image.trim(),
      featured,
    });

    const populatedProduct = await Product.findById(
      product._id
    ).populate("category", "name");

    return res.status(201).json({
      message: "Product created successfully",
      product: populatedProduct,
    });
  } catch (error) {
    console.error("Create product error:", error.message);

    return res.status(500).json({
      message: "Failed to create product",
    });
  }
};

// =====================================
// GET PRODUCTS - PUBLIC
// GET /api/products
// =====================================
const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      sort = "newest",
      page = 1,
      limit = 12,
    } = req.query;

    const pageNumber = Math.max(
      1,
      parseInt(page, 10) || 1
    );

    const limitNumber = Math.min(
      100,
      Math.max(1, parseInt(limit, 10) || 12)
    );

    const filter = {};

    if (search && String(search).trim()) {
      filter.$text = {
        $search: String(search).trim(),
      };
    }

    if (category) {
      if (!mongoose.isValidObjectId(category)) {
        return res.status(400).json({
          message: "Invalid category ID",
        });
      }

      filter.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};

      if (minPrice !== undefined) {
        const minimum = Number(minPrice);

        if (!Number.isFinite(minimum) || minimum < 0) {
          return res.status(400).json({
            message: "Invalid minimum price",
          });
        }

        filter.price.$gte = minimum;
      }

      if (maxPrice !== undefined) {
        const maximum = Number(maxPrice);

        if (!Number.isFinite(maximum) || maximum < 0) {
          return res.status(400).json({
            message: "Invalid maximum price",
          });
        }

        filter.price.$lte = maximum;
      }
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      name_asc: { name: 1 },
      name_desc: { name: -1 },
    };

    const selectedSort =
      sortOptions[sort] || sortOptions.newest;

    const skip = (pageNumber - 1) * limitNumber;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name")
        .sort(selectedSort)
        .skip(skip)
        .limit(limitNumber),

      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      products,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Get products error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch products",
    });
  }
};

// =====================================
// GET SINGLE PRODUCT - PUBLIC
// GET /api/products/:id
// =====================================
const getProductById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(
      req.params.id
    ).populate("category", "name");

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error("Get product error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch product",
    });
  }
};

// =====================================
// UPDATE PRODUCT - ADMIN ONLY
// PUT /api/products/:id
// =====================================
const updateProduct = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const body = req.body || {};

    if (
      Object.keys(body).length === 0 ||
      hasUnknownFields(body)
    ) {
      return res.status(400).json({
        message: "Invalid product update fields",
      });
    }

    const updates = {};

    if (body.name !== undefined) {
      if (
        typeof body.name !== "string" ||
        !body.name.trim()
      ) {
        return res.status(400).json({
          message: "Invalid product name",
        });
      }

      updates.name = body.name.trim();
    }

    if (body.description !== undefined) {
      if (
        typeof body.description !== "string" ||
        !body.description.trim()
      ) {
        return res.status(400).json({
          message: "Invalid product description",
        });
      }

      updates.description = body.description.trim();
    }

    if (body.price !== undefined) {
      if (!isValidPrice(body.price)) {
        return res.status(400).json({
          message: "Invalid product price",
        });
      }

      updates.price = body.price;
    }

    if (body.stock !== undefined) {
      if (!isValidStock(body.stock)) {
        return res.status(400).json({
          message: "Invalid stock quantity",
        });
      }

      updates.stock = body.stock;
    }

    if (body.category !== undefined) {
      if (!mongoose.isValidObjectId(body.category)) {
        return res.status(400).json({
          message: "Invalid category ID",
        });
      }

      const categoryExists = await Category.findById(
        body.category
      );

      if (!categoryExists) {
        return res.status(404).json({
          message: "Category not found",
        });
      }

      updates.category = body.category;
    }

    if (body.image !== undefined) {
      if (typeof body.image !== "string") {
        return res.status(400).json({
          message: "Invalid image URL",
        });
      }

      updates.image = body.image.trim();
    }

    if (body.featured !== undefined) {
      if (typeof body.featured !== "boolean") {
        return res.status(400).json({
          message: "Invalid featured value",
        });
      }

      updates.featured = body.featured;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).populate("category", "name");

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error.message);

    return res.status(500).json({
      message: "Failed to update product",
    });
  }
};

// =====================================
// DELETE PRODUCT - ADMIN ONLY
// DELETE /api/products/:id
// =====================================
const deleteProduct = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await Product.findByIdAndDelete(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error.message);

    return res.status(500).json({
      message: "Failed to delete product",
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
