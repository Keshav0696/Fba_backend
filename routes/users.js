var express = require('express');
var router = express.Router();
var passport = require('passport');
var bcrypt = require('bcryptjs');
const config = require('../config')
const mongoose = require('mongoose');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Destination = mongoose.model("Destination");
const User = mongoose.model('User');
const Port = mongoose.model('ArrivingPort');
const passwordResetToken = require('../models/ResetPassword');

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});


router.get('/getAllUsers', async function (req, res) {
  let users = await User.find({role : "MEMBER", deleted : {$exists: false}})

  if (users && users.length) {
    res.status(200).send({ status: 200, data: users }).end()
  } else {
    res.status(500).send({ status: 500, data: null, message: "User not  found" }).end()
  }
});


router.post('/updatePassword', async function (req, res) {
  await  User.findOne({
    email: req.body.email
  }, async function (err, userEmail, next) {
    if (!userEmail) {
      return res
        .status(409)
        .json({ message: 'User does not exist with this email' });
    }
    return bcrypt.hash(req.body.password, 10, async (err, hash) => {
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
          return res
            .status(201)
            .json({ message: 'Password reset successfully' });
        }

      });
    });
  });

});

router.get('/getUserById/:id', async function (req, res) {
  try {
    var userId = req.params.id
    let user = await User.findOne({_id: userId});
    if (user) {
      res.status(200).send({ status: 200, data: user }).end()
    } else {
      res.status(500).send({ status: 500, data: null, message: "User not  found" }).end()
    }
  }
  catch (e) {
    console.log("exception with GetUserById: ", e)
  }
});

function emailValidator(value){
  let pattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  let emailVal = pattern.test(value);
  return emailVal;
}
function phoneNoValidator(value){
  let phonePattern =/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  let phoneNOVal = phonePattern.test(value);
  return phoneNOVal;
}
router.post('/createUser', async function(req, res){

    req.body.type = 'local';
    req.body.status = 'active';
    req.body.role = req.body.role || "MEMBER"; 
    if(req.body.email && req.body.phoneNo && emailValidator(req.body.email) && phoneNoValidator(req.body.phoneNo)){
    var newUser = new User(req.body);
    var found = await User.findOne({ email: req.body.email})
  if(!found){
    
    User.createUser(newUser, function(err, user){
      try{
      if(err) throw new Error(err);
      var resettoken = new passwordResetToken({ _userId: user._id, resettoken: crypto.randomBytes(16).toString('hex') });
      res.status(200).send({status: 200, data: newUser});
      resettoken.save(async function (err) {
        if (err) { return res.status(500).send({ msg: err.message }); }
        passwordResetToken.find({ _userId: user._id, resettoken: { $ne: resettoken.resettoken } }).remove().exec();
        sendMail(user, resettoken);
        // res.status(200).send({status: 200, message: 'Reset Password successfully.'}).end()
        })

    }
    catch(e){
      console.log(e)
    }
    });

  }
  else{
    res.status(500).send({status: 500, data: null, message: "User already exist"}).end()
  }
}else{
  res.status(500).send({status: 500, data: null, message: "User data not Validated"}).end()
}

});

function sendMail(user,resettoken){
  var transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    secure : true,
    // service: 'gmail',
    port: config.SMTP_PORT,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASSWORD
    }
  });
  var mailOptions = {
    to: user.email,
    from:  config.SMTP_FROM,
    subject: 'Welcome to the FBA Delivery',
    html: `<p> Welcome ${user.firstname} ${user.lastname}</p>
    <p>Please click the Link Reset The Password </p>
     <a href ="https://fba.udaantechnologies.com/resetPassword/${resettoken.resettoken}">Reset Password</a>
            `
  };
  transporter.sendMail(mailOptions, function(err){
    if(err){  console.log(err)}
    
  });
}
router.post('/editUser', async function (req, res) {
  if (req.body.data && req.body._id) {
    let userId = req.body._id;
    let UserSet = req.body.data;
    let found = await User.find({ _id : {$ne :  req.body._id}, email :req.body.data.email }, {_id :1});
    if(!found.length){
    if( emailValidator(req.body.data.email) && phoneNoValidator(req.body.data.phoneNo)){
    var edited = await User.findByIdAndUpdate(userId, {
      $set: UserSet
    },
      {
        new: true
      })
    if (edited) {
      res.send(edited);
    } else {
      res.status(500).send({status: 500, data: null, message: "User not  found"}).end()
    }
  }else{
    res.status(500).send({status: 500, data: null, message: "User not validated"}).end()
  }
}else{
  res.status(500).send({status: 500, data: null, message: "Email already exist"}).end()

}
  }
})
router.post('/activeDeactivate', async function (req, res) {
  if (req.body.userId) {
    let userId = req.body.userId;
    var edited = await User.findByIdAndUpdate(userId, {
      $set: {status : req.body.status}
    },
      {
        new: true
      })
    if (edited) {
      res.send(edited);
    } else {
      res.status(500).send({status: 500, data: null, message: "User not  found"}).end()
    }
  }
})

