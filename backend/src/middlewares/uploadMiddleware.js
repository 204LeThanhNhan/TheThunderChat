import multer from "multer";
import {v2 as cloudinary} from "cloudinary";

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 50, // 50MB cho video và file
    },
});

export const uploadImageFromBuffer = (buffer, options) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            folder: "thunder_chat/avatars",
            resource_type: "image",
            transformation: [{width: 200, height: 200, crop: "fill"}],
            ...options,
        }, 
        (error, result) => {
            if(error){
                reject(error);
            }else{
                resolve(result);
            }
        });

        uploadStream.end(buffer);
    });
};

// Upload file (image, video, hoặc file thường)
export const uploadFileFromBuffer = (buffer, resourceType = "auto", options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            folder: "thunder_chat/messages",
            resource_type: resourceType, // "image", "video", "raw", "auto"
            ...options,
        }, 
        (error, result) => {
            if(error){
                reject(error);
            }else{
                resolve(result);
            }
        });

        uploadStream.end(buffer);
    });
};