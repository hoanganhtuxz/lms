import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from 'bcryptjs'
require('dotenv').config();
import jwt from "jsonwebtoken";

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    avatar: {
        public_id: string;
        url: string;
    },
    role: string;
    isVerified: boolean;
    courses: Array<{ courseId: string }>;
    comparePassword: (password: string) => Promise<boolean>
    SignAccesTolen: () => string;
    SignRefreshTolen: () => string;
};


const userSchema: Schema<IUser> = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true,
        validate: {
            validator: function (value: string) {
                return emailRegexPattern.test(value)
            },
            message: 'Invalid email address'
        }
    },
    password: {
        type: String,
        // required: [true, 'Please enter your password'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false
    },
    avatar: {
        public_id: {
            type: String,
            required: false
        },
        url: {
            type: String,
            required: false
        }
    },
    role: {
        type: String,
        // enum: ['user', 'admin'],
        default: 'user'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    courses: [{
        courseId: String
    }]
}, { timestamps: true });

// Hash password before saving
userSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Sign access token
userSchema.methods.SignAccesTolen = function () {
    return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || '',{
        expiresIn:'5m'
    })
}

// Sign refesh token
userSchema.methods.SignRefreshTolen = function () {
    return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || '',{
        expiresIn:'3d'
    })
}

// Password comparison method 
userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;