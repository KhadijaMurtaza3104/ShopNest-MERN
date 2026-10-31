const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number"
      }
    },
    image: {
      type: String,
      default: ""
    },
    featured: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

productSchema.index({
  name: "text",
  description: "text"
});

module.exports = mongoose.model("Product", productSchema);