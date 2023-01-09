const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
    },
    userId: {
      type: String,
      // unique: true
    },
    email: {
      type: String,
      required: true,
      // unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 3,
    },
    token: {
      type: String,
      // unique: true,
    },
    followers: {
      type: Array,
      default: [],
    },
    followings: {
      type: Array,
      default: [],
    },
    desc: {
      type: String,
      max: 50,
    },
    
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);