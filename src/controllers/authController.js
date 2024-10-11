const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwtUtils');
const { generateHash, checkHashedString } = require('../utils/hash');

const register = async(req,res) => {
    const {username, email, password} = req.body;
    if(!username || !email || !password){
        return res.status(400).json({msg: "Fill all the details"});
    }

    try {
        const existingUser = await User.findOne({email:email});
        if(existingUser){
            return res.status(400).json({msg: "User already exists"});
        }

        const hashedPassword = await generateHash(password);
        
        const user = new User({
            email: email,
            username: username,
            password: hashedPassword
        })
        await user.save();

        return res.status(200).json({msg: "success"});

    } catch (error) {
        res.status(500).json({msg: "Internal server error"});
        console.log(error);
    }
}

const login = async(req, res) => {
    const {email, password} = req.body;
    if(!email || !password){
        return res.status(400).json({msg: "Fill all the details"});
    }

    try {
        const user = await User.findOne({email:email});
        if(!user){
           return res.status(400).json({msg:"Invalid Credentials"});
        }

        const correctPassword = await checkHashedString(password, user.password);
        if(!correctPassword){
            return res.status(400).json({msg:"Invalid Credentials"});
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;
        await user.save();

        return res.status(200).json({
            accessToken: accessToken,
            refreshToken: refreshToken,
            userId: user._id
        })
    } catch (error) {
        res.status(500).json({msg: "Internal server error"});
        console.log(error);
        
    }
}

const refreshToken = async(req, res) => {
    const {token} = req.body;
    if(!token){
        res.status(400).json({msg: "Invalid token"});
    }

    try {
        const decodedToken = verifyRefreshToken(token);
        if(!decodedToken){
            res.status(400).json({msg: "Invalid token"});
        }
        const user = await User.findById(decodedToken.userId);
        if(!user || user.refreshToken != token){
            res.status(400).json({msg: "Invalid token"});
        }
        
        const accessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
    
        user.refreshToken = newRefreshToken;
        await user.save();

        res.json({ 
            accessToken: accessToken, 
            refreshToken: newRefreshToken 
        });

    } catch (error) {
        res.status(500).json({msg: "Internal server error"});
        console.log(error);
    }
}

module.exports = {
    register,
    login,
    refreshToken
}