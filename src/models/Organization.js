const mongoose = require('mongoose');
const { ROLE } = require('../constants');

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    members: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
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