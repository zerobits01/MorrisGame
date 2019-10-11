var express = require("express");
var router = express.Router();
var jwt = require("jsonwebtoken");
var user = require("../models/User");
var fs = require("fs");

function getFilePath(username) {
  let p = __dirname + "/../" + "/uploads/" + filename;
  let path = Path.normalize(p);
  return path;
}

router.use(function(req, res, next) {
  let token = req.headers["authenticate"];
  if (token) {
    jwt.verify(token, "zero-bits01-secret", (err, decoded) => {
      if (err) {
        res.status(403).json({
          msg: "Token is not valid"
        });
      } else {
        req.body.username = decoded.username;
        next();
      }
    });
  } else {
    res.status(403).json({
      msg: "Access denied"
    });
  }
});

router.get("/userinfo", function(req, res) {
  user.findOne({ username: req.body.username }, function(err, userDoc) {
    if (err) {
      return res.status(406).json({
        msg: "sorry! something went wrong"
      });
    } else {
      userDoc.password = undefined;
      return res.json({
        user: userDoc,
        msg: "user found"
      });
    }
  });
});

router.post("/improvescore", function(req, res) {
  user.improveScore(req.body.username, req.body.score, function(err, user) {
    if (err) {
      return res.status(406).json({
        msg: "sorry! something went wrong"
      });
    } else {
      return res.json({
        user: user,
        msg: "score incremented"
      });
    }
  });
});

router.post("/edit", function(req, res) {
  user.edit(
    req.body.username,
    req.body.newusername,
    req.body.newpassword,
    req.body.newemail,
    req.body.newprofile,
    function(err, user) {
      if (err) {
        return res.status(406).json({
          msg: "couldn't edit, try later"
        });
      } else {
        return res.json({
          user: user,
          msg: "edit done"
        });
      }
    }
  );
});

module.exports = router;