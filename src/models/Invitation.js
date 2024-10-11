const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '1d'
    }
});

const Invitation = mongoose.model('Invitation', invitationSchema);
module.exports = Invitation;