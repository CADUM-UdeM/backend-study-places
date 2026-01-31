const StudySession = require('../models/StudySession');
const SessionParticipant = require('../models/SessionParticipant');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Saved = require('../models/Saved');
const Friend = require('../models/Friend');

async function createSession(req, res, next) {
    try {
        const userId = req.user._id.toString();
        const sessionData = {
            ...req.body,
            createdBy: userId
        };
        
        // Create session
        const session = await StudySession.createSession(sessionData);
        
        // Auto-add creator as accepted participant
        await SessionParticipant.createParticipant({
            sessionId: session._id.toString(),
            userId,
            status: 'accepted'
        });
        
        // Update user stats
        await User.incrementUserStat(userId, 'sessionsCreated', 1);
        
        res.status(201).json({
            data: {
                session
            }
        });
    } catch (error) {
        next(error);
    }
}

async function getSessions(req, res, next) {
    try {
        const filters = {
            public: req.query.public,
            course: req.query.course,
            placeId: req.query.placeId,
            district: req.query.district
        };
        
        const options = {
            sort: req.query.sort || 'recent',
            page: req.query.page || 1,
            limit: req.query.limit || 20
        };
        
        const result = await StudySession.findSessions(filters, options);
        
        // Populate creator details and join status
        const sessionsWithDetails = await Promise.all(
            result.sessions.map(async (session) => {
                const creator = await User.findUserById(session.createdBy);
                
                let joinStatusByMe = 'none';
                if (req.user) {
                    const participant = await SessionParticipant.findParticipant(
                        session._id.toString(),
                        req.user._id.toString()
                    );
                    if (participant) {
                        joinStatusByMe = participant.status;
                    }
                }
                
                return {
                    ...session,
                    createdBy: creator ? {
                        _id: creator._id,
                        username: creator.username,
                        displayName: creator.displayName,
                        avatarUrl: creator.avatarUrl
                    } : null,
                    joinStatusByMe
                };
            })
        );
        
        res.json({
            data: sessionsWithDetails,
            meta: result.meta
        });
    } catch (error) {
        next(error);
    }
}

async function getSessionById(req, res, next) {
    try {
        const { sessionId } = req.params;
        
        const session = await StudySession.findSessionById(sessionId);
        
        if (!session) {
            return res.status(404).json({
                error: {
                    message: 'Session not found',
                    code: 'SESSION_NOT_FOUND'
                }
            });
        }
        
        // Get participants
        const participants = await SessionParticipant.findParticipantsBySessionId(sessionId);
        
        // Populate participant details
        const participantsWithDetails = await Promise.all(
            participants.map(async (participant) => {
                const user = await User.findUserById(participant.userId);
                return {
                    _id: participant._id,
                    status: participant.status,
                    user: user ? {
                        _id: user._id,
                        username: user.username,
                        displayName: user.displayName,
                        avatarUrl: user.avatarUrl
                    } : null
                };
            })
        );
        
        // Get creator details
        const creator = await User.findUserById(session.createdBy);
        
        res.json({
            data: {
                ...session,
                createdBy: creator ? {
                    _id: creator._id,
                    username: creator.username,
                    displayName: creator.displayName,
                    avatarUrl: creator.avatarUrl
                } : null,
                participants: participantsWithDetails
            }
        });
    } catch (error) {
        next(error);
    }
}

