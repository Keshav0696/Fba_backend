var mongoose = require('mongoose');

var fbaFtlRateSchema = new mongoose.Schema({
        vendor_id :{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
          },
            rate: {
                type: Number,
                required: true,
                default: 0
            },
            pickupRangeCode: {
                type: String,
                required: true
            },
            wareHouse: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Destination',
            },
            freeRadius: {
                type: Number,
                required: true,
                default: 25
            },
            deadHeadRate: {
                type: Number,
                required: true,
                default: 1
            },

            detTime: {
                type: Number,
                required: true,
                default: 4
            },
            detCharge: {
                type: Number,
                required: true,
                default: 0
            },
            availableTrucks: {
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

var FbaFtlRate = mongoose.model('FbaFtlRate', fbaFtlRateSchema)