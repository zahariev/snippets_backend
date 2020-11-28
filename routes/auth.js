const router = require("express").Router();

router.post("/register", (req, res) => {
  res.send("reg");
});

module.exports = router;
