const router = require("express").Router();
const User = require("../model/User");
const { registerValidation, loginValidation } = require("../validation");
const jwt = require("jsonwebtoken");

const bcrypt = require("bcryptjs");

router.post("/register", async (req, res) => {
  // validate before
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // check if the user is already in DB
  const userNameExist = await User.findOne({ username: req.body.username });
  if (userNameExist) return res.status(400).send("Email already exists");
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  // register user
  const user = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    username: req.body.username,
    password: hashedPassword,
  });

  try {
    const savedUser = await user.save();
    res.send({ user: user.id });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.post("/authenticate", async (req, res) => {
  // validate before
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // check if the user is in DB
  const user = await User.findOne({ username: req.body.username });
  if (!user) return res.status(400).send("Email or Password is wrong");

  // check password
  const validPass = await bcrypt.compare(req.body.password, user.password);
  if (!validPass) return res.status(400).send("Email or Password is wrong");

  // create jwt token
  const token = jwt.sign(
    { _id: user.id, name: user.lastName, isAdmin: user.isAdmin },
    process.env.TOKEN_SECRET
  );
  res.header("auth-token", token).send({
    access_token: token,
    token_type: "bearer",
  });
  //   res.send("logged in");
});

module.exports = router;
