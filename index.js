const express = require("express");
const app = express();
const mongoose = require("mongoose");

// connect
mongoose.connect(
  "mongodb+srv://user11:password11@cluster0.74a0p.mongodb.net/<dbname>?retryWrites=true&w=majority",
  { useNewUrlParser: true },
  () => console.log("connected to db")
);

// add routes
const authRoute = require("./routes/auth");

// middlewares
app.use("/api", authRoute);

app.listen(3000, () => console.log("Server started"));
