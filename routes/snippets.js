const router = require("express").Router();
const { Request, Response } = require("express");
const verify = require("./verifyToken");
const Snippet = require("../model/Snippet");

const { snippetValidation } = require("../validation");

router.get("/all", verify, (req, res) => {
  Snippet.find({}, (err, snippets) => {
    res.send(snippets);
  });
});

router.get("/", (req, res) => {
  Snippet.find({ private: false }, (err, snippets) => {
    res.send(snippets);
  });
});

router.post("/add", async (req, res) => {
  const { error } = snippetValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const snippet = new Snippet({
    title: req.body.title,
    code: req.body.code,
    tags: req.body.tags
      ? req.body.tags
          .replace(/(\b \w+\b)(?=.*\1)/gi, "")
          .trim()
          .split(" ")
      : [],
    createdBy: req.body.user,
    private: req.body.private,
  });

  try {
    const savedSnippet = await snippet.save();
    res.send({ snippet: savedSnippet });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.put("/:id", verify, async (req, res) => {
  const { error } = snippetValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //find and replace duplicates
  const tagArr = req.body.tags
    .replaceAll(",", " ")
    .replace(/(\b\w+\b)(?=.*\b\1\b)/gi, "")
    .trim()
    .split(" ");

  const snippet = Snippet.findByIdAndUpdate(
    req.params.id,
    {
      title: req.body.title,
      code: req.body.code,
      tags: req.body.tags
        .replaceAll(",", " ")
        .replace(/(\b\w+\b)(?=.*\b\1\b)/gi, "")
        .trim()
        .split(" "),
      modified: new Date(),
      private: req.body.private,
    },
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

router.delete("/:id", verify, async (req, res) => {
  const { error } = snippetValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  try {
    const snippet = Snippet.findByIdAndDelete(req.params.id);

    res.send("Done");
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
