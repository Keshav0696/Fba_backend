var mongoose = require('mongoose');

var fbaPalletSchema = new mongoose.Schema({
        vendor_id :{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
          },
        freePickupRadius: {
            type: Number,
            required: true,
            default: 25
        },
       perPalletWeight:{
        type: Number,
        required: true,
        default: 0
        },

        palletsNeeded: {
            type: Number,
            required: true,
            default: 0
        },
        palletMaxLength: {
            type: Number,
            default: 40
        },
        palletMaxWeight: {
            type: Number,
            default: 48
        },
        palletMaxHeight: {
            type: Number,
            required: true,
            default: 72
        },
        wareHouse : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Destination',
            required: true
          },
        location: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location',
            required: true
          },
        rate : {
            type: Number,
            required: true,
            default: 0
          },
          expDate : {
            type: Date,
            required: true,
          },
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
    
})

var FbaPalletRate = mongoose.model('FbaPalletRate', fbaPalletSchema)