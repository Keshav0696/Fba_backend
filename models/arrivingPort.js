const mongoose = require('mongoose');

const arrivingPortSchema = new mongoose.Schema({
    portId : String,
    name : String,
    address: String,
    add: String,
    city : String,
    st_pvn : String,
    zip_code : String,
    iso : String,
    phone : String,
    fax : String,
    firmCode : String,
    web :String,
    type : String,
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        required: true,
        default: Date.now
    }
});
var ArrivingPort = mongoose.model('ArrivingPort', arrivingPortSchema)


