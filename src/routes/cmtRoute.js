const route = require('express').Router();

const { authMiddleware } = require('../middlewares');
const {cmtController} = require('../controllers');

module.exports = route;