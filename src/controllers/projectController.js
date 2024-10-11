const Project = require('../models/Project');
const Org = require('../models/Organization');
const { ROLE } = require('../constants');
const { isAdmin, isProjectLead } = require('../utils/permissions');

const createProject = async(req,res) => {
    const { name, description, orgId, projectLink } = req.body;
    const userId = req.user._id;

    if(!name || !orgId){
        return res.status(400).json({ msg: "Insufficient details" });
    }

    try {
        const org = await Org.findById(orgId);
        if (!org) {
            return res.status(404).json({ msg: "Organization not found" });
        }

        if(!isAdmin(userId, org)){
            res.send(403).json({msg: "Not authorized"});
        }

        const project = new Project({
            name: name,
            description: description,
            organization: orgId,
            ProjectLead: userId,
            projectLink: projectLink,
            members: [userId]
        });

        const createdProject = await project.save();

        org.projects.push(createdProject._id);
        await org.save();

        res.status(201).json({ msg: "Project created successfully" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Internal server error" });
    }
}

const addMembers = async(req, res) => {
    const { projectId, members } = req.body;
    const userId = req.user._id;

    if (!projectId || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ msg: "Project ID and members array are required" });
    }

    try {
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ msg: "Project not found" });
        }

        const org = await Org.findById(project.organization);
        if (!org) {
            return res.status(404).json({ msg: "Organization not found" });
        }

        if (!(isAdmin(userId, org) || isProjectLead(userId, project))) {
            return res.status(403).json({ msg: "You do not have the required role to add members to the project" });
        }

        const validMembers = members.filter(memberId => 
            org.members.some(member => member.userId.toString() === memberId)
        );

        if (validMembers.length !== members.length) {
            return res.status(400).json({ msg: "Some members are not part of the organization" });
        }

        project.members = [...new Set([...project.members, ...validMembers])];
        await project.save();

        res.status(200).json({ msg: "Members added to project successfully" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Internal server error" });
    }
}

const updateProject = async(req, res) => {
    const {name, description, projectId, projectLink} = req.body;
    const userId = req.user._id;

    if(!name || !description || !projectId){
        return res.status(400).json({ msg: "Insufficient details" });
    }

    try {
        const project = Project.findById(projectId);
        if(!project){
            return res.status(404).json({ msg: "Project not found" });
        }

        const org = Org.findById(project.organization);
        if(!org){
            return res.status(404).json({ msg: "Organisation not found" });
        }
        if (!(isAdmin(userId, org) || isProjectLead(userId, project))) {
            return res.status(403).json({ msg: "You do not have the required role to add members to the project" });
        }

        project.name = name;
        project.description = description;
        project.projectLink = projectLink;

        await project.save();
        res.status(200).json({ msg: "Success" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Internal server error" });
    }
}

const changeProjectLead = async(req, res) => {
    const { userId, projectId, newLeadId } = req.body;
    if(!userId || !projectId || !newLeadId){
        return res.status(400).json({ msg: "Insufficient details" });
    }

    try {
        const project = Project.findById(projectId);
        if(!project){
            return res.status(404).json({ msg: "Project not found" });
        }

        const org = Org.findById(project.organization);
        if(!org){
            return res.status(404).json({ msg: "Organisation not found" });
        }
        if(!isAdmin(userId, org)){
            return res.status(403).json({ msg: "Not authorized" });
        }

        const newLead = org.members.find(member => member.userId.toString() === newLeadId.toString());

        if(!newLead || !(newLead.role === ROLE.PROJECT_LEAD)){
            return res.status(403).json({ msg: "Not authorized" });
        }

        project.ProjectLead = newLead.userId;
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Internal server error" });
    }
}

const removeMember = async (req, res) => {
    const { projectId, memberId } = req.body;
    const userId = req.user._id;

    if (!projectId || !memberId) {
        return res.status(400).json({ msg: "Project ID and member ID are required" });
    }

    try {
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ msg: "Project not found" });
        }

        const org = await Org.findById(project.organization);
        if (!org) {
            return res.status(404).json({ msg: "Organization not found" });
        }

        if (!(isProjectLead(userId, project) || isAdmin(userId, org))) {
            return res.status(403).json({ msg: "You do not have the required role to remove members from the project" });
        }

        const memberIndex = project.members.indexOf(memberId);
        if (memberIndex === -1) {
            return res.status(400).json({ msg: "Member is not part of the project" });
        }

        project.members.splice(memberIndex, 1);
        await project.save();

        res.status(200).json({ msg: "Member removed from project successfully" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Internal server error" });
    }
};

const deleteProject = async(req, res) => {
    const {projectId, userId} = req.body;
    if(!projectId || !userId){
        return res.status(400).json({ msg: "Insufficient details" });
    }

    try {
        const project = Project.findById(projectId);
        if(!project){
            return res.status(404).json({ msg: "Project not found" });
        }

        const org = Org.findById(project.organization);
        if(!org){
            return res.status(404).json({ msg: "Organisation not found" });
        }

        if(!(isAdmin(userId,org) || isProjectLead(userId,project))){
            return res.status(403).json({ msg: "Not authorized" });
        }

        // delete bugs
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Internal server error" });
    }
}

module.exports = {
    createProject,
    addMembers,
    updateProject,
    changeProjectLead,
    removeMember,
    deleteProject
}