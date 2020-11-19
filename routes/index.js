var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model("User");
const Destination = mongoose.model("Destination");
const crypto = require('crypto');
const Withdraw = mongoose.model("Withdraw");
// const VendorRate = mongoose.model('VendorRate');
var paypal = require('paypal-rest-sdk');

const {ObjectId} = require('mongodb');
const nodemailer = require('nodemailer');
const zipcodes = require('zipcodes');
const config = require('../config')
const Shipment = mongoose.model('Shipment');
const FbaPalletRate = mongoose.model("FbaPalletRate");
const FbaContainerRate = mongoose.model('FbaContainerRate');
const FbaFtlRate =  mongoose.model('FbaFtlRate');
var ShipmentMode = mongoose.model('ShipmentMode');
const passwordResetToken = require('../models/ResetPassword');
const Mailer = require('../core/mail')

var pdf = require("pdf-creator-node");
var fs = require('fs');
paypal.configure({
  'mode': config.PAYPAL_MODE, //sandbox or live
  'client_id': config.PAYPAL_CLIENT_ID,
  'client_secret': config.PAYPAL_CLIENT_SECRET
});
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/getAllDestination', async function(req, res){
      let destinations =  await Destination.find({});
      destinations=   destinations.filter(e=> {
        if(!e.status){
          return true;
        }else{
          return e.status =='active'
        }
      })
      if(destinations.length){
        res.send({status : 200, data : destinations});
      }else{
        res.send({status : 500, data : null, message : "No destinations Found"});

      }
})

router.get('/getAllArrivingPort', async function (req, res) {
  let found = await ArrivingPort.find({});
   if(found){
      res.status(200).json(found);
   }else{
       res.status(500).json({ status: 500, data: null, message: "No data exist" });
   }

});


router.post('/dashboard', async function(req, res) {
  if(!req.body.user_id && !req.body.vendor_id){
  var active_vendor = await User.find({status : 'active', role : "VENDOR"}, {status:1}).count();
  var customer_count = await User.find({role : "MEMBER"}, {email : 1}).count();
  }
  var date = new Date();
  var firstDay = new Date(date.getFullYear(), 0, 1);
  var lastDay = new Date(date.getFullYear(), 12, 0);
  for(var p in req.body){
    req.body[p] = ObjectId(req.body[p]);
  }
  let total_billing_price = await Shipment.aggregate([{
    $match : req.body},
    {
    $group:
    {
      _id: {  year: { $year: "$create_at" } },
      totalAmount: { $sum:  "$price"},
      count:{$sum:1}
    }
    }]);
  if(total_billing_price && total_billing_price.length){
  res.status(200).send({status : 200, data :
     {shipment_count : total_billing_price[0].count,
      active_vendor: active_vendor || 0, 
      customer_count: customer_count ||0,
      total_billing_price }
    })
}else{
    res.status(200).send({status : 200, data :
     {shipment_count : 0,
      active_vendor: active_vendor || 0, 
      customer_count: customer_count ||0}
    })
}
});

// router.get('/getAllVendorRates',async function(req,res){
//   let allRates = await VendorRate.find({}).populate('vendor_id');
//   if(allRates.length){
//     res.status(200).send({status:200, data:allRates});
//   }else{
//     res.status(500).send({status:500, message: 'No Rates Exist'})
//   }
// })

router.post('/getVendorRates',async function(req, res){
  let origin_zip = req.body.origin;
  let destination = req.body.destination;
  let mode = req.body.mode;
  let vendor_rates = [];
  if(mode){
  if(mode ==="fbaPallet"){
   getPalletRates(destination, origin_zip, vendor_rates).then(function(result,err){
    if(result == '501'){
      res.status(500).send({status :500, message : 'No Quotes Found'});
    }else if(result == '502'){
      res.status(500).send({status :500, message : 'No Rates for Destination'});
    }else{
      res.status(200).send(result);
    }

   });
  }else if(mode ==="fbaContainer"){
    getContainerRates(destination, origin_zip, vendor_rates).then(function(result,err){
      if(result == '501'){
        res.status(500).send({status :500, message : 'No Quotes Found'});
      }else if(result == '502'){
        res.status(500).send({status :500, message : 'No Rates for Destination'});
      }else{
        res.status(200).send(result);
      }
  
     });
  }else{
    // let distance = req.body.distance;
    getFtlRates(destination, origin_zip, vendor_rates).then(function(result,err){
      if(result == '501'){
        res.status(500).send({status :500, message : 'No Quotes Found'});
      }else if(result == '502'){
        res.status(500).send({status :500, message : 'No Rates for Destination'});
      }else{
        res.status(200).send(result);
      }
  
     });
  }
}else{
    res.status(500).send({status :500, message : 'Please send the selected Mode'});
}
})

