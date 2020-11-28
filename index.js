const express = require("express");
const app = express();

const authRoute = require("./routes/auth");

// middlewares
app.use("/api", authRoute);

app.listen(3000, () => console.log("Server started"));
