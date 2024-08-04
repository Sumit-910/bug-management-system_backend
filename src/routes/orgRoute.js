const route = require('express').Router();

const { orgController } = require('../controllers');
const { authMiddleware } = require('../middlewares');

route.post('/create',authMiddleware,orgController.createOrg);
route.post('/invite',authMiddleware,orgController.createInvitation);
route.post('/join',authMiddleware,orgController.requestToJoin);
route.post('/approve',authMiddleware,orgController.approveJoinRequest);
route.patch('/changeRole',authMiddleware,orgController.changeRole);
route.patch('/removeMember',authMiddleware,orgController.removeMember);
route.delete('/deleteOrg',authMiddleware,orgController.deleteOrg);

module.exports = route;