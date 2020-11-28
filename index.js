const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// gets env config values
dotenv.config();

// connect to mongodb
mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true }, () =>
  console.log("connected to db")
);

// add routes
const authRoute = require("./routes/auth");

// middlewares
app.use("/api", authRoute);

app.listen(3000, () => console.log("Server started"));
