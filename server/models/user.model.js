import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";


const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
        minLength: [5, 'Name should be atleast 5 characters'],
        maxLength: [50, 'Name should be less than 50 characters'],
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        unique: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please fill a valid email address'
            
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minLength: [8, 'Password must be atleast 8 character'],
        select: false
    },
    avatar: {
        public_id: {
            type: String,
        },
        secure_url: {
            type: String
        }
    },
    role: {
        type: String,
        enum: ['USER', 'ADMIN'],
        default: 'USER'
    },
    forgotPasswordToken: {
        type: String
    },
    forgotPasswordExpiry: {
        type: String
    }
}, {timestamps: true});

userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    // next();
});

userSchema.methods = {
    generateJwtToken: async function() {
        return await jwt.sign({id: this._id, email: this.email, role: this.role, subscription: this.subscription}, 
            process.env.JWT_SECRET, 
            {
            expiresIn: process.env.JWT_EXPIRY
        });
    }
}

const User = model("User", userSchema);

export default User;