const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// add routes
const authRoute = require("./routes/auth");
const snippetRoute = require("./routes/snippets");

// gets env config values
dotenv.config();

// connect to mongodb
mongoose.connect(
  process.env.DB_CONNECT,
  { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false },
  () => console.log("connected to db")
);
// middlewares
app.use(express.json());

// Route middlewares
app.use("/api/user", authRoute);
app.use("/api/snippets", snippetRoute);

app.listen(3000, () => console.log("Server started"));
