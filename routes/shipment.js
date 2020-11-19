var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const util = require(process.cwd() + '/util');
const upload = util.upload;
const path = require("path");
const fs = require("fs")
const { remove } = require('../models/User');
const { fstat } = require('fs');
const Shipment = mongoose.model('Shipment');
const ShipDoc = mongoose.model('ShipDoc');
const Mailer = require('../core/mail')

// router.post('/addShipment', async function (req, res) {
//   let body = req.body;
//   body.shipmentNO = makeid(4).toUpperCase() + Math.floor(100000 + Math.random() * 900000);
//   let toSave = new Shipment(body);
//   let saved = await toSave.save();
//   if (saved) {
//     res.status(200).json(saved);
//   } else {
//     res.status(500).json({ status: 500, data: null, message: "Error with saving Shipment" });
//   }
// });
// function makeid(length) {
//   var result = '';
//   var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//   var charactersLength = characters.length;
//   for (var i = 0; i < length; i++) {
//     result += characters.charAt(Math.floor(Math.random() * charactersLength));
//   }
//   return result;
// }

router.get('/getAllShipment', async function (req, res) {
  let found = await Shipment.find({}).populate('vendor_id modeType');
  if (found && found.length) {
    res.status(200).json(found);
  } else {
    res.status(500).json({ status: 500, data: null, message: "No data exist" });
  }

});


router.get('/getShipmentById/:id', async function (req, res) {
  try {
    var shipmentId = req.params.id
    let shipment = await Shipment.aggregate([
      { "$match": { "_id": ObjectId(shipmentId) } },
      {
        $lookup: {
          from: "shipmentmodes",
          localField: "modeType",
          foreignField: "_id",
          as: "modeData"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "vendor_id",
          foreignField: "_id",
          as: "vendorData"
        }
      },
      {
        $lookup: {
          from: "shipdocs",
          localField: "_id",
          foreignField: "shipment_id",
          as: "docData"
        }
      },
    ]);
    if (shipment && shipment.length) {
      res.status(200).send({ status: 200, data: shipment }).end()
    } else {
      res.status(500).send({ status: 500, data: null, message: "Shipment not  found" }).end()
    }
  }
  catch (e) {
    console.log("exception with GetUserById: ", e)
  }
});

router.post('/uploadShipdoc', upload, async (req, res) => {
  if (!req.file) {
    res.status(500).send({ status: 500, data: null, message: 'no file recieved' });
  } else {
    if (req.body) {

      res.status(200).send({ status: 200, data: req.file.path, message: "File Upload Succesfull" })
    }
  }
});


router.get('/removeAllShipment', async (req, res) => {
  let removed = await Shipment.remove({});
  if (removed) {
    res.send(removed);
  }
});
router.post('/editShipment', async (req, res) => {
  let body = req.body;
  if (body && body.shipmentId) {
    let updated = await Shipment.findByIdAndUpdate(body.shipmentId, {
      $set: body.data
    }, {
      new: true
    });
    if (updated) {
      res.status(200).send({ status: 404, data: updated });
    } else {
      res.status(404).send({ status: 404, message: "Problem with Update" });

    }
  } else {
    res.status(404).send({ status: 404, message: "Please send ShipmentDetail" })
  }
});
router.post('/saveShipdoc', async (req, res) => {

  if (req.body) {
    let toSave = new ShipDoc(req.body);
    let saved = await toSave.save();
    if (saved) {
      res.status(200).send({ status: 200, data: saved, message: "Save Doc Detail Succesfull" })
    } else {
      res.status(500).send({ status: 500, data: null, message: 'Problem with Saving Upload Data' });
    }
  } else {
    res.status(500).send({ status: 500, data: null, message: 'Please send data to save' });

  }
});
router.get('/getShipmentByVendorId/:id', async (req, res) => {
  try {
    var vendorId = req.params.id
    let shipment = await Shipment.find({ $or : [{vendor_id: vendorId}, {user_id : vendorId}] }).populate('vendor_id modeType');
    if (shipment && shipment.length) {
      res.status(200).send({ status: 200, data: shipment }).end()
    } else {
      res.status(500).send({ status: 500, data: null, message: "Shipment not  found" }).end()
    }
  }
  catch (e) {
    console.log("exception with getShipmentByVendorId: ", e)
  }
});

router.get('/getShipmentByMemberId/:id', async (req, res) => {
  try {
    var vendorId = req.params.id
    let shipment = await Shipment.find({ user_id: vendorId }).populate('vendor_id modeType');
    if (shipment && shipment.length) {
      res.status(200).send({ status: 200, data: shipment }).end()
    } else {
      res.status(500).send({ status: 500, data: null, message: "Shipment not  found" }).end()
    }
  }
  catch (e) {
    console.log("exception with getShipmentByMemberId: ", e)
  }
});

router.post("/downloadDoc", (req, res) => {
  const filePath = req.body.doc_path;
  const file = path.resolve(process.cwd() + '/' + filePath);
  //No need for special headers
 
  res.sendFile(file);
})

router.post("/deleteDoc",async (req, res) => {
   let docId = req.body.docId;
   let doc_path = req.body.doc_path;
   
   fs.unlink(process.cwd()+ "/" + doc_path, async(err) => {
    try{
    if (err) throw err;
    let removed =   await ShipDoc.remove({_id : docId});
    if(removed.deletedCount){
      res.send({status : 200, message : "File and Record Has been Removed"})
    }
    else{
      res.send({status : 500, message : "Problem with removing the ShipDoc"})
    }
  }
    catch(e){
      res.send({status : 500, message : "Problem with Delete Doc"})
    }
  });

})


router.post("/updateShimentStatus",async (req, res) => {
   if(req.body){
       let body = req.body;
       let shipment = await Shipment.findOne({_id : body.shipmentId}).populate("user_id");
       if(shipment && shipment.user_id){
        shipment.status = body.status;
        let saved = await shipment.save();
        if(saved){
        let mailerObj = {
          user : shipment.user_id,
          subject : 'Shipment Update',
          template : `Hi ${shipment.user_id.firstname} ${shipment.user_id.lastname}
                      Your Shipment has been ${shipment.status}`
        }
        res.status(200).send({status: 200, data: saved, message: "Updated shipment  status"}).end();

       Mailer.sendMail(mailerObj).then(function(err, response){
           if(err){
             res.status(500).send({status: 500, data: null, message: "Problem with Send mail"}).end();
           }
        });
        }else{
        return res.status(500).send({status: 500, data: null, message: "Problem with updating shipment status"}).end();

        }
       }else{
        return res.status(500).send({status: 500, data: null, message: "Shipment or User doesn't exist"}).end();
       }
   }
   else{
    return  res.status(500).send({status: 500, data: null, message: "Please send all required fields"}).end()
   }
})


module.exports = router;
