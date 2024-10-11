const crypto = require('crypto');
const Org = require('../models/Organization');
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const { ROLE } = require('../constants');
const { isAdmin } = require('../utils/permissions');

const createOrg = async (req, res) => {
    const { name, description } = req.body;
    // console.log(name + " " + description);

    const userId = req.userId;
    if (!name) {
        res.status(400).json({ msg: "Insufficient details" });
    }

    try {
        // console.log("hello");

        const org = new Org({
            name: name,
            description: description,
            owner: userId,
            members: [{
                userId: userId,
                role: 'admin'
            }]
        })
        // console.log("hello 2");


        await org.save();

        const user = await User.findById(userId);
        if (user) {
            user.organizations.push(org._id);
            await user.save();
        }
        
        // console.log("hello 3");

        res.status(200).json({ msg: "Success" });
    } catch (error) {
        console.log(error);

        res.status(500).json({ msg: "Internal server error" });
    }
}

const getAllOrgs = async (req, res) => {
    const userId = req.userId;

    try {
        const allOrgs = await User.findById(userId)
            .populate({
                path: 'organizations',
                select: 'name description owner',
                populate: {
                    path: 'owner',
                    select: '_id username'
                }
            })
            .lean();

        const organizations = allOrgs.organizations.map(org => ({
            id: org._id,
            name: org.name,
            description: org.description,
            ownerId: org.owner._id,
            ownerName: org.owner.name
        }));

        res.status(200).json(organizations);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Internal server error" });
    }
};

