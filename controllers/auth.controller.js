import mongoose from 'mongoose'
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";

const signUp = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {

          const { name, email, password } = req.body;

// check if user already exist
        const existingUser = await User.findOne({ email }); // Returns `null` if no document exists
        if (existingUser) {
            const error = new Error('User already exist');
            error.status = 409;
            throw error;
        }
            // hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUser  = await User.create([{ name, email, password: hashedPassword}], { session })

        const token = jwt.sign( {userId: newUser[0]._id}, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN})

        await session.commitTransaction();
            session.endSession();

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: {
                    token,
                    user: newUser[0],
                }
            })
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
               next(error);
    }
}

const signIn = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne( { email });
        if (!user) {
            const error = new Error('User Not Found');
            error.status = 404;
            throw error;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            const error = new Error('Invalid Credentials');
            error.status = 401;
            throw error; // Throw the error
        }

        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }

        const token = jwt.sign( { userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

        res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            data: {
                token,
                user,
            }
        })
    } catch (error) {
        next(error)
    }
}

const signOut = async (req, res, next) => {}

export { signUp, signIn, signOut }