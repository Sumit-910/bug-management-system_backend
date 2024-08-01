const route = require('express').Router();

const { authController } = require('../controllers')

route.post('/register', authController.register);
route.post('/login', authController.login);
Router.patch('/token', authController.refreshToken);

module.exports = route;