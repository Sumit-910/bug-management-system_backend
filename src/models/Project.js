const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true
    },
    ProjectLead: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true
    },
    projectLink: {
        type: String
    },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    bugs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Bug'
        }
    ]
}, {
    timestamps: true
});

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
