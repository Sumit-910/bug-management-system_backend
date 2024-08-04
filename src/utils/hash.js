const bcrypt = require('bcryptjs');

const salt = 10;

const generateHash = async(inputString) => {
    return await bcrypt.hash(inputString, salt);
}

const checkHashedString = async(inputString, originalString) => {
    return await bcrypt.compare(inputString, originalString);
}

module.exports = {
    generateHash,
    checkHashedString
}