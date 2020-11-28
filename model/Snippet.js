const mongoose = require("mongoose");

const snippetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    min: 5,
    max: 255,
  },
  code: {
    type: String,
    required: true,
  },
  tags: {
    type: Array,
    required: true,
  },
  likes: {
    type: Array,
  },
  countLikes: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Snippet", snippetSchema);
