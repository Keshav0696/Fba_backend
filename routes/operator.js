var express = require('express');
var router = express.Router();
var passport = require('passport');
const mongoose = require('mongoose');

var User = mongoose.model('User');

router.post('/addOperator', async function (req, res) {

   let body = req.body;
   body.status = body.status || 'active';
   body.role =  'OPERATOR';
   let found = await User.findOne({email : body.email})
   if(body && req.user.role=='ADMIN'){
    if(!found){
        let toSave = new User(body);
        let saved  = await toSave.save()
        if(saved){
            res.status(200).json(saved);
        }else{
         res.status(500).json({ status : 500, message: 'Error with saving Operators' });
        }
    }else{
        res.status(500).json({ status : 500, message: 'Operator already Exist' });
    }
   }else{
    res.status(500).json({status : 500, message : "Role do not have access"});
   } 
});

router.post('/editOperator', async function (req, res) {
    let body  = req.body;
    if(body && body.data && body.operatorId){
      if(req.user.role!='ADMIN'){
        res.status(500).json({status : 500, message: 'Role do not have access' }).end()  
      }
    let edited = await  User.findByIdAndUpdate(body.operatorId, {
       $set: body.data
   },
   {
       new: true
   }) 
   if(edited){
    res.send(edited);
}else{
   res.status(500).json({status : 500, message: 'Problem with Update' });
}
    }else{
        res.status(500).json({status : 500, message: "Please Send Operator Id" });
    }
});

router.get('/getAllOperator', async function (req, res) {
  try{
  if(req.user.role!='ADMIN'){
    res.status(500).json({status : 500, message: 'Role do not have access' }).end()  
  }
  let found = await User.find({role : "OPERATOR", deleted : {$exists: false}});
   if(found && found.length){
      res.status(200).json(found);
   }else{
       res.status(500).json({ status: 500, data: null, message: "No data exist" });
   }
  }
  catch(e){
    console.log(e)
  }
});

router.post('/activeDeactivate', async function (req, res) {
    if (req.body.operatorId) {
      let operatorId = req.body.operatorId;
      var edited = await User.findByIdAndUpdate(operatorId, {
        $set: {status : req.body.status}
      },
        {
          new: true
        })
      if (edited) {
        res.send(edited);
      } else {
        res.status(500).json({status : 500, message: 'Operator not  found' }).end()
      }
    }
  })

router.get('/deleteOperator/:id', async function (req, res) {
    if (req.params.id ) {
      if(req.user.role!='ADMIN'){
        res.status(500).json({status : 500, message: 'Role do not have access' }).end()  
      }

      var operatorId = req.params.id;
      var removed = await User.remove({ _id: operatorId });
      if (removed.deletedCount) {
        res.send(removed);
      } else {
        res.status(500).json({status : 500, message: 'Operator Id does not exist' }).end()
      }
    } else {
      res.status(500).json({status : 500, message: 'Please send Operator Id' }).end()
    }
  })


module.exports = router;
