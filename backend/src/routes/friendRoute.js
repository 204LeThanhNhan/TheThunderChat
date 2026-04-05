import express from 'express';
import Friend from '../models/Friend.js';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import { createFriendRequestNotification, createFriendAcceptedNotification } from '../utils/notificationHelper.js';
import { io } from '../socket/index.js';
import { checkBlocked } from '../middlewares/blockMiddleware.js';

const router = express.Router();

router.post('/requests', checkBlocked, async (req,res) => {
    try {

        const{to, message} = req.body;
        const from = req.user._id;

        if(from === to){
            return res.status(400).json({message: "Bạn không thể gửi lời mời kết bạn cho chính mình!"});
        }

        const userExist = await User.exists({_id: to});
        if(!userExist){
            return res.status(404).json({message: "Người dùng không tồn tại!"});
        }

        let UserA = from.toString();
        let UserB = to.toString();

        if(UserA > UserB){
            [UserA, UserB] = [UserB, UserA]
        }

        const [alreadyFriends, existingRequest] = await Promise.all([
            Friend.findOne({UserA, UserB}),
            FriendRequest.findOne({
                $or: [
                    {from, to},
                    {from: to, to: from}
                ]
            })
        ])

        if(alreadyFriends){
            return res.status(400).json({message: "Hai người đã là bạn bè, không thể gửi lời mời kết bạn tiếp"});
        }

        if(existingRequest){
            return res.status(400).json({message: "Đã có lời mời kết bạn đang chờ, không thể gửi lời mời kết bạn tiếp"});
        }

        const request = await FriendRequest.create({
            from,
            to,
            message
        });

        // Populate sender info
        await request.populate('from', '_id username displayName avatarUrl');

        // Create notification for recipient
        const sender = await User.findById(from).select('displayName');
        await createFriendRequestNotification(to, from, sender.displayName);

        // Emit socket event to recipient
        io.to(to.toString()).emit('new-friend-request', {
            request: {
                _id: request._id,
                from: request.from,
                to: request.to,
                message: request.message,
                createdAt: request.createdAt
            }
        });

        return res.status(200).json({message: "Gửi lời mời kết bạn thành công", request});
        
    } catch (error) {
        console.error(`Lỗi khi gửi yêu cầu kết bạn ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
});

router.post('/requests/:requestId/accept', async (req,res) => {
    try {
        const {requestId} = req.params;
        const userId = req.user._id; //id user dang dang nhap

        const request = await FriendRequest.findById(requestId);
        if(!request){
            return res.status(404).json({message: "Không tìm thấy lời mời kết bạn"});
        }

        //tránh trường hợp: A gửi kết bạn B. Sau đó A tự gửi request acceptFriendRequest chấp nhận yêu cầu (không thông qua B)
        //Đảm bảo người nhận mới có quyền chấp nhận lời mời kết bạn
        if(request.to.toString() !== userId.toString()){
            return res.status(403).json({message: "Bạn không có quyền chấp nhận lời mời kết bạn này!"});
        }

        const friend = await Friend.create({
            userA : request.from,
            userB: request.to
        });

        await FriendRequest.findByIdAndDelete(requestId);
        
        // Create notification for sender
        const accepter = await User.findById(userId).select('displayName avatarUrl');
        await createFriendAcceptedNotification(request.from, userId, accepter.displayName);
        
        // Emit socket event to sender (người gửi lời mời)
        io.to(request.from.toString()).emit('friend-request-accepted', {
            requestId,
            newFriend: {
                _id: accepter._id,
                displayName: accepter.displayName,
                avatarUrl: accepter.avatarUrl
            }
        });

        // Emit socket event to accepter (người chấp nhận)
        const from = await User.findById(request.from).select("_id displayName avatarUrl").lean();
        io.to(userId.toString()).emit('friend-request-accepted-self', {
            requestId,
            newFriend: {
                _id: from._id,
                displayName: from.displayName,
                avatarUrl: from.avatarUrl
            }
        });
        
        return res.status(200).json({message: "Chấp nhận lời mời kết bạn thành công!",
                                    newFriend:{
                                        _id: from._id,
                                        displayName: from.displayName,
                                        avatarUrl: from.avatarUrl
                                    }});
                                    
    } catch (error) {
        console.error(`Lỗi khi chấp nhận yêu cầu kết bạn ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
});

router.post('/requests/:requestId/decline', async (req,res) => {
    try {
        const {requestId} = req.params;
        const userId = req.user._id; //id user dang dang nhap

        const request = await FriendRequest.findById(requestId);

        if(!request){
            return res.status(404).json({message: "Không tìm thấy mời lời kết bạn"});
        }

        if(request.to.toString() !== userId.toString()){
            return res.status(403).json({message: "Bạn không quyền từ chối lời mời này!"});
        }

        await FriendRequest.findByIdAndDelete(requestId);
        
        // Emit socket event to both users
        io.to(userId.toString()).emit('friend-request-declined-self', { requestId });
        io.to(request.from.toString()).emit('friend-request-declined', { requestId });
        
        return res.status(204).send();

    } catch (error) {
        console.error(`Lỗi khi từ chối yêu cầu kết bạn ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
});

router.get('/', async (req,res) => {
    try {
        const userId = req.user._id; //id user dang dang nhap
        const friendships = await Friend.find({
            $or: [{userA: userId},{userB: userId}]
        }).
        populate("userA", "_id displayName avatarUrl username")
        .populate("userB", "_id displayName avatarUrl username")
        .lean();

        if(!friendships.length){
            return res.status(200).json({friends: []});
        }

        const friends = friendships.map( (f) => f.userA._id.toString() === userId.toString() ? f.userB : f.userA);

        return res.status(200).json({friends});
    } catch (error) {
        console.error(`Lỗi khi lấy danh sách bạn bè ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
});

router.get('/requests', async (req,res) => {
    try {
        const userId = req.user._id;
        const populateFields = '_id username displayName avatarUrl';

        const [sent, receive] = await Promise.all([
            FriendRequest.find({from: userId}).populate("to", populateFields), //lấy ds lời mời kb đã gửi
            FriendRequest.find({to: userId}).populate("from", populateFields) //lấy ds lời mời kb đã nhận
        ])
        return res.status(200).json({sent, receive});


    } catch (error) {
        console.error(`Lỗi khi lấy danh sách yêu cầu kết bạn ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
});

export default router;