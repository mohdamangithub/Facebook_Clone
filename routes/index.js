var express = require("express");
var router = express.Router();
var userModel = require("./users");
const passport = require("passport");
var postModel = require("./posts");
 
const commentModel = require('./comment');
const localStrategy = require("passport-local");
var path = require("path");
const multer = require("multer");
var fs = require("fs");
const crypto = require("crypto");

var mailer = require("../nodemailer");
const { profile } = require("console");
const { route } = require("express/lib/application");
passport.use(new localStrategy(userModel.authenticate()));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/profiledp");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, uniqueSuffix);
  },
});

function fileFilter(req, file, cb) {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/svg"
  ) {
    cb(null, true);
  } else {
    cb(new Error("This is not Image Type"), false);
  }
}
const upload = multer({ storage, fileFilter });

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index");
});
router.get("/forgot", function (req, res, next) {
  res.render("forgot");
});
router.get("/forgot/:userid/:key", async function (req, res, next) {
  let user = await userModel.findOne({ _id: req.params.userid });
  if (user.key === req.params.key) {
    res.render("changepass", { user });
  } else {
    res.send("failed");
  }
});
router.post("/changepass", function (req, res, next) {
  res.send("submit");
});
router.post("/searchUser", async function (req, res, next) {
  var userdata = await userModel.findOne({username: req.session.passport.user})
  var searchUser = await userModel.findOne({fullname: req.body.search})
  res.render('search', {userdata, searchUser})
});

router.post("/forgot", async function (req, res, next) {
  var user = await userModel.findOne({ email: req.body.email });
  if (!user) {
    res.send("we have sent a mail, if email exists");
  } else {
    // user ke liye ek key banao
    crypto.randomBytes(80, async function (err, buff) {
      let key = buff.toString("hex");
      user.key = key;
      await user.save();
      mailer(req.body.email, user._id, key).then(function () {
        res.send("Sent Mail");
      });
    });
  }
});

router.get("/profile", isLoggedIn, function (req, res, next) {
  userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts")
    .populate('comment')
    .then(function (userdata) {
      userModel
        .find()
        .populate("posts")
        // .populate("likes")
        .then(function (allusers) {
          postModel
            .find()
            .populate("userId")
            .populate('comments')
            // .populate("commentorId")
            // .populate("likes")
            .then(function (allPostData) {
              res.render("profile", {
                userdata,
                allusers,
                allPostData,
                user: req.session.passport.user,
              });
            });
        });
    });
});

 
router.post('/checkUsername', isLoggedIn, async function (req, res, next) {
  const regex = new RegExp(`^${req.body.search}`, 'i');
  const users = await userModel.find({
    username: regex
  })
  res.json(users)
});

router.post("/changepass/:userid", async function (req, res, next) {
  var user = await userModel.findOne({ _id: req.params.userid });
  if (req.body.password === req.body.confirmpassword) {
    user.setPassword(req.body.password, async function () {
      await user.save();
      user.key = "";
      await user.save()
      req.login(user, function (err) {
        if (err) {
          return next(err);
        }
        return res.redirect("/profile");
      });
    });
  }

});
router.post("/updateprofile", isLoggedIn, function (req, res, next) {
  userModel
    .findOneAndUpdate(
      { username: req.session.passport.user },
      {
        fullname: req.body.fullname,
        username: req.body.username,
        number: req.body.number,
        // email: req.body.email,
        // age: req.body.age,
      },
      { new: true }
    )
    .then(function (updateuser) {
      req.login(updateuser, function (err) {
        if (err) {
          return next(err);
        }
        return res.redirect("/profile");
      });
    });
});
router.post(
  "/uploaddp",
  isLoggedIn,
  upload.single("profiledp"),
  function (req, res, next) {
    userModel
      .findOne({ username: req.session.passport.user })
      .then(function (dpdata) {
        if (dpdata.profilepic !== "def.png") {
          fs.unlinkSync(`./public/images/profiledp/${dpdata.profilepic}`);
        }
        dpdata.profilepic = req.file.filename;
        dpdata.save().then(function () {
          res.redirect("back");
        });
      });
  }
);
router.post(
  "/coverpic",
  isLoggedIn,
  upload.single("coverpic"),
  function (req, res, next) {
    userModel
      .findOne({ username: req.session.passport.user })
      .then(function (coverdata) {
        if (coverdata.coverpic !== "def.png") {
          fs.unlinkSync(`./public/images/profiledp/${coverdata.coverpic}`);
        }
        coverdata.coverpic = req.file.filename;
        coverdata.save().then(function () {
          res.redirect("back");
        });
      });
  }
);

router.get("/loguser/:loguser", isLoggedIn, function (req, res, next) {
  userModel
    .findOne({ username: req.params.loguser })
    .populate("posts")
    .then(function (userdata) {
      userModel
        .findOne({ username: req.session.passport.user })
        .then(function (user) {
          if (userdata.username !== req.session.passport.user) {
            res.render("notloguser", { userdata, user });
          }
        });
    });
});
router.get("/loguser", isLoggedIn, function (req, res, next) {
  userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts")
    .populate('comment')
    .then(function (userdata) {
      postModel
      .find()
      .populate("userId")
      .populate('comments')
      // .populate("likes")
      .then(function (allPostData) {
        res.render("loguser", { userdata, allPostData })
      })
    });
});

