const router = require("express").Router();
const User = require("../models/User");
const Post = require("../models/Post");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require('uuid');
const authenticate = require("../middleware/authenticate");


router.post("/register", async (req, res, next) => {
    try {
      const oldUser = await User.findOne({ email: req.body.email });
      if (oldUser) {
        return res.status(409).send("User Already Exist. Please Login");
      }
      const uId = uuidv4();
      const token = jwt.sign({ uId }, process.env.TOKEN_KEY);
      const newUser = await new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        userId: uId,
        token: token,
      });
      await newUser.save();
      return res.status(201).json("Registration Successfull");
    } catch (err) {
      console.log(err);
      return res.status(500).json("Internal server error");
    }
  });
  

  router.post("/authenticate", async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(404).json("User not found");
      }
      if (req.body.password !== user.password) {
        return res.status(400).json("Invalid Password");
      }
      const token = jwt.sign({ userId: user.userId }, process.env.TOKEN_KEY);
      await User.updateOne({ userId: user.userId }, { $set: { token: token }});
      return res.status(200).json({ token });
    } catch (err) {
      console.log(err);
      return res.status(500).json("Internal server error");
    }
  });
  

function getUserIdFromToken(bearer_token) {
    bearer_token = bearer_token.substring(7);
    const decode = jwt.verify(bearer_token, process.env.TOKEN_KEY);
    if (!decode.userId) {
        return decode;
    }
    return decode.userId;
}

router.post("/follow/:id", authenticate, async (req, res) => {
    try {
      const otherUserId = req.params.id;
      const otherUser = await User.findOne({ userId: otherUserId });
      if (!otherUser) {
        return res.status(400).json("userId which is given in the url doesn't exists");
      }
      const userId = getUserIdFromToken(req.header("Authorization"));
    //   console.log(userId);
      if (!otherUser.followers.includes(userId)) {
        otherUser.followers.push(userId);
        await User.updateOne({ userId: otherUserId }, { $set: { followers: otherUser.followers }});
      }
      const user = await User.findOne({ userId: userId });
      if (!user) {
        return res.status(400).json("User not found");
      }
      if (!user.followings.includes(otherUserId)) {
        user.followings.push(otherUserId);
        await User.updateOne({ userId: userId }, { $set: { followings: user.followings }});
      }
      return res.status(200).json("Follow successful");
    } catch (err) {
      console.log(err);
      return res.status(500).json("Internal server error");
    }
});

  
  


router.post("/unfollow/:id", authenticate, async (req, res) => {
    try {
      const otherUserId = req.params.id;
      const otherUser = await User.findOne({ userId: otherUserId });
      if (!otherUser) {
        return res.status(400).json("userId which is given in the url doesn't exists");
      }
      const userId = getUserIdFromToken(req.header("Authorization"));
      if (otherUser.followers.includes(userId)) {
        otherUser.followers = otherUser.followers.filter(followerId => followerId !== userId);
        await User.updateOne({ userId: otherUserId }, { $set: { followers: otherUser.followers }});
      }
      const user = await User.findOne({ userId: userId });
      if (user.followings.includes(otherUserId)) {
        user.followings = user.followings.filter(followingId => followingId !== otherUserId);
        await User.updateOne({ userId: userId }, { $set: { followings: user.followings }});
      }
      return res.status(200).json("Unfollow successful");
    } catch (err) {
      console.log(err);
      return res.status(500).json("Internal server error");
    }
  });
  

router.get("/user", authenticate,  async (req, res)=> {
    userId = getUserIdFromToken(req.header('Authorization'));
    var user = await User.findOne({ userId: userId });
    
    res.status(200).json({"Name": user.name, "Followers": user.followers.length, "Followings": user.followings.length, "userId": userId});
    
});


router.post('/posts', authenticate, async (req, res) => {
    try {
      const { title, description } = req.body;
      const userId = getUserIdFromToken(req.header('Authorization'));
  
      const newPost = new Post({
        postId: uuidv4(),
        title,
        description,
        userId: userId,
        likes: [],
        comments: [],
      });
  
      await newPost.save();
  
      res.json({ postId: newPost.postId, title: newPost.title, description: newPost.description });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error creating new post');
    }
  });

  router.delete('/posts/:id', authenticate, async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = getUserIdFromToken(req.header('Authorization'));
      const post = await Post.findOne({ postId: postId, userId: userId });
      if (!post) {
        return res.status(404).send('Post not found');
      }
      await Post.deleteOne({ postId: postId });
      res.send('Post deleted successfully');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error deleting post');
    }
  });
  
  router.post('/like/:id', authenticate, async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = getUserIdFromToken(req.header('Authorization'));
      const post = await Post.findOne({ postId: postId });
      if (!post) {
        return res.status(404).send('Post not found');
      }
      if (post.likes.includes(userId)) {
        return res.status(400).send('User has already liked this post');
      }
      post.likes.push(userId);
      await Post.updateOne({ postId: postId }, { $set: { likes: post.likes }});
      res.send('Post liked successfully');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error liking post');
    }
  });

  router.post('/unlike/:id', authenticate, async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = getUserIdFromToken(req.header('Authorization'));
      const post = await Post.findOne({ postId: postId });
      if (!post) {
        return res.status(404).send('Post not found');
      }
      if (!post.likes.includes(userId)) {
        return res.status(400).send('User has not liked this post');
      }
      post.likes = post.likes.filter(like => like !== userId);
      await Post.updateOne({ postId: postId }, { $set: { likes: post.likes }});
      res.send('Post unliked successfully');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error unliking post');
    }
  });
  
  router.post('/comment/:id', authenticate, async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = getUserIdFromToken(req.header('Authorization'));
      const post = await Post.findOne({ postId: postId });
      if (!post) {
        return res.status(404).send('Post not found');
      }
      const newCommentId = uuidv4();
      const newComment = {
        commentId: newCommentId,
        comment: req.body.comment,
      };
      post.comments.push(newComment);
      await Post.updateOne({ postId: postId }, { $set: { comments: post.comments }});
      res.send({ commentId: newCommentId });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error adding comment');
    }
  });
  
  router.get("/posts/:id", async (req, res) => {
      try {
          const postId = req.params.id;
          const post = await Post.findOne({ postId: postId }).populate("likes");
          if (!post) {
              return res.status(404).send("Post not found");
          }
          const numLikes = post.likes.length;
          const comments = post.comments.map((comment) => comment.comment);
          res.send({ numLikes, comments });
      } catch (error) {
          console.error(error);
          res.status(500).send("Error getting post");
      }
  });
  
    
  router.get('/all_posts', authenticate, async (req, res) => {
    try {
      const userId = getUserIdFromToken(req.header('Authorization'));
      const posts = await Post.find({ userId: userId }).sort({ createdAt: -1 });
      if (!posts) {
        return res.status(404).send('No posts found');
      }
      const formattedPosts = posts.map(post => {
        return {
          id: post.postId,
          title: post.title,
          desc: post.description,
          created_at: post.createdAt.toLocaleString(),
          comments: post.comments.map((comment) => comment.comment),
          likes: post.likes.length
        };
      });
      res.send(formattedPosts);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error getting all posts');
    }
  });
  

  

module.exports = router;