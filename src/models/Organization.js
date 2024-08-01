const mongoose = require('mongoose');
const { ROLE } = require('../constants');

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            role: {
                type: String,
                enum: Object.values(ROLE),
                default: ROLE.GUEST
            }
        }
    ],
    pendingRequests: [
        {
            email: {
                type: String,
                required: true,
                ref: 'User'
            },
            username: {
                type: String,
                required: true,
                ref: 'User'
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    projects: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project'
        }
    ]
}, {
    timestamps: true
});

const Org = mongoose.model('Organization', organizationSchema);
module.exports = Org;