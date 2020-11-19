const mongoose = require('mongoose');


const paymentInfoSchema = new mongoose.Schema({
    holderName : {
        type : String,
        required : true
    },
    cardNo :{
        type : String,
        required : true
    },
    expDate : {
        type : Date,
        required : true
    },
    securityCode : {
        type : String,
        required : true
    },
    zip_code : {
        type : String,
        required : true
    }, 
    vendor_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    createdAt: { type: Date, required: true, default: Date.now },
});


module.exports = mongoose.model('PaymentInfo', paymentInfoSchema);