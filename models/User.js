var mongoose = require("mongoose");
var bcrypt = require("bcryptjs");
var mailer = require("../helpers/mailer");
var randomstr = require("randomstring");

let verifyroute = "172.17.37.48:3000/verify/";

var UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },

  email: {
    type: String,
    unique: true,
    required: true
  },

  password: {
    type: String,
    required: true
  },

  score: {
    type: Number
  },

  profileURL: {
    type: String
  }

  // verified: {
  //   type: Boolean,
  //   required: true
  // },

  // token: {
  //   type: String,
  //   required: true
  // }
});

let User = mongoose.model("User", UserSchema);

module.exports = User;

// public : 

/**
 * cb.params : err, user
 */
module.exports.signUp = function(username, email, password, profileURL, cb) {
  bcrypt.hash(password, 10, function(err, hash) {
    if (!err) {
      let t1 = randomstr.generate(15);
      let userDoc = User({
        username: username,
        email: email,
        password: hash,
        profileURL: profileURL,
        //        verified: false,
        //        token: t1,
        score: 0
      });
      /*
      // let message = mailer.messageOfVerify(
      //   username,
      //   email,
      //   verifyroute + t1 + "/" + username
      // )
      // mailer.sendMail(message, function(err1, info) {
      //   if (!err1) {
          
      //   } else {
      //     cb(err1);
      //   }
      // });*/
      userDoc.save(function(err2, user) {
        if (!err2) {
          user.password = undefined;
          user.token = undefined;
        }
        cb(err2, user);
      });
    } else {
      cb(err);
    }
  });
};

/**
 * returns bool
 */
module.exports.logIn = async function(username, password) {
  let user = await User.findOne({ username: username });
  if (user) {
    let flag = await bcrypt.compare(password, user.password);
    console.log("User login : " + user + " " + flag);
    if (flag) {
      user.password = undefined;
      // user.token = undefined;
      return user;
    }
  }
  return false;
};

/**
 * cb.params : err,users
 */
module.exports.ranking = function(cb) {
  User.find(
    {},
    ["username", "score"],
    {
      sort: { score: 1 }
    },
    cb
  );
};

module.exports.sendEmailForget = function(username, cb) {
  User.findOne({ username: username }, function(err, user) {
    if (!err) {
      let randompwd = randomstr.generate(8);
      user.password = randompwd;
      let message = mailer.messageOfForgot(username, user.email, randompwd);
      mailer.sendMail(message, function(err1, info) {
        if (!err1) {
          user.password = randompwd;
          user.save(function(err2, user) {
            if (!err2) {
              user.password = undefined;
              user.token = undefined;
            }
            cb(err2, user);
          });
        } else {
          cb(err1);
        }
      });
    } else {
      cb(err);
    }
  });
};


// private user
module.exports.improveScore = function(username, score, cb) {
  User.findOne({ username: username }, function(err, user) {
    if (!err) {
      user.score += score;
      user.save(function(err1, user) {
        if (!err1) {
          user.password = undefined;
          user.token = undefined;
        }
        cb(err1, user);
      });
    } else {
      cb(err);
    }
  });
};

module.exports.edit = function(
  username,
  newusername,
  newpassword,
  newemail,
  profile,
  cb
) {
  User.findOne({ username: username }, function(err, user) {
    if (!err) {
      bcrypt.hash(newpassword, 10, function(err1, hash) {
        if (!err1) {
          user.username = newusername;
          user.email = newemail;
          user.password = hash;
          user.profileURL = profile;
          user.save(function(err2, user) {
            if (!err2) {
              user.password = undefined;
              user.token = undefined;
            }
            cb(err2, user);
          });
        } else {
          cb(err1, user);
        }
      });
    } else {
      cb(err, user);
    }
  });
};

/*
/**
 * cb.params : err,user
 
module.exports.editProfile = function(username, newProfileURL, cb) {
  User.findOne({ username: username }, function(err, user) {
    if (!err) {
      user.profileURL = newProfileURL;
      user.save(function(err1, user) {
        if (!err1) {
          user.password = undefined;
          user.token = undefined;
        }
        cb(err1, user);
      });
    } else {
      cb(err);
    }
  });
};

/**
 * cb.params : err,user
 
module.exports.editPassword = function(username, newpassword, cb) {
  User.findOne({ username: username }, function(err, user) {
    if (!err) {
      bcrypt.hash(newpassword, 10, function(err1, hash) {
        if (!err1) {
          user.password = hash;
          user.save(function(err2, user) {
            if (!err2) {
              user.password = undefined;
              user.token = undefined;
            }
            cb(err2, user);
          });
        } else {
          cb(err1, user);
        }
      });
    } else {
      cb(err, user);
    }
  });
};

/**
 * cb.param : err if not return ok response
 
module.exports.verify = function(username, token = "", cb) {
  User.findOne({ username: username }, function(err, user) {
    if (!err) {
      if (user.token == token) {
        user.verified = true;
        user.save(function(err, user) {
          if (!err) {
            user.password = undefined;
            user.token = undefined;
          }
          cb(err, user);
        });
      } else {
        cb(Error("token is not valid"));
      }
    } else {
      cb(err);
    }
  });
};
*/
