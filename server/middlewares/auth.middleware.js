import ApiError from "../utils/error.util.js";
import  jwt  from 'jsonwebtoken';

const isLoggedIn = async (req, res, next) => {
    const { token } = req.cookies;
    if(!token) {
        return next(new ApiError(401, "Please login to access this resource"));
    }

    const userDetails = await jwt.verify(token, process.env.JWT_SECRET);
    req.user = userDetails;

    next();
}

export {
    isLoggedIn
}