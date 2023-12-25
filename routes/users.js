const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/fbdata");

const userSchema = mongoose.Schema({
  fullname: String,
  username: String,
  email: String,
  password: String,
  number: String,
  age: Number,
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "posts",
    },
  ],
  comment: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "commentPost",
    },
  ],
  profilepic: {
    type: String,
    default: "def.png",
  },
  story: {
    type: String,
    default: "def.png",
  },
  coverpic: {
    type: String,
    default: "def.png",
  },
  key: String
});

userSchema.plugin(plm);

module.exports = mongoose.model("user", userSchema);
