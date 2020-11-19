
const mongoose = require('mongoose');


const companyDetailSchema = new mongoose.Schema({
    type : {
        type : String,
        enum : ["corporate", "accounting"],
        required : true
    },
    firstName : {
        type : String,
        required : false
    },
    lastName : {
        type : String,
        required : true
    },
    phoneNo : {
        type : String,
        required : true
    },
    fax : {
        type : String,
        required : true
    },
    email :{
        type : String,
        required : true
    },
    vendor_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }, 
    createdAt: { type: Date, required: true, default: Date.now }
});


module.exports = mongoose.model('CompanyDetail', companyDetailSchema);