var mongoose = require('mongoose');

var fbaContainerSchema = new mongoose.Schema({
        vendor_id :{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
          },
        arrivingPort : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ArrivingPort',
        },
        rate: {
            type: Number,
            required: true,
            default: 0
        },
        wareHouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Destination',
        },
        maxDetentionTime: {
            type: Number,
            required: true,
            default: 0
        },
        detChargePerHour: {
            type: Number,
            required: true,
            default: 0
        },
        maxCargoWeight: {
            type: Number,
            required: true,
            default: 40000
        },
        handlingCapacity: {
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

var FbaContainerRate = mongoose.model('FbaContainerRate', fbaContainerSchema)