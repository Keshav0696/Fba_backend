var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');

var ShipmentMode = mongoose.model('ShipmentMode');


router.post('/addShipmentMode', async function (req, res) {

   let body = req.body;
   let found = await ShipmentMode.findOne({ name : body.name})
   if(body &&  req.user.role == 'ADMIN'){
    if(!found){
        let toSave = new ShipmentMode(body);
        let saved  = await toSave.save()
        if(saved){
            res.status(200).json(saved);
        }else{
         res.status(500).json({ status: 500, data: null, message: "Error with saving ShipmentMode" });
        }
    }else{
        res.status(500).json({ status: 500, data: null, message: "ShipmentMode already Exist" });
    }
   }else{
    res.status(500).json({ status: 500, data: null, message: "Role not have access" });
   } 
});


 


module.exports = router;