const singleOrg = async (req, res) => {
    const { orgId } = req.body;
    const userId = req.userId;

    if (!orgId) {
        return res.status(400).json({ msg: "Insufficient details" });
    }

    try {
        const organization = await Org.findById(orgId)
            .populate({
                path: 'projects',
                select: 'name'
            })
            .populate({
                path: 'members.userId',
                select: 'username'
            })
            .populate({
                path: 'owner',
                select: 'username'
            });

        if (!organization) {
            return res.status(404).json({ msg: "Organization not found" });
        }

        const isOwner = organization.owner._id.toString() === userId;

        if (!isOwner) {
            return res.status(200).json({
                id: organization._id,
                name: organization.name,
                description: organization.description,
                owner: {
                    id: organization.owner._id,
                    name: organization.owner.username
                },
                projects: organization.projects.map(project => ({
                    id: project._id,
                    name: project.name
                })),
                createdAt: organization.createdAt
            });
        }

        return res.status(200).json({
            id: organization._id,
            name: organization.name,
            description: organization.description,
            owner: {
                id: organization.owner._id,
                name: organization.owner.username
            },
            members: organization.members.map(member => ({
                id: member.userId._id,
                username: member.userId.username,
                role: member.role
            })),
            projects: organization.projects.map(project => ({
                id: project._id,
                name: project.name
            })),
            pendingRequests: organization.pendingRequests,
            createdAt: organization.createdAt,
            updatedAt: organization.updatedAt
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Internal server error" });
    }
};


const createInvitation = async (req, res) => {
    const { orgId } = req.body;
    const userId = req.userId;

    if (!orgId) {
        return res.status(400).json({ msg: "Insufficient details" });
    }

    try {
        const organization = await Org.findById(orgId);
        if (!organization) {
            return res.status(404).json({ msg: "Organization not found" });
        }

        if (!isAdmin(userId, organization)) {
            return res.status(403).json({ msg: "Not autherized" });
        }

        const token = crypto.randomBytes(20).toString('hex');

        const invitation = new Invitation({
            organizationId: orgId,
            token: token
        });

        await invitation.save();

        const invitationToken = token;

        return res.status(200).json({
            msg: "Invitation created",
            invitationToken: invitationToken
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Internal server error" });
    }
};

const requestToJoin = async (req, res) => {
    const { token, email } = req.body;

    if (!token || !email) {
        return res.status(400).json({ msg: "Insufficient details" });
    }

    try {
        const invitation = await Invitation.findOne({ token: token });
        if (!invitation) {
            return res.status(404).json({ msg: "Invalid or expired invitation" });
        }

        await Invitation.findById(invitation._id);

        const org = await Org.findOne({ _id: invitation.organizationId });
        const user = await User.findOne({ email: email });
        if (!org || !user) {
            return res.status(404).json({ msg: "Invalid" });
        }
        org.pendingRequests.push({ email: email, username: user.username });
        await org.save();

        res.status(200).json({ msg: "Join request submitted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
};

const approveJoinRequest = async (req, res) => {
    const { orgId, email } = req.body;
    const userId = req.userId;

    if (!orgId || !email) {
        return res.status(400).json({ msg: "Insufficient details" });
    }

    try {
        const organization = await Org.findById(orgId);
        if (!organization) {
            return res.status(404).json({ msg: "Organization not found" });
        }

        if (!isAdmin(userId, organization)) {
            res.status(403).json("Not autherized");
        }

        const requestIndex = organization.pendingRequests.findIndex(request => request.email === email);
        if (requestIndex === -1) {
            return res.status(404).json({ msg: "Join request not found" });
        }

        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        organization.members.push({
            userId: user._id
        });
        organization.pendingRequests.splice(requestIndex, 1);
        await organization.save();

        user.organizations.push(orgId);
        await user.save();

        res.status(200).json({ msg: "Success" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Internal server error" });
    }
};

const changeRole = async (req, res) => {
    const { orgId, memberId, newRole } = req.body;
    const userId = req.userId;

    if (!orgId || !memberId || !newRole) {
        return res.status(400).json({ msg: "Insufficient details" });
    }
    if (!Object.values(ROLE).includes(newRole)) {
        return res.status(400).json({ msg: "Invalid role" });
    }

    try {
        const org = await Org.findById(orgId);
        if (!org) {
            return res.status(404).json({ msg: "Organization not found" });
        }

        if (!isAdmin(userId, org)) {
            res.status(403).json("Not authorized");
        }

        const memberIndex = org.members.findIndex(member => member.userId.toString() === memberId);
        if (memberIndex === -1) {
            return res.status(404).json({ msg: "Member not found in the organization" });
        }

        org.members[memberIndex].role = newRole;

        await org.save();

        res.status(200).json({ msg: "Success" });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Internal server error" });
    }
}

const removeMember = async (req, res) => {
    const { organizationId, memberId } = req.body;
    const userId = req.userId;

    if (!organizationId || !memberId) {
        return res.status(400).json({ msg: "Organization ID and member ID are required" });
    }

    try {
        const organization = await Org.findById(organizationId);
        if (!organization) {
            return res.status(404).json({ msg: "Organization not found" });
        }

        if (!isAdmin(userId, organization)) {
            return res.status(403).json({ msg: "You do not have the required role to remove members from the organization" });
        }

        const memberIndex = organization.members.findIndex(member => member.userId.toString() === memberId.toString());
        if (memberIndex === -1) {
            return res.status(400).json({ msg: "Member is not part of the organization" });
        }

        const projects = await Project.find({ organization: organizationId, members: memberId });

        for (const project of projects) {
            const projectMemberIndex = project.members.indexOf(memberId);
            if (projectMemberIndex !== -1) {
                project.members.splice(projectMemberIndex, 1);
                await project.save();
            }
        }

        organization.members.splice(memberIndex, 1);
        await organization.save();

        res.status(200).json({ msg: "Member removed from organization and all projects successfully", organization });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Internal server error" });
    }
};

const deleteOrg = async (req, res) => {
    const { orgId } = req.body;
    if (!orgId) {
        return res.status(400).json({ msg: "Insufficient details" });
    }

    try {
        const org = await Org.findById(orgId);
        const projectIds = org.projects;
        const userIds = org.members;
        // project, users and bugs to be deleted

        await Org.findByIdAndDelete(orgId);
        res.status(200).json({ msg: "Success" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Internal server error" });
    }
}


module.exports = {
    createOrg,
    getAllOrgs,
    singleOrg,
    createInvitation,
    requestToJoin,
    approveJoinRequest,
    changeRole,
    removeMember,
    deleteOrg
}