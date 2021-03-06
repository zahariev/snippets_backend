const router = require("express").Router();
const { Request, Response } = require("express");
const verify = require("./verifyToken");
const Snippet = require("../model/Snippet");

const { snippetValidation } = require("../validation");

router.get("/stats", (req, res) => {
  // if (!req.user.isAdmin) res.status(403).send(" Admins only! ");

  Snippet.aggregate(
    [
      { $project: { _id: 0, tags: 1, countLikes: 1 } },
      { $unwind: "$tags" },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 },
          likes: { $sum: "$countLikes" },
        },
      },
      { $project: { _id: 0, tag: "$_id", count: 1, likes: 1 } },
      { $sort: { count: -1 } },
    ],

    (err, snippets) => {
      if (!err) res.send(snippets);
      else console.log(err);
    }
  );
});

router.get("/all", verify, (req, res) => {
  if (req.user.isAdmin) {
    // returns All snippets, public, private
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
  } // not admin gets
  // all public + owned snippets
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
  // not logged
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
        $match: { private: false },
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
    tags: [
      ...new Set(
        req.body.tags
          ? req.body.tags
              // .replaceAll(".", "")
              .replaceAll(",", " ")
              .trim()
              .replace(/\s\s+/g, " ")
              .split(" ")
          : []
      ),
    ],
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

  const snippet = Snippet.findByIdAndUpdate(
    req.params.id,
    {
      title: req.body.title,
      code: req.body.code,
      tags: [
        ...new Set(
          req.body.tags
            ? req.body.tags
                // .replaceAll(".", "")
                .replaceAll(",", " ")
                .trim()
                .replace(/\s\s+/g, " ")
                .split(" ")
            : []
        ),
      ],
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
  if (!req.user.isAdmin) res.status(403).send(" Admins only! ");

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
