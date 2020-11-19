
const mongoose = require('mongoose');

const accessoriesRateSchema = new mongoose.Schema({
    insidePickup: {
        type: Number,
        required: true,
        default: 0
    },
    liftGatePickup: {
        type: Number,
        required: true,
        default: 0
    },
    limitedAccesspickup: {
        type: Number,
        required: true,
        default: 0
    },
    insideDelivery: {
        type: Number,
        required: true,
        default: 0
    },
    liftGateDelivery: {
        type: Number,
        required: true,
        default: 0
    },
    limitedAccessDelivery: {
        type: Number,
        required: true,
        default: 0
    },
    residentialDelivery: {
        type: Number,
        required: true,
        default: 0
    },

    createdAt: { type: Date, required: true, default: Date.now }
});

module.exports = mongoose.model('accessoriesRate', accessoriesRateSchema);