import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'User Name is required'],
        trim: true,
        minlength: 2,
        maxlength: 50,
    },
    email: {
        type: String,
        required: [true, 'User Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'Please enter a valid email address'], // Fixed regex and its syntax
    },
    password: {
        type: String,
        required: [true, 'Password is required'], // Fixed error message
        minlength: 6, // Fixed case to match Mongoose's validator
    }
}, { timestamps: true });


const User = mongoose.model('User', userSchema);

export default User;