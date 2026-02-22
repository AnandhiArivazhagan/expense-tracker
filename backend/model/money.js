const mongoose = require("mongoose");

const moneySchema = new mongoose.Schema({
  item: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  paymentMode: {
    type: String,
    enum: ["Online", "Offline"],
    required: true
  },
  location: {
    type: String
  }
});

module.exports = mongoose.model("Money", moneySchema);