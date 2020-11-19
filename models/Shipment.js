var mongoose = require('mongoose');

// Vendor Schema
var ShipmentSchema = mongoose.Schema({
  shipper_reference : String,
  commodity : String,
  declared_value : String,
  pickup_no : String,
  total_weight : String,
  comments : String,
  service_level : String,
  price : Number,
  temperature : Number,
  quantityOfPallets : Number,
  pickupInfo:{
    business_name: String,
    address : String,
    contact_name : String,
    contact_no : String,
    contact_email: String,
    city : String,
    state : String,
    zip_code : String,
    instruction : String,
    driverAssistance : Boolean,
    tarp : Boolean,
    from_date: {
      type : Date,
    },
    to_date : {
      type : Date,
    },
    scheduled_date: {
      type : Date,
      default : Date.now
    },
    estimated_date : {
      type : Date,
      default : Date.now
    }
  },

  deliveryInfo:{
    // business_name: String,
    address : String,
    // contact_name : String,
    // contact_no : String,
    // contact_email: String,
    city : String,
    state : String,
    zip_code : String,
    // instruction : String,
    // from_date: {
    //   type : Date,
    // },
    // to_date : {
    //   type : Date,
    // },
    // driverAssistance : Boolean,
    // scheduled_date: {
    //   type : Date,
    //   default : Date.now
    // },
    // estimated_date : {
    //   type : Date,
    //   default : Date.now
    // }
  },

  paymentInfo : {
    firstname : String,
    lastname : String,
    email : String,
    phoneNo : String,
    city : String,
    state : String,
    zip_code : String,
    holderName : String,
    cardNumber : String,
    expiry : String,
    cvc : String
  },
  shipmentNO : String,
  modeType : {
      type : mongoose.Schema.Types.ObjectId,
      ref:'ShipmentMode'
  },
  vendor_id: {
    type : mongoose.Schema.Types.ObjectId,
    ref : "User"
  },
  user_id : {
    type : mongoose.Schema.Types.ObjectId,
    ref : "User" 
  },
  status : {
      type : String,
      enum: [ "BOOKED", "INTRANSIT", "DELIVERED", "CHECKEDIN", "LASTLY", "FINALLYEXCEPTION", "CANCELLED"]
  },
  paymentStatus : {
    type: String,
    enum: ["PAID","UNPAID"]
  },
  paymentDueDate : {
    type: Date,
    default : Date.now
  },
  create_at: {
    type : Date,
    default : Date.now
  },
  updated_at: {
     type : Date,
     default : Date.now
   }
});

var Shipment = module.exports = mongoose.model('Shipment', ShipmentSchema);