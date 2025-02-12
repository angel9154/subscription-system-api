import mongoose from 'mongoose';
import { DB_URI, NODE_ENV } from "../config/env.js";

if(!DB_URI) {
    throw new Error("DB_URI is not defined inside .env.<development/production>.local");
}

const connectToDatabase = async () => {
    try {
    await mongoose.connect(DB_URI);

    console.log(`connected to the database ${NODE_ENV} mode`);
    } catch (error) {
        console.log("error connectiong to the database ");
        process.exit(1);
    }
}

export default connectToDatabase;