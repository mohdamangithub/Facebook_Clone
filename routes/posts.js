const mongoose = require("mongoose");

const postScehma = mongoose.Schema({
  post: String,
  picture: String,
  time: {
    type: Date,
    default: Date.now(),
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "commentPost",
    },
  ],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: 0,
    },
  ],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  username: String,
});

module.exports = mongoose.model("posts", postScehma);