function getTodayDate(){
  return `${new Date().getMonth() + 1}/${new Date().getDate()}/${new Date().getFullYear()}`
}

async function getFtlRates(destination, origin_zip, vendor_rates){
  return new Promise(async (resolve, rejects)=>{

    vendor_rates['fbaftl'] = [];
    let date =  getTodayDate();
    // let allRates = await FbaPalletRate.find({}).populate('vendor_id').populate('fbaPallet.rates.wareHouse').populate('fbaPallet.rates.location');
    let allRates = await FbaFtlRate.aggregate([
      {$match : { wareHouse: ObjectId(destination), expDate : {$gte : new Date(date) }}},
      {
        $lookup: {
           from: "vendorbizinfos",
           localField: "vendor_id",    // field in the orders collection
           foreignField: "_id",  // field in the items collection
           as: "bizinfo"
        }
     },
        {
        $lookup: {
           from: "users",
           localField: "vendor_id",    // field in the orders collection
           foreignField: "_id",  // field in the items collection
           as: "vendor_id"
        }
     },
          {
        $lookup: {
           from: "destinations",
           localField: "wareHouse",    // field in the orders collection
           foreignField: "_id",  // field in the items collection
           as: "wareHouse"
        }
     },
     {
        $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$bizinfo", 0 ] }, "$$ROOT" ] }}
     },
    { $project: { bizinfo: 0 } }
   ])

    if (origin_zip && destination) {
      if (allRates.length) {
        for (var i = 0; i < allRates.length; i++) {
          let freePickupRadius = allRates[i].freeRadius;
          allRates[i].vendor_id = allRates[i].vendor_id[0];
          allRates[i].wareHouse = allRates[i].wareHouse[0];
          if(allRates[i].vendor_id && !allRates[i].vendor_id.deleted){
            let distance = zipcodes.distance( parseInt(allRates[i].pickupRangeCode), parseInt(origin_zip));
              allRates[i].rate = parseInt(allRates[i].rate + ((allRates[i].deadHeadRate * (distance ? distance : freePickupRadius -freePickupRadius ) ) || 0))
            let obj = {
                    vendor: allRates[i].vendor_id,
                    rate: allRates[i]
                  }
                vendor_rates['fbaftl'].push(obj);

          // if (allRates[i].pickupRangeCode === origin_zip) {
          //   let obj = {
          //     vendor: allRates[i].vendor_id,
          //     rate: allRates[i]
          //   }
          //   vendor_rates['fbaftl'].push(obj)
          // } else {
          //   let zip_codes = zipcodes.radius(allRates[i].pickupRangeCode, freePickupRadius);
          //   if (zip_codes.includes(origin_zip)) {
          //     let obj = {
          //       vendor: allRates[i].vendor_id,
          //       rate: allRates[i]
          //     }
          //     vendor_rates['fbaftl'].push(obj);
          //   }
          // }
        }
        }
        if (vendor_rates['fbaftl'].length) {
          resolve({ fbaftl: vendor_rates['fbaftl'] });
        } else {
          resolve('501');
        }

      }
      else {
        resolve('502');
      }

    }
  })
  }

