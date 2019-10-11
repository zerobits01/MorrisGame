var express = require("express");
var router = express.Router();
var validator = require("express-validator");
var jwt = require("jsonwebtoken");
var app = require("../app");
var Path = require("path");
var user = require("../models/User");

router.get('/' , function(req,res){
  return res.json({
    msg : 'millsgame'
  });
});

/* email and password are not ok */
router.post("/signup", function(req, res, next) {
  if (req.body.profile == undefined) {
    console.log('sign up : ' + req.body.username + ' ' + req.body.email + ' ' + req.body.password);
    user.signUp(req.body.username, req.body.email, req.body.password, undefined,
      function(err,user) {
      if (err) {
        console.log(err);
        return res.status(406).json({
          msg: "bad input",
          err : err
        });
      } else {
        let token = jwt.sign(
          {
            username: req.body.username
          },
          "zero-bits01-secret",
          {
            expiresIn: "1000h"
          }
        );
        return res.json({
          user: user,
          token : token,
          msg:
            "user signed up and verification email has been sent, first verify"
        });
      }
    });
  } else {
    user.signUp(
      req.body.username,
      req.body.email,
      req.body.password,
      req.body.profile,
      function(err1, user) {
        if (err1) {
          return res.status(406).json({
            msg: "bad input"
          });
        } else {
          return res.json({
            user: user,
            token : token,
            msg:
              "user signed up and verification email has been sent, first verify"
          });
        }
      }
    );
  }
});

router.post("/login", async function(req, res, next) {
  if (await user.logIn(req.body.username, req.body.password)) {
    let token = jwt.sign(
      {
        username: req.body.username
      },
      "zero-bits01-secret",
      {
        expiresIn: "1000h"
      }
    );
    res.json({
      user : user,
      token : token,
      msg: "logged in"
    });
  } else {
    res.status(403).json({
      msg: "username/password problem or verify your account"
    });
  }
});

router.get("/rank", function(req, res) {
  user.ranking(function(err, users) {
    if (err) {
      return res.status(406).json({
        msg: "Sorry! something went wrong"
      });
    } else {
      return res.json(users);
    }
  });
});

router.get("/forgetpwd/:username", function(req, res) {
  user.sendEmailForget(req.params.username, function(err, user) {
    if (err) {
      return res.status(406).json({
        msg: "couldn't send email. please try later"
      });
    } else {
      return res.json({
        msg: "email sent to your mail, dear" + user.username
      });
    }
  });
});



module.exports = router;

/*
router.get("/profile/:username", function(req, res) {
  res.sendFile(getFilePath(req.params.username));
});

function getFilePath(username) {
  let p = __dirname + "/../" + "/uploads/" + filename;
  let path = Path.normalize(p);
  return path;
}

let token = jwt.sign(
                {
                  email: req.body.username
                },
                'zero-bits01-secret',
                {
                  expiresIn: '48h',
                },
              );
*/
/*
    req.files
        profile:
    {
        fieldname: 'profile',
        originalname: 'banner.png',
        name: 'banner1415699779303.png',
        encoding: '7bit',
        mimetype: 'image/png',
        path: 'uploads&#92;banner1415699779303.png', ../uploads/name
        extension: 'png',
        size: 11800,
        truncated: false,
        buffer: null
    }
*/

/*
router.get("/verify/:token/:username", function(req, res) {
  user.verify(req.params.username, req.params.token, function(err) {
    if (err) {
      return res.status(406).json({
        msg: "verification problem"
      });
    } else {
      return res.json({
        msg: "your account is verified"
      });
    }
  });
});
*/