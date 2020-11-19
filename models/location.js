const mongoose = require('mongoose');


const locationSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true
    },
    phoneNo : {
        type: String,
        required: true
    },

    address : {
        type: String,
        required: true
    },
    city : {
        type: String,
        required: true
    },
    state : {
        type: String,
        required: true
    },
    zip : {
        type: String,
        required: true
    },
    vendor_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    createdAt: { type: Date, required: true, default: Date.now },
});
var Location = mongoose.model('Location', locationSchema)

module.exports = mongoose.model('Location', locationSchema);