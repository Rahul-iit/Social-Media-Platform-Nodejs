const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const userRoute = require("./routes/users");
const authenticate = require("./middleware/authenticate")
const jwt = require("jsonwebtoken");
dotenv.config();
mongoose.set("strictQuery", false);

mongoose.connect(
  process.env.MONGO_URL,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    console.log("Connected to MongoDB");
  }
);


app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

app.use("/api", userRoute);

const PORT = process.env.PORT || 8800;
app.listen(PORT, ()=>{
    console.log("Backend server is runnning");
})


