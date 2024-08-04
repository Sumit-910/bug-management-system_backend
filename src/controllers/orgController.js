const crypto = require('crypto');
const Org = require('../models/Organization');
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const { ROLE } = require('../constants');
const { isAdmin } = require('../utils/permissions');

const createOrg = async(req,res) => {
    const { name } = req.body;
    const userId = req.user._id;
    if(!name){
        res.status(400).json({msg: "Insufficient details"});
    }

    try {
        const org = new Org({
            name: name,
            owner: userId,
            members: [{
                userId: userId,
                role: 'Admin'
            }]
        })
    
        await org.save();
        res.status(200).json({msg: "Success"});
    } catch (error) {
        res.status(500).json({msg: "Internal server error"});
    }
}

const createInvitation = async (req, res) => {
    const { orgId } = req.body;
    const userId = req.user._id;

    if (!orgId) {
        return res.status(400).json({ msg: "Insufficient details" });
    }

    try {
        const organization = await Org.findById(orgId);
        if (!organization) {
            return res.status(404).json({ msg: "Organization not found" });
        }

        if(!isAdmin(userId, organization)){
            res.status(403).json("Not autherized");
        }

        const token = crypto.randomBytes(20).toString('hex');

        const invitation = new Invitation({
            organizationId: orgId,
            token: token
        });

        await invitation.save();

        const invitationToken = token;

        res.status(200).json({ 
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
        const invitation = await Invitation.findOne({ token:token });
        if (!invitation) {
            return res.status(404).json({ msg: "Invalid or expired invitation" });
        }

        await Invitation.findByIdAndDelete(invitation._id);
        
        const org = Org.findOne({ _id:invitation.organizationId });
        const user = User.findOne({ email:email });
        org.pendingRequests.push({ email:email, username:user.username });
        await organization.save();

        res.status(200).json({ msg: "Join request submitted successfully" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Internal server error" });
    }
};

const approveJoinRequest = async (req, res) => {
    const { orgId, email } = req.body;
    const userId = req.user._id;

    if (!orgId || !email) {
        return res.status(400).json({ msg: "Insufficient details" });
    }

    try {
        const organization = await Org.findById(orgId);
        if (!organization) {
            return res.status(404).json({ msg: "Organization not found" });
        }

        if(!isAdmin(userId, organization)){
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

        res.status(200).json({ msg: "Success" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Internal server error" });
    }
};

const changeRole = async(req, res) => {
    const { orgId, memberId, newRole } = req.body;
    const userId = req.user._id;

    if(!orgId || !memberId || !newRole){
        return res.status(400).json({ msg: "Insufficient details" });
    }
    if (!ROLE.includes(newRole)) {
        return res.status(400).json({ msg: "Invalid role" });
    }

    try {
        const org = await Org.findById(orgId);
        if (!org) {
            return res.status(404).json({ msg: "Organization not found" });
        }

        if(!isAdmin(userId, org)){
            res.status(403).json("Not autherized");
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
    const userId = req.user._id;

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

const deleteOrg = async(req, res) => {
    const { orgId } = req.body;
    if(!orgId){
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
    createInvitation,
    requestToJoin,
    approveJoinRequest,
    changeRole,
    removeMember,
    deleteOrg
}