router.post(
  "/uploadstory",
  isLoggedIn,
  upload.single("story"),
  function (req, res, next) {
    userModel
      .findOne({ username: req.session.passport.user })
      .then(function (loggendInUser) {
        if (loggendInUser.story !== "def.png") {
          fs.unlinkSync(`./public/images/profiledp/${loggendInUser.story}`);
        }
        loggendInUser.story = req.file.filename;
        loggendInUser.save().then(function () {
          res.redirect("back");
        });
      });
  }
);
router.get("/feed", isLoggedIn, function (req, res, next) {
  userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts")
    .populate('comment')
    .then(function (userdata) {
      postModel
        .find()
        .populate("userId")
        .populate('comments')
        // .populate("likes")
        .then(function (allPostData) {
          res.render("feed", {
            allPostData,
            userdata,
            user: req.session.passport.user,
          });
        });
    });
});
// router.get("/likes/:username", isLoggedIn, function (req, res, next) {
//   userModel.findOne({username: req.params.username})
//   .then(function(storyData){
//     res.render("likes", {storyData})
//   })

// });
router.get("/like/:postid", isLoggedIn, function (req, res, next) {
  userModel
    .findOne({ username: req.session.passport.user })
    .then(function (foundUser) {
      postModel.findOne({ _id: req.params.postid }).then(function (post) {
        if (post.likes.indexOf(foundUser._id) === -1) {
          post.likes.push(foundUser._id);
        } else {
          post.likes.splice(post.likes.indexOf(foundUser._id, 1));
        }
        post.save().then(function () {
          res.redirect("back");
        });
      });
    });
});
 
router.post('/submitComment/:postId', isLoggedIn, async function (req, res, next) {
 var userdata = await userModel.findOne({username: req.session.passport.user});
 var postdata = await postModel.findOne({_id: req.params.postId});
 var commentData = await commentModel.create({
  comment: req.body.comment,
  commentor: userdata.fullname,
  commentorpic: userdata.profilepic,
  postId: postdata._id,
 });
 await commentData.save()
 userdata.comment.push(commentData._id);
 await userdata.save();
 postdata.comments.push(commentData._id);
 await postdata.save();
 res.redirect('back')
});


router.post("/posts", isLoggedIn, upload.single("postImage"), function (req, res, next) {
  userModel
    .findOne({ username: req.session.passport.user })
    .then(function (foundUser) {
      if(req.file){
        postModel
        .create({
          post: req.body.post,
          picture: req.file.filename,
          userId: foundUser._id,
        })
        .then(function (postcreate) {
          foundUser.posts.push(postcreate._id);
          foundUser.save().then(function () {
            res.redirect("back");
          });
        });
      } else if(!req.file){
        postModel
        .create({
          post: req.body.post,
          // picture: req.file.filename,
          userId: foundUser._id,
        })
        .then(function (postcreate) {
          foundUser.posts.push(postcreate._id);
          foundUser.save().then(function () {
            res.redirect("back");
          });
        });
      }
      
    });
});
router.get("/userinp/:userinp", function (req, res, next) {
  userModel.findOne({ username: req.params.userinp }).then(function (userdata) {
    if (userdata) {
      res.json(true);
    } else {
      res.json(false);
    }
  });
});
router.get("/forgotmail/:email", function (req, res, next) {
  userModel.findOne({ email: req.params.email }).then(function (useremail) {
    if (useremail) {
      res.json(false);
    } else {
      res.json(true);
    }
  });
});
router.post("/register", function (req, res) {
  userModel.findOne({ username: req.body.username }).then(function (foundUser) {
    if (foundUser) {
      res.send("username already exists");
    } else {
      var newUse = new userModel({
        fullname: req.body.fullname,
        username: req.body.username,
        number: req.body.number,
        email: req.body.email,
        age: req.body.age,
      });
      //encrypted password
      userModel
        .register(newUse, req.body.password)

        .then(function (createUser) {
          passport.authenticate("local")(req, res, function () {
            res.redirect("/profile");
          });
        });
    }
  });
});
 
router.get('/delete/:picture/:post', function (req, res, next) {
  postModel.findOneAndDelete({post: req.params.post}).then(function(){
    fs.unlink(`./public/images/profiledp/${req.params.picture}`, function (err) {
      err ? res.send(err) : res.redirect("back");
    });
  })
 
});
router.get('/delete/:post', function (req, res, next) {
  postModel.findOneAndDelete({post: req.params.post}).then(function(){
   res.redirect("back")
  })
 
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/",
  }),
  function (req, res, next) {}
);
router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    setTimeout(function () {
      res.redirect("/");
    }, 500);
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/");
  }
}

module.exports = router;
