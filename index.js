const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// add routes
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");

// gets env config values
dotenv.config();

// connect to mongodb
mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true }, () =>
  console.log("connected to db")
);
// middlewares
app.use(express.json());

// Route middlewares
app.use("/api/user", authRoute);
app.use("/api/posts", postRoute);

app.listen(3000, () => console.log("Server started"));
