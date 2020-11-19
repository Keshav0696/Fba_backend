
var express = require('express');
var router = express.Router();
const User = require('../models/User')
const crypto = require('crypto');
var passport = require('passport');
const FacebookTokenStrategy = require('passport-facebook-token');
// const GoogleTokenStrategy = require('passport-google-token');
const GoogleTokenStrategy = require('passport-google-token').Strategy;
var bcrypt = require('bcryptjs');
const config = require('../config')
const nodemailer = require('nodemailer');
const passwordResetToken = require('../models/ResetPassword');
const jwt = require('jsonwebtoken');


passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
 
  passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
      done(err, user);
    });
  });

// Register User
router.post('/register', async function(req, res){
     var body = req.body;
     body.role = body.role || 'MEMBER';
     body.status = 'active';
     body.type = 'local';
      var newUser = new User(body);
      var found = await User.findOne({ email: req.body.email})
    if(!found){
      User.createUser(newUser, function(err, user){
        try{
        if(err) throw err;
        res.status(200).send({status: 200, data: newUser}).end()
        }
        catch(e){
          console.log(e);
        }
      });
    }
    else{
      res.status(500).send({status: 500, data: null, message: "User already exist with this email"}).end()
    }

  });


  //   // Endpoint to login
// /* POST login. */
router.post('/login', function (req, res, next) {
  passport.authenticate('local', {session: false}, (err, user, info) => {
      if (err || !user) {
          return res.status(400).json({
              status : 400,
              message: err?err : 'Invalid Email or Password',
              user   : user
          });
      }
     req.login(user, {session: false}, (err) => {
         if (err) {
             res.send(err);
         }
         // generate a signed son web token with the contents of user object and return it in the response
         const token = jwt.sign({user}, '8A169E5DFB4F18C678DBAD19A4B4A17F1F8154713192E618DCDBF7D8C9E9ABA4');
         user.token = token;
         return res.json({ status : 200, user});
      });
  })(req, res);
});


var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
  function(email, password, done) {
    User.getUserByEmail(email, function(err, user){
      if(err) throw err;
      if(!user){
        return done(null, false, {message: 'Unknown User'});
      }
      if(user.password){
      User.comparePassword(password, user.password, function(err, isMatch){
        if(err) throw err;
     	if(isMatch){
     	  return done(null, user);
     	} else {
     	  return done(null, false, {message: 'Invalid '});
     	}
     });
    }else{
      return done(null, false, {message: 'Please reset the password'});
    }
   });
  }
));

router.get('/logout', function(req, res){
req.logout();
res.send(null)
});

passport.use(new FacebookTokenStrategy({
    clientID: '578617303046530',
    clientSecret: 'db3754a847c830d48c4b9581138aedc3',
    // clientID: '188022502647729',
    // clientSecret: '33a4a4b7898c5d86eca6f3335cbbebd1',
    fbGraphVersion: 'v3.0'
  }, function(accessToken, refreshToken, profile, done) {
    User.findOne({ 'facebookId' : profile.id }, function(err, user) {
      if (err) return done(err);
      if (user) {
          const token = jwt.sign({user}, '8A169E5DFB4F18C678DBAD19A4B4A17F1F8154713192E618DCDBF7D8C9E9ABA4');
          user.token = token;
          return done(null, user);
      }
      else {
        // if there is no user found with that facebook id, create them
        var newUser = new User();
  
        // set all of the facebook information in our user model
        newUser.facebookId = profile.id;
        const token = jwt.sign({newUser}, '8A169E5DFB4F18C678DBAD19A4B4A17F1F8154713192E618DCDBF7D8C9E9ABA4');
        newUser.token = token;
        newUser.role = "MEMBER";
        newUser.firstname  = profile.displayName.split(' ').slice(0, -1).join(' ');
        newUser.lastname  = profile.displayName.split(' ').slice(-1).join(' ');

        newUser.type  = 'facebook';
        if (typeof profile.emails != 'undefined' && profile.emails.length > 0)
          newUser.email = profile.emails[0].value;
  
        // save our user to the database
        newUser.save(function(err) {
          if (err) throw err;
          return done(null, newUser);
        });
      }
    });
  }
));

router.post('/facebook/token',
  passport.authenticate('facebook-token'),
  function (req, res) {
    // do something with req.user
    // res.send(req.user? 200 : 401);
    res.status(req.user? 200 : 401).json({user: req.user}).end();
  });

