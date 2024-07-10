import User from '../models/user.model.js';
import ApiError from '../utils/error.util.js';
import cloudinary from 'cloudinary';
import fs from 'fs'
import sendEmail from '../utils/sendEmail.util.js';
import crypto from 'crypto';


const cookieOptions = {
    maxAge: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), //3days
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

    //! taking image from cloudinary
    if (req.file) {
        // console.log(req.file)
        try {
          const result = await cloudinary.v2.uploader.upload(req.file.path, {
            folder: 'lms', // Save files in a folder named lms
            width: 250,
            height: 250,
            gravity: 'faces', // This option tells cloudinary to center the image around detected faces (if any) after cropping or resizing the original image
            crop: 'fill',
          });
    
          // If success
          if (result) {
            // Set the public_id and secure_url in DB
            user.avatar.public_id = result.public_id;
            user.avatar.secure_url = result.secure_url;
    
            // After successful upload remove the file from local storage
            fs.rm(`uploads/${req.file.filename}`, (err) => {
              if (err) throw err;
            });
          }
        } catch (error) {
          return next(
            new ApiError(error || 'File not uploaded, please try again', 400)
          );
        }
      }

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

const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        res.status(200).json({
            success: true,
            message: "User fetched successfully",
            user
        })
    } catch (error) {
        return next(new ApiError(error.message, 500));
    }
}

const forgotPassword = async (req, res, next) => {
    const {email} = req.body;
    if(!email) {
        return next(new ApiError(400, "Please provide email"));
    }

    const user = await User.findOne({email});

    if(!user) {
        return next(new ApiError(400, "User not found"));
    }

    const resetToken = await user.getResetPasswordToken();

    await user.save();

    const resetPasswordURL = `${process.env.FRONTEND_URL}/reset/${resetToken}`;

    const subject = "Reset Password";
    const message = `You can reset your password by clicking <a href=${resetPasswordURL} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordURL}.\n If you have not requested this, kindly ignore.`;

    try {
         await sendEmail(email, subject, message);

         res.status(200).json({
             success: true,
             message: `Reset password token sent to your ${email} sussessfully`
         })
    }catch (error) {
        user.resetToken = undefined;
        user.resetToken = undefined;
        await user.save();
        return next(new ApiError(error.message, 500));
    }

}       

const resetPassword = async (req, res, next) => {   
    const {resetToken} = req.params;

    const {password} = req.body;

    const forgotPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");


    const user = await User.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry: {$gt: Date.now()}
    }); 

    
    if(!user) {
        return next(new ApiError(400, "Token is invalid or has expired"));
    }

    user.password = password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save();  

    res.status(200).json({
        success: true,
        message: "Password reset successfully"
    })
}

const changePassword = async (req, res, next) => {
    const {oldPassword, newPassword} = req.body;
    const {id} = req.user;

    if(!oldPassword || !newPassword) {
        return next(new ApiError(400, "Please provide old and new password"));
    }

    const user = await User.findById(id).select("+password");

    if(!user) {
        return next(new ApiError('User does not exist', 400))
    }

    const isValidPassword = await user.comparePassword(oldPassword);

    if(!isValidPassword) {
        return next(new ApiError('Password is invalid', 400));
    }

    user.password = newPassword;

    await user.save();

    user.password = undefined;

    res.status(200).json({
        success: true,
        message: "Password changed successfully"
        })
}

const updateUser = async (req, res, next) => {
    const { fullName } = req.body;
    const { id } = req.params;
  
    const user = await User.findById(id);
  
    if (!user) {
      return next(new ApiError('Invalid user id or user does not exist'));
    }
  
    if (fullName) {
      user.fullName = fullName;
    }
  
    // Run only if user sends a file
    if (req.file) {
      // Deletes the old image uploaded by the user
      await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  
      try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: 'lms', // Save files in a folder named lms
          width: 250,
          height: 250,
          gravity: 'faces', // This option tells cloudinary to center the image around detected faces (if any) after cropping or resizing the original image
          crop: 'fill',
        });
  
        // If success
        if (result) {
          // Set the public_id and secure_url in DB
          user.avatar.public_id = result.public_id;
          user.avatar.secure_url = result.secure_url;
  
          // After successful upload remove the file from local storage
          fs.rm(`uploads/${req.file.filename}`);
        }
      } catch (error) {
        return next(
          new ApiError(error || 'File not uploaded, please try again', 400)
        );
      }
    }
  
    // Save the user object
    await user.save();
  
    res.status(200).json({
      success: true,
      message: 'User details updated successfully',
    });
}

export {
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    changePassword,
    updateUser
}