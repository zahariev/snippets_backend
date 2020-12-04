const router = require("express").Router();
const { Request, Response } = require("express");
const verify = require("./verifyToken");
const Snippet = require("../model/Snippet");

const { snippetValidation } = require("../validation");

router.get("/tags", (req, res) => {
  Snippet.distinct("tags", (err, snippets) => {
    if (!err) res.send(snippets);
    else console.log(err);
  });
  //.aggregate(
  //   [
  //     { $sort: { date: -1 } },

  //     {
  //       $lookup: {
  //         from: "users",
  //         localField: "createdBy",
  //         foreignField: "_id",
  //         as: "created",
  //       },
  //     },
  //     { $unwind: "$createdBy" },
  //     {
  //       $project: {
  //         created: "$created.lastName",
  //         id: 1,
  //         title: 1,
  //         code: 1,
  //         tags: 1,
  //         likes: 1,
  //         createdBy: 1,
  //         countLikes: 1,
  //         modified: 1,
  //         private: 1,
  //         date: 1,
  //       },
  //     },
  //   ],

  //   (err, snippets) => {
  //     if (!err) res.send(snippets);
  //   }
  // );
});

router.get("/all", verify, (req, res) => {
  if (req.user.isAdmin) {
    // returns All snippets
    Snippet.aggregate(
      [
        { $sort: { date: -1 } },

        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "created",
          },
        },
        { $unwind: "$createdBy" },
        {
          $project: {
            created: "$created.lastName",
            id: 1,
            title: 1,
            code: 1,
            tags: 1,
            likes: 1,
            createdBy: 1,
            countLikes: 1,
            modified: 1,
            private: 1,
            date: 1,
          },
        },
      ],

      (err, snippets) => {
        if (!err) res.send(snippets);
      }
    );
  } // public + own snippets
  else {
    Snippet.aggregate(
      [
        { $sort: { date: -1 } },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "created",
          },
        },
        { $unwind: "$createdBy" },
        {
          $project: {
            created: "$created.lastName",
            id: 1,
            title: 1,
            code: 1,
            tags: 1,
            likes: 1,
            createdBy: 1,
            countLikes: 1,
            modified: 1,
            private: 1,
            date: 1,
          },
        },

        {
          $match: { $or: [{ created: req.user.name }, { private: false }] },
        },
      ],

      (err, snippets) => {
        if (!err) res.send(snippets);
      }
    );
  }
});

router.get("/", (req, res) => {
  Snippet.aggregate(
    [
      { $sort: { date: -1 } },
      {
        $match: { private: false },
      },

      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "created",
        },
      },
      { $unwind: "$createdBy" },
      {
        $project: {
          created: "$createdBy.lastName",
          id: 1,
          title: 1,
          code: 1,
          tags: 1,
          likes: 1,
          createdBy: 1,
          countLikes: 1,
          modified: 1,
          private: 1,
          date: 1,
        },
      },
    ],

    (err, snippets) => {
      if (!err) res.send(snippets);
    }
  );
});

router.get("/my", verify, (req, res) => {
  console.log(req.user);
  Snippet.aggregate(
    [
      { $sort: { date: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "created",
        },
      },
      { $unwind: "$createdBy" },
      {
        $project: {
          created: "$created.lastName",
          id: 1,
          title: 1,
          code: 1,
          tags: 1,
          likes: 1,
          createdBy: 1,
          countLikes: 1,
          modified: 1,
          private: 1,
          date: 1,
        },
      },

      {
        $match: { created: req.user.name },
      },
    ],

    (err, snippets) => {
      console.log(err);
      if (!err) res.send(snippets);
    }
  );
});

router.post("/add", verify, async (req, res) => {
  const { error } = snippetValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const snippet = new Snippet({
    title: req.body.title,
    code: req.body.code,
    tags: req.body.tags
      ? req.body.tags
          .trim()
          .replaceAll(/\s\s+/g, " ")
          .replaceAll(".", "")
          .replace(/\b(\w+)\b(?=.*?\b\1\b)/gi, "")
          .replaceAll(/ +(?= )/g, "")
          .trim()
          .split(" ")
      : [],
    createdBy: req.user,
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
  if (req.user.isAdmin) {
    try {
      const snippet = Snippet.findByIdAndDelete(
        require("mongoose").Types.ObjectId(req.params.id),
        (err, result) => {
          if (err) res.status(400).send(err.message);
          else res.send(result);
        }
      );
    } catch (err) {
      res.status(400).send(err.message);
    }
  }
});

router.post("/vote", verify, async (req, res) => {
  //check if voted
  const voteExist = await Snippet.findOne({
    _id: req.body.snippetID,
    likes: { $elemMatch: { $eq: req.user._id } },
  });
  // savevote
  if (!voteExist) {
    const vote = await Snippet.update(
      {
        _id: req.body.snippetID,
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
          _id: req.body.snippetID,
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