router.get('/deleteUser/:id', async function (req, res) {
  if (req.params.id) {
    var userId = req.params.id;
    var updated = await User.findOneAndUpdate({ _id: userId},{
     $set : { deleted :true}
    },
  {
     new  : true
  });
    if (updated) {
      res.send(updated);
    } else {
      res.status(500).send({status: 500, data: null, message: "User Id does not exist"}).end()
    }
  } else {
    res.status(500).send({status: 500, data: null, message: "Please send User Id"}).end()
  }
})

router.post('/saveWarehouse', async function (req, res) {
  if(req.body) {
    // if(req.user.role=='ADMIN'){

    let toSave = new Destination(req.body);
    let saved = await toSave.save();
    if(saved){
      res.status(200).json(saved);
    }else{
      
    res.status(500).json({ status: 500, data: null, message: "Problem with saveWareHouse" });

    }
  // }
  // else{
  //     res.status(500).json({status : 500, message: 'Role do not have access' }).end()  
  //   }
  } else {
    res.status(500).json({ status: 500, data: null, message: "Please enter all required fields" });
  }
});


router.put('/editWareHouse/:id', async function (req, res) {
  if(req.body && req.params.id) {
      // if(req.user.role=='ADMIN'){
    var edited = await Destination.findOneAndUpdate({ _id: req.params.id }, {
      $set:  req.body
       },
      {
        new: true
      });
    if (edited) {
      res.send(edited);
    } else {
      res.status(500).send({status: 500, data: null, message: "WareHouse is not available"});
    }
  //   }
  // else{
  //     res.status(500).json({status : 500, message: 'Role do not have access' }).end()  
  //   }
  } else {
    res.status(500).json({ status: 500, data: null, message: "Please enter all required fields" });
  }
});

router.get('/deleteWareHouse/:id', async function (req, res) {
    if (req.params.id) {
      //  if(req.user.role=='ADMIN'){
      var locationId = req.params.id;
      var removed = await Destination.remove({ _id: locationId });
      if (removed.deletedCount) {
        res.send(removed);
      } else {
        res.status(500).send({status: 500, data: null, message: 'WareHouse does not exist' }).end()
      }
    //   }
    // else{
    //   res.status(500).json({status : 500, message: 'Role do not have access' }).end()  
    // }
    } else {
      res.status(500).send({status: 500, data: null, message: 'Please send WareHouse Id' }).end()
    }
  })

router.post('/savePort', async function (req, res) {
  if(req.body) {
    // if(req.user.role=='ADMIN'){

    let toSave = new Port(req.body);
    let saved = await toSave.save();
    if(saved){
      res.status(200).json(saved);
    }else{
      
    res.status(500).json({ status: 500, data: null, message: "Problem with savePorts" });

    }
  // }
  // else{
  //     res.status(500).json({status : 500, message: 'Role do not have access' }).end()  
  //   }
  } else {
    res.status(500).json({ status: 500, data: null, message: "Please enter all required fields" });
  }
});


router.put('/editPort/:id', async function (req, res) {
  if(req.body && req.params.id) {
      // if(req.user.role=='ADMIN'){
    var edited = await Port.findOneAndUpdate({ _id: req.params.id }, {
      $set:  req.body
       },
      {
        new: true
      });
    if (edited) {
      res.send(edited);
    } else {
      res.status(500).send({status: 500, data: null, message: "Port is not available"});
    }
  //   }
  // else{
  //     res.status(500).json({status : 500, message: 'Role do not have access' }).end()  
  //   }
  } else {
    res.status(500).json({ status: 500, data: null, message: "Please enter all required fields" });
  }
});

router.get('/deletePort/:id', async function (req, res) {
    if (req.params.id) {
      //  if(req.user.role=='ADMIN'){
      var locationId = req.params.id;
      var removed = await Port.remove({ _id: locationId });
      if (removed.deletedCount) {
        res.send(removed);
      } else {
        res.status(500).send({status: 500, data: null, message: 'Port does not exist' }).end()
      }
    //   }
    // else{
    //   res.status(500).json({status : 500, message: 'Role do not have access' }).end()  
    // }
    } else {
      res.status(500).send({status: 500, data: null, message: 'Please send Port Id' }).end()
    }
  })


// // Endpoint to get current user
router.get('/user', function (req, res) {
  res.send(req.user);
})

module.exports = router;
