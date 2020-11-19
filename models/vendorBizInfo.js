var mongoose = require('mongoose');
const { truncate } = require('fs');

const vendorBizInfoSSchema = new mongoose.Schema({
    shipperLogo: {
        type: String
    },
    businessName: {
        type: String,
        required: true
    },
    streetAdd: {
        type: String
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    zip_code: {
        type: String
    },
    vendor_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    createdAt: { type: Date, required: true, default: Date.now },
});


module.exports = mongoose.model('VendorBizInfo', vendorBizInfoSSchema);