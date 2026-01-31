const User = require('../models/User');
const Friend = require('../models/Friend');
const FriendRequest = require('../models/FriendRequest');

async function searchUsers(req, res, next) {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.status(400).json({
                error: {
                    message: 'Search query must be at least 2 characters',
                    code: 'INVALID_QUERY'
                }
            });
        }
        
        const users = await User.searchUsers(q, 20);
        
        // Remove sensitive data
        const sanitizedUsers = users.map(user => ({
            _id: user._id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl
        }));
        
        res.json({
            data: sanitizedUsers
        });
    } catch (error) {
        next(error);
    }
}

async function getUserById(req, res, next) {
    try {
        const { id } = req.params;
        const currentUserId = req.user._id.toString();
        
        const user = await User.findUserById(id);
        
        if (!user) {
            return res.status(404).json({
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }
        
        // Check if friends
        const isFriend = await Friend.areFriends(currentUserId, id);
        
        // Check friend request status
        let friendRequestStatus = null;
        const pendingRequest = await FriendRequest.findPendingRequest(currentUserId, id);
        if (pendingRequest) {
            if (pendingRequest.fromUserId.toString() === currentUserId) {
                friendRequestStatus = 'sent';
            } else {
                friendRequestStatus = 'received';
            }
        }
        
        // Remove sensitive data
        const profile = {
            _id: user._id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            school: user.school,
            stats: user.stats,
            createdAt: user.createdAt,
            isFriend,
            friendRequestStatus
        };
        
        res.json({
            data: profile
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    searchUsers,
    getUserById
};
