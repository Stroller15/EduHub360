import Course from "../models/course.model.js"
import ApiError from '../utils/error.util.js';

const getAllCourses = async (_req, res, next) => {

    try {
        const courses = await Course.find({}).select("-lectures");
        console.log("courses", courses)
        res.status(200).json({
            success: true,
            message: "All courses",
            courses,
        })
    } catch (error) {
        return next(new ApiError(error.message, 500));
    }
}

const getLecturesByCourseId = async (req, res, next) => {
    try {
        const {id} = req.params;

        const course = await Course.findById(id);

        if (!course) {
            return next(new AppError('Invalid course id or course not found.', 404));
          }

        res.status(200).json({
            success: true,
            message: "Course lecture fetched successfully",
            lectures: course.lectures
        })
    } catch (error) {
        return next(new ApiError(error.message, 500)); 
    }
}

const createCourse = async (req, res, next) => {
    try {
        const course = await Course.create(req.body);
        res.status(201).json({
            success: true,
            message: "Course created successfully",
            course
        })
    }catch(error){
        return next(new ApiError(error.message, 500));
    }
}

export {
    getAllCourses,
    getLecturesByCourseId,
    createCourse,
}