async function joinSession(req, res, next) {
    try {
        const { sessionId } = req.params;
        const userId = req.user._id.toString();
        
        const session = await StudySession.findSessionById(sessionId);
        
        if (!session) {
            return res.status(404).json({
                error: {
                    message: 'Session not found',
                    code: 'SESSION_NOT_FOUND'
                }
            });
        }
        
        if (session.status === 'full' || session.status === 'cancelled') {
            return res.status(400).json({
                error: {
                    message: `Cannot join ${session.status} session`,
                    code: 'SESSION_NOT_AVAILABLE'
                }
            });
        }
        
        // Check if already joined
        const existingParticipant = await SessionParticipant.findParticipant(sessionId, userId);
        if (existingParticipant) {
            return res.status(409).json({
                error: {
                    message: 'Already joined',
                    code: 'ALREADY_JOINED'
                }
            });
        }
        
        // Create participant request
        await SessionParticipant.createParticipant({
            sessionId,
            userId,
            status: 'pending'
        });
        
        // Update session participant count
        await StudySession.updateSessionCounts(sessionId, {
            participantsCount: session.participantsCount + 1
        });
        
        // Notify session creator
        await Notification.createNotification({
            userId: session.createdBy.toString(),
            type: Notification.NOTIFICATION_TYPES.SESSION_REQUEST,
            title: 'New join request',
            description: `${req.user.displayName} wants to join your study session`,
            data: {
                sessionId,
                fromUserId: userId
            }
        });
        
        res.json({
            data: {
                joinStatus: 'pending'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function acceptParticipant(req, res, next) {
    try {
        const { sessionId, userId } = req.params;
        const creatorId = req.user._id.toString();
        
        const session = await StudySession.findSessionById(sessionId);
        
        if (!session) {
            return res.status(404).json({
                error: {
                    message: 'Session not found',
                    code: 'SESSION_NOT_FOUND'
                }
            });
        }
        
        // Check if user is creator
        if (session.createdBy.toString() !== creatorId) {
            return res.status(403).json({
                error: {
                    message: 'Only the creator can accept participants',
                    code: 'FORBIDDEN'
                }
            });
        }
        
        const participant = await SessionParticipant.findParticipant(sessionId, userId);
        
        if (!participant) {
            return res.status(404).json({
                error: {
                    message: 'Participant not found',
                    code: 'PARTICIPANT_NOT_FOUND'
                }
            });
        }
        
        if (participant.status !== 'pending') {
            return res.status(400).json({
                error: {
                    message: 'Participant already processed',
                    code: 'INVALID_STATUS'
                }
            });
        }
        
        // Update participant status
        await SessionParticipant.updateParticipantStatus(sessionId, userId, 'accepted');
        
        // Update accepted count
        const newAcceptedCount = session.acceptedCount + 1;
        const updates = { acceptedCount: newAcceptedCount };
        
        // Check if session is now full
        if (newAcceptedCount >= session.maxPeople) {
            updates.status = 'full';
        }
        
        await StudySession.updateSessionCounts(sessionId, updates);
        
        // Notify user
        await Notification.createNotification({
            userId,
            type: Notification.NOTIFICATION_TYPES.SESSION_ACCEPTED,
            title: 'Join request accepted',
            description: `Your request to join "${session.title}" was accepted`,
            data: {
                sessionId
            }
        });
        
        res.json({
            data: {
                message: 'Participant accepted'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function declineParticipant(req, res, next) {
    try {
        const { sessionId, userId } = req.params;
        const creatorId = req.user._id.toString();
        
        const session = await StudySession.findSessionById(sessionId);
        
        if (!session) {
            return res.status(404).json({
                error: {
                    message: 'Session not found',
                    code: 'SESSION_NOT_FOUND'
                }
            });
        }
        
        // Check if user is creator
        if (session.createdBy.toString() !== creatorId) {
            return res.status(403).json({
                error: {
                    message: 'Only the creator can decline participants',
                    code: 'FORBIDDEN'
                }
            });
        }
        
        const participant = await SessionParticipant.findParticipant(sessionId, userId);
        
        if (!participant) {
            return res.status(404).json({
                error: {
                    message: 'Participant not found',
                    code: 'PARTICIPANT_NOT_FOUND'
                }
            });
        }
        
        // Update participant status
        await SessionParticipant.updateParticipantStatus(sessionId, userId, 'declined');
        
        // Update participant count
        await StudySession.updateSessionCounts(sessionId, {
            participantsCount: session.participantsCount - 1
        });
        
        res.json({
            data: {
                message: 'Participant declined'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function leaveSession(req, res, next) {
    try {
        const { sessionId } = req.params;
        const userId = req.user._id.toString();
        
        const session = await StudySession.findSessionById(sessionId);
        
        if (!session) {
            return res.status(404).json({
                error: {
                    message: 'Session not found',
                    code: 'SESSION_NOT_FOUND'
                }
            });
        }
        
        // Can't leave if you're the creator
        if (session.createdBy.toString() === userId) {
            return res.status(400).json({
                error: {
                    message: 'Creator cannot leave session. Cancel it instead.',
                    code: 'CREATOR_CANNOT_LEAVE'
                }
            });
        }
        
        const participant = await SessionParticipant.findParticipant(sessionId, userId);
        
        if (!participant) {
            return res.status(404).json({
                error: {
                    message: 'You are not in this session',
                    code: 'NOT_A_PARTICIPANT'
                }
            });
        }
        
        // Remove participant
        await SessionParticipant.deleteParticipant(sessionId, userId);
        
        // Update counts
        const updates = {
            participantsCount: session.participantsCount - 1
        };
        
        if (participant.status === 'accepted') {
            updates.acceptedCount = session.acceptedCount - 1;
            
            // If session was full, set it back to open
            if (session.status === 'full') {
                updates.status = 'open';
            }
        }
        
        await StudySession.updateSessionCounts(sessionId, updates);
        
        res.json({
            data: {
                message: 'Left session'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function cancelSession(req, res, next) {
    try {
        const { sessionId } = req.params;
        const userId = req.user._id.toString();
        
        const session = await StudySession.findSessionById(sessionId);
        
        if (!session) {
            return res.status(404).json({
                error: {
                    message: 'Session not found',
                    code: 'SESSION_NOT_FOUND'
                }
            });
        }
        
        // Check if user is creator
        if (session.createdBy.toString() !== userId) {
            return res.status(403).json({
                error: {
                    message: 'Only the creator can cancel the session',
                    code: 'FORBIDDEN'
                }
            });
        }
        
        // Update session status
        await StudySession.updateSession(sessionId, { status: 'cancelled' });
        
        // Notify all participants
        const participants = await SessionParticipant.findParticipantsBySessionId(sessionId);
        
        await Promise.all(
            participants
                .filter(p => p.userId.toString() !== userId)
                .map(participant =>
                    Notification.createNotification({
                        userId: participant.userId.toString(),
                        type: Notification.NOTIFICATION_TYPES.SESSION_CANCELLED,
                        title: 'Study session cancelled',
                        description: `"${session.title}" has been cancelled`,
                        data: {
                            sessionId
                        }
                    })
                )
        );
        
        res.json({
            data: {
                message: 'Session cancelled'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function saveSession(req, res, next) {
    try {
        const { sessionId } = req.params;
        const userId = req.user._id.toString();
        
        const session = await StudySession.findSessionById(sessionId);
        if (!session) {
            return res.status(404).json({
                error: {
                    message: 'Session not found',
                    code: 'SESSION_NOT_FOUND'
                }
            });
        }
        
        const existingSaved = await Saved.findSaved(userId, 'session', sessionId);
        
        if (existingSaved) {
            return res.status(409).json({
                error: {
                    message: 'Already saved',
                    code: 'ALREADY_SAVED'
                }
            });
        }
        
        await Saved.createSaved({
            userId,
            targetType: 'session',
            targetId: sessionId
        });
        
        res.json({
            data: {
                message: 'Session saved'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function unsaveSession(req, res, next) {
    try {
        const { sessionId } = req.params;
        const userId = req.user._id.toString();
        
        const deleted = await Saved.deleteSaved(userId, 'session', sessionId);
        
        if (!deleted) {
            return res.status(404).json({
                error: {
                    message: 'Saved session not found',
                    code: 'SAVED_NOT_FOUND'
                }
            });
        }
        
        res.json({
            data: {
                message: 'Session unsaved'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function inviteFriend(req, res, next) {
    try {
        const { sessionId, friendId } = req.params;
        const userId = req.user._id.toString();
        
        const session = await StudySession.findSessionById(sessionId);
        
        if (!session) {
            return res.status(404).json({
                error: {
                    message: 'Session not found',
                    code: 'SESSION_NOT_FOUND'
                }
            });
        }
        
        // Check if user is creator
        if (session.createdBy.toString() !== userId) {
            return res.status(403).json({
                error: {
                    message: 'Only the creator can invite friends',
                    code: 'FORBIDDEN'
                }
            });
        }
        
        // Check if they are friends
        const areFriends = await Friend.areFriends(userId, friendId);
        if (!areFriends) {
            return res.status(400).json({
                error: {
                    message: 'You can only invite friends',
                    code: 'NOT_FRIENDS'
                }
            });
        }
        
        // Create notification
        await Notification.createNotification({
            userId: friendId,
            type: Notification.NOTIFICATION_TYPES.SESSION_INVITE,
            title: 'Study session invitation',
            description: `${req.user.displayName} invited you to "${session.title}"`,
            data: {
                sessionId,
                fromUserId: userId
            }
        });
        
        res.json({
            data: {
                message: 'Invitation sent'
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createSession,
    getSessions,
    getSessionById,
    joinSession,
    acceptParticipant,
    declineParticipant,
    leaveSession,
    cancelSession,
    saveSession,
    unsaveSession,
    inviteFriend
};
