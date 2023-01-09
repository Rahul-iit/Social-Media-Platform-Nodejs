const mongoose = require("mongoose");
const { stringify } = require("uuid");

const PostSchema = new mongoose.Schema(
  {
    postId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    likes: {
      type: Array,
      default: [],
    },
    comments: [
      {
        comment: String,
        commentId: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", PostSchema);
