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

    user.password = undefined;

    const token = await user.generateJwtToken();

    res.cookie('token', token, cookieOptions)

    res.status(201).json({
        success: true,
        message: "User created successfully",
        user
    });
}

const login = async (req, res, next) => {
    try {
        const {email, password} = req.body;

        if(!email || !password) {
            return next(new ApiError(400, "Please provide email and password"));
        }   

        const user = await User.findOne({email}).select("+password");


        if (!(user && (await user.comparePassword(password)))) {
            return next(
            new ApiError(401,'Email or Password do not match or user does not exist')
            );
        }

        const token = await user.generateJwtToken();
        user.password = undefined;

        res.cookie('token', token, cookieOptions);

        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            user
        });

    } catch (error) {
        return next(new ApiError(error.message, 500));
    }
    
}

const logout = (req, res) => {
    res.cookie('token', null, {
        secure: true,
        maxAge: 0,
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: "User logged out successfully"
    })
}

const getProfile = (req, res) => {

}

export {
    register,
    login,
    logout,
    getProfile
}