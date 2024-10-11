const Org = require('../models/Organization');
const Project = require('../models/Project');
const Bug = require('../models/Bug');
const { STATUS, PRIORITY } = require('../constants');
const { isAdmin, isProjectLead } = require('../utils/permissions');

const createBug = async (req, res) => {
    const { name, description, projectId, priority, deadline } = req.body;
    const userId = req.user._id;

    if (!title || !description || !projectId || !deadline) {
        return res.status(400).json({ msg: 'Title, description, and project ID are required' });
    }

    try {
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }
        const org = await Org.findById(project.organization);

        if(!(isAdmin(userId,org) || isProjectLead(userId,project))){
            return res.status(403).json({ msg: "Not authorized" });
        }

        const newBug = new Bug({
            title: name,
            description,
            project: projectId,
            priority: priority || PRIORITY.LOW,
            deadline
        });

        await newBug.save();

        project.bugs.push(newBug._id);
        await project.save();

        res.status(201).json(newBug);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: 'Internal server error' });
    }
};

const updateBug = async (req, res) => {
    const { bugId, title, description, status, priority, deadline } = req.body;
    const userId = req.user._id;

    try {
        const bug = await Bug.findById(bugId);
        if (!bug) {
            return res.status(404).json({ msg: 'Bug not found' });
        }

        const project = await Project.findById(bug.project);
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        const org = await Org.findById(project.organization);
        if(!(isAdmin(userId,org) || isProjectLead(userId,project))){
            return res.status(403).json({ msg: "Not authorized" });
        }

        if (title) bug.title = title;
        if (description) bug.description = description;
        if (status && Object.values(STATUS).includes(status)) bug.status = status;
        if (priority && Object.values(PRIORITY).includes(priority)) bug.priority = priority;
        if (deadline) bug.deadline = deadline;

        await bug.save();

        res.status(200).json(bug);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: 'Internal server error' });
    }
};

// Delete a bug
const deleteBug = async (req, res) => {
    const { bugId } = req.body;
    const userId = req.user._id;

    try {
        const bug = await Bug.findByIdAndDelete(bugId);
        if (!bug) {
            return res.status(404).json({ msg: 'Bug not found' });
        }

        const project = await Project.findById(bug.project);
        if (project) {
            project.bugs.pull(bug._id);
            await project.save();
        }

        res.status(200).json({ msg: 'Bug deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: 'Internal server error' });
    }
};

// Assign members to a bug
const assignMembersToBug = async (req, res) => {
    const { userIds, bugId } = req.body;
    const userId = req.user._id;

    try {
        const bug = await Bug.findById(bugId);
        if (!bug) {
            return res.status(404).json({ msg: 'Bug not found' });
        }

        const project = await Project.findById(bug.project);
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        // Check if all userIds are part of the project
        for (const userId of userIds) {
            if (!project.members.includes(userId)) {
                return res.status(403).json({ msg: `User ${userId} is not a member of the project` });
            }
        }

        bug.assignedTo.push(...userIds);
        await bug.save();

        res.status(200).json(bug);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: 'Internal server error' });
    }
};

module.exports = {
    createBug,
    updateBug,
    deleteBug,
    assignMembersToBug
};
