const router = require("express").Router();
const User = require("../model");
router.post("/register", (req, res) => {
  res.send("reg");
});

module.exports = router;
