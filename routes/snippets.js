const router = require("express").Router();
const verify = require("./verifyToken");
const Snippet = require("../model/Snippet");

const { snippetValidation } = require("../validation");

router.get("/", verify, (req, res) => {
  Snippet.find({}, (err, snippets) => {
    res.send({ snippets: snippets });
  });
});

router.post("/add", verify, async (req, res) => {
  const { error } = snippetValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // register user
  const snippet = new Snippet({
    title: req.body.title,
    code: req.body.code,
    tags: req.body.tags,
    createdBy: req.user,
  });

  try {
    const savedSnippet = await snippet.save();
    res.send({ snippet: savedSnippet });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
