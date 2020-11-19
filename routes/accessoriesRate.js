var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');

var AccessoriesRate = mongoose.model('accessoriesRate');
var passport = require('passport');



function jwt (req, res, next){
  passport.authenticate('jwt', { session: false }, function(err, user, info) { 
      if (err) { return next(err); } 
      if (!user) { return res.send("Custom Unauthorised").end(); } 
      // edit as per comment
      //return res.send("Test Route Accessed").end();
      req.user = user;   // Forward user information to the next middleware
      next();
  })(req, res, next);
}


router.post('/addAccessoriesRate', jwt, async function (req, res) {
  if(req.user.role == 'ADMIN'){
    if(req.body) {
      let toSave = new AccessoriesRate(req.body);
      let saved  = await toSave.save();
      if(saved){
          res.status(200).json(saved);
      }else{
       res.status(500).json({ status: 500, data: null, message: "Error occured. Please try again" });
      }
    } else {
      res.status(500).json({ status: 500, data: null, message: "Please enter all required fields" });
    }
  }else{
    res.status(500).json({ status: 500, data: null, message: "Role don't have access" });
  } 
});



router.put('/editAccessoriesRate/:id', jwt, async function (req, res) {
  if(req.user.role == 'ADMIN'){
    if(req.body && req.params.id) {

      var edited = await AccessoriesRate.findOneAndUpdate({ _id: req.params.id }, {
        $set: req.body
      },
        {
          new: true
        });
      if (edited) {
        res.send(edited);
      } else {
        res.status(500).send({status: 500, data: null, message: "Accessories are not available"});
      }
    } else {
      res.status(500).json({ status: 500, data: null, message: "Please enter all required fields" });
    }
  }else{
    res.status(500).json({ status: 500, data: null, message: "Role not have access" });
  } 
});




router.get('/getAllAccessoriesRate', async function (req, res) {

  let found = await AccessoriesRate.find({})
   if(found){
      res.status(200).json(found);
   }else{
       res.status(500).json({ status: 500, data: null, message: "No data exist" });
   }

});

module.exports = router;
