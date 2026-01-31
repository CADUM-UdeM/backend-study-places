const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');

async function register(req, res, next) {
    try {
        const { email, password, username, displayName } = req.body;
        
        // Check if user already exists
        const existingEmail = await User.findUserByEmail(email);
        if (existingEmail) {
            return res.status(409).json({
                error: {
                    message: 'Email already registered',
                    code: 'EMAIL_EXISTS'
                }
            });
        }
        
        const existingUsername = await User.findUserByUsername(username);
        if (existingUsername) {
            return res.status(409).json({
                error: {
                    message: 'Username already taken',
                    code: 'USERNAME_EXISTS'
                }
            });
        }
        
        // Hash password
        const passwordHash = await hashPassword(password);
        
        // Create user
        const user = await User.createUser({
            email,
            username,
            displayName: displayName || 'Deja Brew guest',
            passwordHash
        });
        
        // Generate token
        const token = generateToken(user._id);
        
        // Remove password hash from response
        delete user.passwordHash;
        
        res.status(201).json({
            data: {
                token,
                user
            }
        });
    } catch (error) {
        next(error);
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                error: {
                    message: 'Invalid email or password',
                    code: 'INVALID_CREDENTIALS'
                }
            });
        }
        
        // Verify password
        const isValid = await comparePassword(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({
                error: {
                    message: 'Invalid email or password',
                    code: 'INVALID_CREDENTIALS'
                }
            });
        }
        
        // Generate token
        const token = generateToken(user._id);
        
        // Remove password hash from response
        delete user.passwordHash;
        
        res.json({
            data: {
                token,
                user
            }
        });
    } catch (error) {
        next(error);
    }
}

async function getMe(req, res, next) {
    try {
        const user = { ...req.user };
        delete user.passwordHash;
        
        res.json({
            data: {
                user
            }
        });
    } catch (error) {
        next(error);
    }
}

async function updateMe(req, res, next) {
    try {
        const { displayName, bio, school, preferences, avatarUrl } = req.body;
        
        const updateData = {};
        if (displayName !== undefined) updateData.displayName = displayName;
        if (bio !== undefined) updateData.bio = bio;
        if (school !== undefined) updateData.school = school;
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
        if (preferences !== undefined) {
            updateData['preferences.noise'] = preferences.noise;
            updateData['preferences.wifi'] = preferences.wifi;
            updateData['preferences.outlets'] = preferences.outlets;
            updateData['preferences.favoriteDistricts'] = preferences.favoriteDistricts;
            updateData['preferences.tags'] = preferences.tags;
        }
        
        const updatedUser = await User.updateUser(req.user._id, updateData);
        delete updatedUser.passwordHash;
        
        res.json({
            data: {
                user: updatedUser
            }
        });
    } catch (error) {
        next(error);
    }
}

async function updatePushToken(req, res, next) {
    try {
        const { expoToken } = req.body;
        
        await User.updateUser(req.user._id, {
            'push.expoToken': expoToken
        });
        
        res.json({
            data: {
                message: 'Push token updated successfully'
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    register,
    login,
    getMe,
    updateMe,
    updatePushToken
};
