const User = require('../models/User');
const Friend = require('../models/Friend');
const FriendRequest = require('../models/FriendRequest');
const Notification = require('../models/Notification');

async function sendFriendRequest(req, res, next) {
    try {
        const { toUserId } = req.params;
        const fromUserId = req.user._id.toString();
        
        // Check if trying to friend self
        if (fromUserId === toUserId) {
            return res.status(400).json({
                error: {
                    message: 'Cannot send friend request to yourself',
                    code: 'INVALID_REQUEST'
                }
            });
        }
        
        // Check if target user exists
        const targetUser = await User.findUserById(toUserId);
        if (!targetUser) {
            return res.status(404).json({
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }
        
        // Check if already friends
        const existingFriendship = await Friend.findFriendship(fromUserId, toUserId);
        if (existingFriendship) {
            return res.status(409).json({
                error: {
                    message: 'Already friends',
                    code: 'ALREADY_FRIENDS'
                }
            });
        }
        
        // Check if pending request exists
        const pendingRequest = await FriendRequest.findPendingRequest(fromUserId, toUserId);
        if (pendingRequest) {
            return res.status(409).json({
                error: {
                    message: 'Friend request already exists',
                    code: 'REQUEST_EXISTS'
                }
            });
        }
        
        // Create friend request
        const request = await FriendRequest.createFriendRequest(fromUserId, toUserId);
        
        // Create notification
        await Notification.createNotification({
            userId: toUserId,
            type: Notification.NOTIFICATION_TYPES.FRIEND_REQUEST,
            title: 'New friend request',
            description: `${req.user.displayName} sent you a friend request`,
            data: {
                fromUserId,
                requestId: request._id
            }
        });
        
        res.status(201).json({
            data: {
                request
            }
        });
    } catch (error) {
        next(error);
    }
}

async function acceptFriendRequest(req, res, next) {
    try {
        const { requestId } = req.params;
        const userId = req.user._id.toString();
        
        const request = await FriendRequest.findRequestById(requestId);
        
        if (!request) {
            return res.status(404).json({
                error: {
                    message: 'Friend request not found',
                    code: 'REQUEST_NOT_FOUND'
                }
            });
        }
        
        // Check if user is the recipient
        if (request.toUserId.toString() !== userId) {
            return res.status(403).json({
                error: {
                    message: 'Cannot accept this request',
                    code: 'FORBIDDEN'
                }
            });
        }
        
        if (request.status !== 'pending') {
            return res.status(400).json({
                error: {
                    message: 'Request already processed',
                    code: 'INVALID_STATUS'
                }
            });
        }
        
        // Update request status
        await FriendRequest.updateRequestStatus(requestId, 'accepted');
        
        // Create friendship (bidirectional)
        await Friend.createFriendship(request.fromUserId.toString(), request.toUserId.toString());
        
        // Create notification
        await Notification.createNotification({
            userId: request.fromUserId,
            type: Notification.NOTIFICATION_TYPES.FRIEND_ACCEPTED,
            title: 'Friend request accepted',
            description: `${req.user.displayName} accepted your friend request`,
            data: {
                fromUserId: userId
            }
        });
        
        res.json({
            data: {
                message: 'Friend request accepted'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function declineFriendRequest(req, res, next) {
    try {
        const { requestId } = req.params;
        const userId = req.user._id.toString();
        
        const request = await FriendRequest.findRequestById(requestId);
        
        if (!request) {
            return res.status(404).json({
                error: {
                    message: 'Friend request not found',
                    code: 'REQUEST_NOT_FOUND'
                }
            });
        }
        
        // Check if user is the recipient
        if (request.toUserId.toString() !== userId) {
            return res.status(403).json({
                error: {
                    message: 'Cannot decline this request',
                    code: 'FORBIDDEN'
                }
            });
        }
        
        if (request.status !== 'pending') {
            return res.status(400).json({
                error: {
                    message: 'Request already processed',
                    code: 'INVALID_STATUS'
                }
            });
        }
        
        // Update request status
        await FriendRequest.updateRequestStatus(requestId, 'declined');
        
        res.json({
            data: {
                message: 'Friend request declined'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function removeFriend(req, res, next) {
    try {
        const { friendId } = req.params;
        const userId = req.user._id.toString();
        
        const friendship = await Friend.findFriendship(userId, friendId);
        
        if (!friendship) {
            return res.status(404).json({
                error: {
                    message: 'Friendship not found',
                    code: 'NOT_FRIENDS'
                }
            });
        }
        
        await Friend.deleteFriendship(userId, friendId);
        
        res.json({
            data: {
                message: 'Friend removed'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function getFriends(req, res, next) {
    try {
        const userId = req.user._id.toString();
        
        const friendships = await Friend.findUserFriends(userId);
        
        // Get friend details
        const friendIds = friendships.map(f => f.friendId.toString());
        const friends = await Promise.all(
            friendIds.map(id => User.findUserById(id))
        );
        
        // Sanitize friend data
        const sanitizedFriends = friends
            .filter(f => f !== null)
            .map(friend => ({
                _id: friend._id,
                username: friend.username,
                displayName: friend.displayName,
                avatarUrl: friend.avatarUrl,
                bio: friend.bio
            }));
        
        res.json({
            data: sanitizedFriends
        });
    } catch (error) {
        next(error);
    }
}

async function getIncomingRequests(req, res, next) {
    try {
        const userId = req.user._id.toString();
        
        const requests = await FriendRequest.findIncomingRequests(userId);
        
        // Get requester details
        const requestersIds = requests.map(r => r.fromUserId.toString());
        const requesters = await Promise.all(
            requestersIds.map(id => User.findUserById(id))
        );
        
        // Combine data
        const requestsWithUsers = requests.map((request, index) => {
            const requester = requesters[index];
            return {
                _id: request._id,
                status: request.status,
                createdAt: request.createdAt,
                from: requester ? {
                    _id: requester._id,
                    username: requester.username,
                    displayName: requester.displayName,
                    avatarUrl: requester.avatarUrl
                } : null
            };
        });
        
        res.json({
            data: requestsWithUsers
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    getFriends,
    getIncomingRequests
};
