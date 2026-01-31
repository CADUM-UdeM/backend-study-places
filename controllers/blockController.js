const Block = require('../models/Block');
const Report = require('../models/Report');

async function blockUser(req, res, next) {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id.toString();
        
        if (userId === currentUserId) {
            return res.status(400).json({
                error: {
                    message: 'Cannot block yourself',
                    code: 'INVALID_REQUEST'
                }
            });
        }
        
        const existingBlock = await Block.findBlock(currentUserId, userId);
        if (existingBlock) {
            return res.status(409).json({
                error: {
                    message: 'User already blocked',
                    code: 'ALREADY_BLOCKED'
                }
            });
        }
        
        await Block.createBlock(currentUserId, userId);
        
        res.json({
            data: {
                message: 'User blocked'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function unblockUser(req, res, next) {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id.toString();
        
        const deleted = await Block.deleteBlock(currentUserId, userId);
        
        if (!deleted) {
            return res.status(404).json({
                error: {
                    message: 'Block not found',
                    code: 'BLOCK_NOT_FOUND'
                }
            });
        }
        
        res.json({
            data: {
                message: 'User unblocked'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function createReport(req, res, next) {
    try {
        const { targetType, targetId, reason } = req.body;
        const reporterId = req.user._id.toString();
        
        const report = await Report.createReport({
            reporterId,
            targetType,
            targetId,
            reason
        });
        
        res.status(201).json({
            data: {
                report
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    blockUser,
    unblockUser,
    createReport
};
