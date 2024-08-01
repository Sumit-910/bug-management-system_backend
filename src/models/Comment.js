const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    bug: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bug',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', required: true
    },
    createdAt: { type: Date, default: Date.now }
});

const Cmt = mongoose.model('Comment', commentSchema);
module.exports = Cmt;
