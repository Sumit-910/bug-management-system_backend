const ROLE = require('../constants/roles');

const isAdmin = (userId, organization) => {
    const member = organization.members.find(member => member.userId.toString() === userId.toString());
    return member && member.role === ROLE.ADMIN;
};

const isProjectLead = (userId, project) => {
    return project.ProjectLead.toString() === userId.toString();
};
module.exports = { 
    isAdmin, 
    isProjectLead
};