async function getContainerRates(destination, origin_zip, vendor_rates){
  return new Promise(async(resolve, rejects)=>{

    let date =  getTodayDate();
  vendor_rates['fbaContainer'] = [];
  // let allRates = await FbaPalletRate.find({}).populate('vendor_id').populate('fbaPallet.rates.wareHouse').populate('fbaPallet.rates.location');
  let allRates = await FbaContainerRate.aggregate([
    {$match : { wareHouse: ObjectId(destination), expDate : {$gte : new Date(date) }}},
    {
      $lookup: {
         from: "vendorbizinfos",
         localField: "vendor_id",    // field in the orders collection
         foreignField: "_id",  // field in the items collection
         as: "bizinfo"
      }
   },
      {
      $lookup: {
         from: "users",
         localField: "vendor_id",    // field in the orders collection
         foreignField: "_id",  // field in the items collection
         as: "vendor_id"
      }
   },
        {
      $lookup: {
         from: "destinations",
         localField: "wareHouse",    // field in the orders collection
         foreignField: "_id",  // field in the items collection
         as: "wareHouse"
      }
   },
        {
      $lookup: {
         from: "arrivingports",
         localField: "arrivingPort",    // field in the orders collection
         foreignField: "_id",  // field in the items collection
         as: "arrivingPort"
      }
   },
   {
      $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$bizinfo", 0 ] }, "$$ROOT" ] }}
   },
  { $project: { bizinfo: 0 } }
 ])

  if (origin_zip && destination) {
    if (allRates.length) {
      for (var i = 0; i < allRates.length; i++) {
        allRates[i].vendor_id = allRates[i].vendor_id[0];
        allRates[i].wareHouse = allRates[i].wareHouse[0];
        allRates[i].arrivingPort = allRates[i].arrivingPort[0];
        if(allRates[i].vendor_id && !allRates[i].vendor_id.deleted){
        if (allRates[i].arrivingPort.zip_code === origin_zip) {
          let obj = {
            vendor: allRates[i].vendor_id,
            rate: allRates[i]
          }
          vendor_rates['fbaContainer'].push(obj)
        } 
      }
      }
      if (vendor_rates['fbaContainer'].length) {
        resolve({ fbaContainer: vendor_rates['fbaContainer'] });
      } else {
        resolve('501');
      }

    }
    else {
      resolve('502');
    }

  }
})
}

async function getPalletRates(destination, origin_zip, vendor_rates){
  return new Promise(async (resolve, rejects)=>{
    let date =  getTodayDate();
    vendor_rates['fbaPallet'] = [];
    // let allRates = await FbaPalletRate.find({}).populate('vendor_id').populate('fbaPallet.rates.wareHouse').populate('fbaPallet.rates.location');
    let allRates = await FbaPalletRate.aggregate(
      [
        {$match : { wareHouse: ObjectId(destination), expDate : {$gte : new Date(date) }}},
        {
          $lookup: {
             from: "vendorbizinfos",
             localField: "vendor_id",    // field in the orders collection
             foreignField: "_id",  // field in the items collection
             as: "bizinfo"
          }
       },
          {
          $lookup: {
             from: "users",
             localField: "vendor_id",    // field in the orders collection
             foreignField: "_id",  // field in the items collection
             as: "vendor_id"
          }
       },
            {
          $lookup: {
             from: "destinations",
             localField: "wareHouse",    // field in the orders collection
             foreignField: "_id",  // field in the items collection
             as: "wareHouse"
          }
       },
            {
          $lookup: {
             from: "locations",
             localField: "location",    // field in the orders collection
             foreignField: "_id",  // field in the items collection
             as: "location"
          }
       },
       {
          $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$bizinfo", 0 ] }, "$$ROOT" ] }}
       },
      { $project: { bizinfo: 0 } }
     ]
      
      )

    if (origin_zip && destination) {
      if (allRates.length) {
        for (var i = 0; i < allRates.length; i++) {
          let freePickupRadius = allRates[i].freePickupRadius;
          allRates[i].vendor_id = allRates[i].vendor_id[0];
          allRates[i].wareHouse = allRates[i].wareHouse[0];
          allRates[i].location = allRates[i].location[0];
        if(allRates[i].vendor_id && !allRates[i].vendor_id.deleted){

          if (allRates[i].location.zip === origin_zip) {
            let obj = {
              vendor: allRates[i].vendor_id,
              rate: allRates[i]
            }
            vendor_rates['fbaPallet'].push(obj)
          } else {
            let zip_codes = zipcodes.radius(allRates[i].location.zip, freePickupRadius);
            if (zip_codes.includes(origin_zip)) {
              let obj = {
                vendor: allRates[i].vendor_id,
                rate: allRates[i]
              }
              vendor_rates['fbaPallet'].push(obj);
            }
          }
        }
        }
        if (vendor_rates['fbaPallet'].length) {
          resolve({ fbaPallet: vendor_rates['fbaPallet'], underfreePU : true });
        } else {
          if(allRates.length){
            for (var i = 0; i < allRates.length; i++) {
              allRates[i].freePickupRadius = "No free pickup and need to deliver to vendor's warehouse"
              allRates[i].location.name = allRates[i].location.city + ' ' + allRates[i].location.state + ' ' + allRates[i].location.zip; 
              let obj = {
                vendor: allRates[i].vendor_id,
                rate: allRates[i]
              }
              vendor_rates['fbaPallet'].push(obj);
            }
          resolve({ fbaPallet: vendor_rates['fbaPallet'], underfreePU : false });
            }else{
          resolve('501');
          }
        }

      }
      else {
        resolve('502');
      }

    }
  })
  }

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

