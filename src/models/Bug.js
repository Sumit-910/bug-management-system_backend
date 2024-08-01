const mongoose = require('mongoose');
const { STATUS, PRIORITY } = require('../constants');

const bugSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(STATUS),
        default: STATUS.RAISED
    },
    priority: {
        type: String,
        enum: Object.values(PRIORITY),
        default: PRIORITY.LOW
    },
    assignedTo: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        }
    ],
    deadline: { type: Date }
},{
        timestamps: true
});

const Bug = mongoose.model('Bug', bugSchema);
module.exports = Bug;
