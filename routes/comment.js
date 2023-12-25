const mongoose = require("mongoose");
 
// const indexModel = require('../models/');

const commentSchema = mongoose.Schema({
  comment: String,
  commentorId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  time: {
    type: Date,
    default: Date.now(),
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "posts",
  },
  commentor: String,
  commentorpic:String
});

module.exports = mongoose.model("commentPost", commentSchema);
