const User = require('../models/User');

const getUser = async(req,res) => {
    const userId = req.userId;
    return res.status(200).json(userId);
}

module.exports = {
    getUser
}