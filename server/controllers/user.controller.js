import User from '../models/user.model.js';
import ApiError from '../utils/error.util.js';

const cookieOptions = {
    expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    httpOnly: true, 
    secure: true
}


const register = async (req, res, next) => {
    const {fullName, email, password} = req.body;

    if(!fullName || !email || !password) {
        return next(new ApiError(400, "Please provide all fields"));
    }

    const userExists = await User.findOne({email});

    if(userExists) {
        return next(new ApiError(400, "Email already exists"));
    }

    const user = await User.create({
        fullName, 
        email, 
        password, 
        avatar: {
        public_id: "sample_public_id",
        secure_url: "sample_url"
    }});

    if(!user) { 
        return next(new ApiError(500, "Something went wrong"));
    }

    //! todo for taking image from cloudinary

    await user.save();

    password = undefined;

    const token = await user.generateJwtToken();

    res.cookie('token', token, cookieOptions)

    res.status(201).json({
        success: true,
        message: "User created successfully",
        user
    });
}

const login = (req, res) => {

}

const logout = (req, res) => {

}

const getProfile = (req, res) => {

}

export {
    register,
    login,
    logout,
    getProfile
}