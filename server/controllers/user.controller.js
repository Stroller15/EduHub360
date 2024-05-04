import ApiError from '../utils/error.util.js';


const register = (req, res, next) => {
    const {fullName, email, password} = req.body;

    if(!fullName || !email || !password) {
        return next(new ApiError(400, "Please provide all fields"));
    }
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