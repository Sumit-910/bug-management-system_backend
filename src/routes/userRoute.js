const route = require('express').Router();

const { userController } = require('../controllers');
const { authMiddleware } = require('../middlewares');

route.get('/getUser',authMiddleware,userController.getUser);

module.exports = route;