const express = require("express");

const dotenv = require("dotenv");
const mongoose = require("mongoose");
const compression = require("compression");
// add routes
const authRoute = require("./routes/auth");
const snippetRoute = require("./routes/snippets");

const app = express();
// gets env config values
dotenv.config();
app.use(compression());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});
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

app.listen(3030, () => console.log("Server started"));
