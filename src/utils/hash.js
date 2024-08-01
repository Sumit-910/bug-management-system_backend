const bcrypt = require('bcryptjs');

const salt = 10;

const generateHash = (inputString) => {
    return bcrypt.hash(inputString, salt);
}

const checkHashedString = (inputString, originalString) => {
    return bcrypt.compare(inputString, originalString);
}

module.exports = {
    generateHash,
    checkHashedString
}