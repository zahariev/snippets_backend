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

router.post("/vote", verify, async (req, res) => {
  //check if voted
  const voteExist = await Snippet.findOne({
    _id: req.body.snippetId,
    likes: { $elemMatch: { $eq: req.user._id } },
  });
  // savevote
  if (!voteExist) {
    const vote = await Snippet.update(
      {
        _id: req.body.snippetId,
      },
      {
        $inc: { countLikes: 1 },
        $push: { likes: req.user._id },
      }
    );

    return res.send(vote);
  } else {
    // remove vote
    try {
      const vote = await Snippet.update(
        {
          _id: req.body.snippetId,
        },
        {
          $inc: { countLikes: -1 },
          $pull: { likes: req.user._id },
        }
      );

      return res.send(vote);
    } catch (err) {
      res.status(400).send(err.message);
    }
  }
});

module.exports = router;
