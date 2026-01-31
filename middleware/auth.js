const { verifyToken } = require('../utils/jwt');
const { findUserById } = require('../models/User');

async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: {
                    message: 'Authentication required',
                    code: 'UNAUTHORIZED'
                }
            });
        }
        
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return res.status(401).json({
                error: {
                    message: 'Invalid or expired token',
                    code: 'INVALID_TOKEN'
                }
            });
        }
        
        const user = await findUserById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }
        
        if (user.status.isBanned) {
            return res.status(403).json({
                error: {
                    message: 'Account is banned',
                    code: 'ACCOUNT_BANNED'
                }
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            error: {
                message: 'Authentication error',
                code: 'AUTH_ERROR'
            }
        });
    }
}

function ownerOnlyMiddleware(resourceUserIdField = 'userId') {
    return (req, res, next) => {
        const resourceUserId = req.resource?.[resourceUserIdField]?.toString();
        const currentUserId = req.user._id.toString();
        
        if (resourceUserId !== currentUserId) {
            return res.status(403).json({
                error: {
                    message: 'Access denied. You do not own this resource.',
                    code: 'FORBIDDEN'
                }
            });
        }
        
        next();
    };
}

module.exports = {
    authMiddleware,
    ownerOnlyMiddleware
};
