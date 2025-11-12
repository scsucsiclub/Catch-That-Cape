const mongoose = require('mongoose');
const { float } = require('webidl-conversions');

const PositionSchema = new mongoose.Schema({

    longitude: {
     type: float,
     required: true
    },
    latitude: {
     type: float,
     required: true
    },
    Time_Stamp: {
        type: float,
        required: true
    },
    note: {
        type: String,
        required: false
    }
});

module.exports = mongoose.model('Position', PositionSchema);