passport.use(new GoogleTokenStrategy({
    clientID: '986961472243-fulld3ffucmhascuns30o5k39i93hktc.apps.googleusercontent.com',
    clientSecret: 'TXJjvl8v7n-hX5Arr7LjzboP'
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({ 'googleId' : profile.id }, function(err, user) {
      if (err) return done(err);
      if (user)  {
        const token = jwt.sign({user}, '8A169E5DFB4F18C678DBAD19A4B4A17F1F8154713192E618DCDBF7D8C9E9ABA4');
        user.token = token;
        return done(null, user);
    }
      else {
        // if there is no user found with that facebook id, create them
        var newUser = new User();
  
        // set all of the facebook information in our user model
        newUser.googleId = profile.id;
        // newUser.token = accessToken;
        const token = jwt.sign({newUser}, '8A169E5DFB4F18C678DBAD19A4B4A17F1F8154713192E618DCDBF7D8C9E9ABA4');
        newUser.token = token;
        newUser.role = "MEMBER";
        newUser.firstname  = profile.displayName.split(' ').slice(0, -1).join(' ');
        newUser.lastname  = profile.displayName.split(' ').slice(-1).join(' ');

        newUser.type  = 'google';
        if (typeof profile.emails != 'undefined' && profile.emails.length > 0)
          newUser.email = profile.emails[0].value;
  
        // save our user to the database
        newUser.save(function(err) {
          if (err) throw err;
          return done(null, newUser);
        });
      }
    });
  }
));

router.post('/google/token',
  passport.authenticate('google-token'),
  function (req, res) {
    // do something with req.user
    // res.send(req.user? 200 : 401);
    res.status(req.user? 200 : 401).json({user: req.user}).end();
  });

  router.post('/forgot-password', async function (req, res) {
    if (!req.body.email) {
        return res
        .status(500)
        .json({ status : 500, message: 'Email is required' });
        }
        const user = await User.findOne({
        email:req.body.email
        });
        if (!user) {
        return res
        .status(409)
        .json({  status : 409, message: 'Email does not exist' });
        }
        var resettoken = new passwordResetToken({ _userId: user._id, resettoken: crypto.randomBytes(16).toString('hex') });
        resettoken.save(async function (err) {
        if (err) { return res.status(500).send({ msg: err.message }); }
        passwordResetToken.find({ _userId: user._id, resettoken: { $ne: resettoken.resettoken } }).remove().exec();
        res.status(200).json({ status : 200, message: 'Reset Password successfully.' });
        // let testAccount = await nodemailer.createTestAccount();
        var transporter = nodemailer.createTransport({
          host: config.SMTP_HOST,
          secure : true,
          // service : 'gmail',
          port: config.SMTP_PORT,
          auth: {
            user: config.SMTP_USER,
            pass: config.SMTP_PASSWORD
          }
        });
        var mailOptions = {
        to: user.email,
        from: config.SMTP_FROM,
        subject: 'Reset Password Request',
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.
        Please click on the following link, or paste this into your browser to complete the process:\n
        <a href ="https://fba.udaantechnologies.com/resetPassword/${resettoken.resettoken}">Reset Password</a>  \n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
        }
        transporter.sendMail(mailOptions, (err, info) => {
            if(!err){
                console.log("Email sent")
            } else {
              console.log(err)
            }
        })
        })
 })



 router.post('/valid-password-token', async function (req, res) {
  if (!req.body.resettoken) {
  return res
  .status(500)
  .json({ message: 'Token is required' });
  }
  const user = await passwordResetToken.findOne({
  resettoken: req.body.resettoken
  });
  if (!user) {
  return res
  .status(409)
  .json({ message: 'Invalid URL' });
  }
  User.findOne({ _id: user._userId }).then(() => {
  res.status(200).json({ message: 'Token verified successfully.' });
  }).catch((err) => {
  return res.status(500).send({ msg: err.message });
  });
})

router.post('/new-password', async function (req, res) {
     await  passwordResetToken.findOne({ resettoken: req.body.resettoken },async function (err, userToken, next) {
        if (!userToken) {
          return res
            .status(409)
            .json({ message: 'Token has expired' });
        }
  
        await  User.findOne({
          _id: userToken._userId
        }, async function (err, userEmail, next) {
          if (!userEmail) {
            return res
              .status(409)
              .json({ message: 'User does not exist with this email' });
          }
          return bcrypt.hash(req.body.newPassword, 10, async (err, hash) => {
            if (err) {
              return res
                .status(400)
                .json({ message: 'Error hashing password' });
            }
            userEmail.password = hash;
            await userEmail.save(function (err) {
              if (err) {
                return res
                  .status(400)
                  .json({ message: 'Password can not reset.' });
              } else {
                userToken.remove();
                return res
                  .status(201)
                  .json({ message: 'Password reset successfully' });
              }
  
            });
          });
        });
  
      })
  })
  module.exports = router;