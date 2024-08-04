const route = require('express').Router();

const { authMiddleware } = require('../middlewares');
const { bugController } = require('../controllers');

route.post('/create',authMiddleware,bugController.createBug);
route.post('/update',authMiddleware,bugController.updateBug);
route.post('/delete',authMiddleware,bugController.deleteBug);
route.post('/assign',authMiddleware,bugController.assignMembersToBug);

module.exports = route;