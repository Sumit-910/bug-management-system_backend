const route = require('express').Router();

const { authMiddleware } = require('../middlewares');
const { projectController } = require('../controllers');

route.post('/create',authMiddleware,projectController.createProject);
route.post('/add',authMiddleware,projectController.addMembers);
route.post('/update',authMiddleware,projectController.updateProject);
route.post('/changeLead',authMiddleware,projectController.changeProjectLead);
route.post('/remove',authMiddleware,projectController.removeMember);
route.post('/delete',authMiddleware,projectController.deleteProject);

module.exports = route;