import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './libs/db.js';
import authRoute from './routes/authRoute.js';
import cookieParser from 'cookie-parser';
import userRoute from './routes/userRoute.js'
import friendRoute from './routes/friendRoute.js'
import messageRoute from './routes/messageRoute.js'
import conversationRoute from './routes/conversationRoute.js'
import notificationRoute from './routes/notificationRoute.js'
import reactionRoute from './routes/reactionRoute.js'
import draftRoute from './routes/draftRoute.js'
import forwardRoute from './routes/forwardRoute.js'
import blockRoute from './routes/blockRoute.js'
import quickMessageRoute from './routes/quickMessageRoute.js'
import statusRoute from './routes/statusRoute.js'
import { protectedRoute } from './middlewares/authMiddleware.js';
import swaggerUI from "swagger-ui-express";
import fs from "fs";
import cors from 'cors';
import {app, server} from "./socket/index.js";
import { v2 as cloudinary } from 'cloudinary';
import passport from 'passport';
import session from 'express-session';
import { configureGoogleAuth } from './utils/googleAuthService.js';

dotenv.config();

//const app = express();
const PORT = process.env.PORT || 5001;

//middlewares, giúp express đọc hiểu được response body dạng JSON
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: process.env.CLIENT_URL, credentials: true}));

// Session middleware cho passport
app.use(session({
    secret: process.env.ACCESS_TOKEN_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Configure Google OAuth
configureGoogleAuth();

// Cloudinary Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//swagger
const swaggerDocument = JSON.parse(fs.readFileSync("./src/swagger.json", "utf8"));
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));
//public routes
app.use('/api/auth', authRoute);

//private routes
app.use(protectedRoute);
app.use('/api/users', userRoute);
app.use('/api/friends', friendRoute);
app.use('/api/messages', messageRoute);
app.use('/api/conversations', conversationRoute);
app.use('/api/notifications', notificationRoute);
app.use('/api/reactions', reactionRoute);
app.use('/api/drafts', draftRoute);
app.use('/api/forwards', forwardRoute);
app.use('/api/blocks', blockRoute);
app.use('/api/quick-messages', quickMessageRoute);
app.use('/api/status', statusRoute);

connectDB().then( () => {
    server.listen(PORT, () => {
        console.log(`Server lắng nghe tại cổng ${PORT}`);
    });
});