function sendMail(user, resettoken){
    var transporter = nodemailer.createTransport({
          host: config.SMTP_HOST,
          secure : true,
          port: config.SMTP_PORT,
            //  service: 'gmail',
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
    <a href ="https://fba.udaantechnologies.com/resetPassword/${resettoken.resettoken}\">Reset Password</a>
            `
  };
  transporter.sendMail(mailOptions, function(err){
    if(err){  console.log(err)}
    
  });
}

router.get('/getAllShipmentMode', async function (req, res) {

    let found = await ShipmentMode.find({})
     if(found){
        res.status(200).json(found);
     }else{
         res.status(500).json({ status: 500, data: null, message: "No data exist" });
     }

 });

router.post('/editShipper', async function(req,res){
  if(req.body.email && req.body.phoneNo && emailValidator(req.body.email) && phoneNoValidator(req.body.phoneNo)){
  var newUser = new User(req.body);
  let query={};
  let emailUser = [];
  if(req.body._id){
    query = {_id : req.body._id};
    emailUser = await User.find({ _id : {$ne :  req.body._id}, email: req.body.email});
  }else{
    query =  { email: req.body.email};
  }
  var found = await User.findOne(query);
  let shipment = {};
if(!found && !emailUser.length){
  req.body.type = 'local';
  req.body.status = 'active';
  req.body.role = req.body.role || "MEMBER"; 
  User.createUser(newUser,async  function(err, user){
    try{
    if(err) throw new Error(err);
    if(user){
    var resettoken = new passwordResetToken({ _userId: user._id, resettoken: crypto.randomBytes(16).toString('hex') });

    res.status(201).send({status: 201, data: newUser }).end();
    resettoken.save(async function (err) {
      if (err) { return res.status(500).send({ msg: err.message }); }
      passwordResetToken.find({ _userId: user._id, resettoken: { $ne: resettoken.resettoken } }).remove().exec();
      sendMail(user, resettoken);
      // res.status(200).send({status: 200, message: 'Reset Password successfully.'}).end()
      })

    }else{
      res.status(500).send({status: 500, data: null, message: "Problem with save shipment"}).end()

    }
  }
  catch(e){
    console.log(e)
  }
  });

}
else if(!emailUser.length){
   User.findOneAndUpdate(query,{
     $set : req.body
   },{
     new : true
   }, async function(err, result){
     if(err){
      res.status(500).send({status :500, message : 'Probem with Update Shipper'})
     }else{
       if(result){
      res.status(200).send({status: 200, data: result}).end();
      }else{
        res.status(500).send({status: 500, data: null, message: "Problem with save shipment"}).end()
      }
     }
   })
}else{
res.status(500).send({status: 500, data: null, message: "User already exist with the mail"}).end()

}
}else{
res.status(500).send({status: 500, data: null, message: "User data not Validated"}).end()
}
})


router.post('/saveShipperDetail', async function(req,res){
if(req.body){
  req.body.data.shipmentNO = makeid(4).toUpperCase() + Math.floor(100000 + Math.random() * 900000);
  let toSave = new Shipment(req.body.data);
  let saved =  await toSave.save();
  if(saved){
    res.status(200).send({status: 200, data: saved}).end();
    let vendRate = req.body.vendorRate
    let customer = req.body.vendorRate.user;
    let vendor = req.body.vendorRate.rate.vendor_id;
    if(customer){
    var html = fs.readFileSync(process.cwd() + '/templates/boltemplate.html', 'utf8');
    req.body.data.user = customer;
    req.body.data.vendor = vendor;
    req.body.data.vendRate = vendRate;
    if(vendRate.modeId.name=='FBA Pallet'){
      if(!vendRate.underfreePU){
      req.body.data.vendor.firstname = customer.firstname;
      req.body.data.vendor.lastname = customer.lastname;
      }
    }
    var document ={
      html: html,
      data:  req.body.data,
      path: "./output"+req.body.data.user.phoneNo +".pdf"
  };
  var options = {
    height: "15.5in",
    width: "12in",
    // border: "10mm",

  };
  pdf.create(document, options)
    .then(res => {
        if(res.filename){
          fs.readFile(process.cwd() + '/output'+ req.body.data.user.phoneNo +'.pdf',function(err,data){
        if(data){
          let mailerObj = {
            user : req.body.data.user,
            subject : 'Recovery BOL',
            template : `Hi ${req.body.data.user.firstname} ${req.body.data.user.lastname}`,
            attachments: 
              {
                  'filename': 'Recovery BOL.pdf',
                  'content': data                                 
              }
          }
          Mailer.sendMail(mailerObj).then(function(err, response){
            fs.unlink(process.cwd() + '/output'+ req.body.data.user.phoneNo +'.pdf',(error) => {
              if (error) {
                  console.log("failed to delete local image:"+error);
              } else {
                  console.log('successfully deleted local image');                                
              }
          });
            if(err){
              res.status(500).send({status: 500, data: null, message: "Problem with Send mail"}).end();
            }
         });
        }
        });
        }
    })
    .catch(error => {
        console.error(error)
    });
  }
  }else{
    res.status(500).send({status: 500, data: null, message: "Problem with save shipment Detail"}).end()
  }
}else{
  res.status(500).send({status: 500, data: null, message: "Please send all required fields"}).end()

}
})

function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}


router.post('/saveWithdraw', async function (req, res) {
  req.body.status = 'pending';
  let toSave = new Withdraw(req.body);
  let saved = await toSave.save();
   if(saved){
      res.status(200).json(saved);
   }else{
       res.status(500).json({ status: 500, data: null, message: "Problem with saving Withdrawl" });
   }

});


router.get('/getAllWithdraws', async function (req, res) {
  let found = await Withdraw.find({}).populate('vendor_id');
   if(found){
      res.status(200).json(found);
   }else{
       res.status(500).json({ status: 500, data: null, message: "Problem with WithDrawls" });
   }

});


router.post('/approveRejectWithdraw', async function (req, res) {
  let data  = req.body;
  let paypalMail = data.vendor_id.paypalMail;
  data.vendor_id = data.vendor_id._id; 
  var sender_batch_id = Math.random().toString(36).substring(9);

  if(data.status=='approved'){
  var create_payout_json = {
    "sender_batch_header": {
        "sender_batch_id": sender_batch_id,
        "email_subject": "You have a payment"
    },
    "items": [
        {
            "recipient_type": "EMAIL",
            "amount": {
                "value": data.amount,
                "currency": "USD"
            },
            "receiver": paypalMail,
            "note": "Thank you.",
            "sender_item_id": "item_3"
        }
    ]
};
var sync_mode = 'true';
paypal.payout.create(create_payout_json, async function (error, payout) {
  if (error) {
    return res.status(500).json({status : 500, message : "Transfer Failed"});

  } else {
   let update = await Withdraw.findByIdAndUpdate(data._id, data, {new : true});
    return res.status(200).json({status : 200, message : "Fund Transer Successfull"});

  }
});
  }else{
   let update = await Withdraw.findByIdAndUpdate(data._id, data, {new : true});
    return res.status(200).json({status : 200, message : "Updated the collection"});
  }
});
// async function saveShipment(data){
//   return new Promise(async (resolve, reject)=>{
//   if(!data.shipment_id){
//     let toSave = new Shipment({user_id : data.user_id});
//     let saved =  await toSave.save();
//     if(!saved){
//       reject();
//     }
//     resolve(toSave.id);
//     }
//   else{
//   Shipment.findOneAndUpdate({_id : data.shipment_id},{
//      $set : data.data
//   }, {
//     new: true
//   } ,function(err, result){

//     if(err){
//       reject();
//     }
//     resolve( result);
//   })
//   }
// })
// }

module.exports = router;
