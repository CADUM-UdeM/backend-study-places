const { body, param, query, validationResult } = require('express-validator');

function validate(validations) {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }
        
        res.status(400).json({
            error: {
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: errors.array()
            }
        });
    };
}

// Common validation rules
const validationRules = {
    // Auth validations
    register: [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
        body('username').isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
            .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
        body('displayName').optional().isLength({ max: 50 }).withMessage('Display name max 50 characters')
    ],
    
    login: [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    
    // Review validations
    createReview: [
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('text').optional().isLength({ max: 500 }).withMessage('Review text max 500 characters')
    ],
    
    // Session validations
    createSession: [
        body('title').notEmpty().isLength({ max: 100 }).withMessage('Title required, max 100 characters'),
        body('course').optional().isLength({ max: 50 }).withMessage('Course max 50 characters'),
        body('maxPeople').isInt({ min: 2, max: 10 }).withMessage('Max people must be between 2 and 10'),
        body('placeId').notEmpty().withMessage('Place ID is required')
    ],
    
    // User update validations
    updateUser: [
        body('displayName').optional().isLength({ max: 50 }).withMessage('Display name max 50 characters'),
        body('bio').optional().isLength({ max: 200 }).withMessage('Bio max 200 characters'),
        body('school').optional().isLength({ max: 100 }).withMessage('School max 100 characters')
    ],
    
    // Promo validations
    createPromo: [
        body('title').notEmpty().isLength({ max: 100 }).withMessage('Title required, max 100 characters'),
        body('placeId').notEmpty().withMessage('Place ID is required'),
        body('promoStart').isISO8601().withMessage('Valid start date required'),
        body('promoEnd').isISO8601().withMessage('Valid end date required')
            .custom((value, { req }) => {
                if (new Date(value) <= new Date(req.body.promoStart)) {
                    throw new Error('End date must be after start date');
                }
                return true;
            })
    ],
    
    // ObjectId validation
    objectId: (paramName) => [
        param(paramName).matches(/^[0-9a-fA-F]{24}$/).withMessage('Invalid ID format')
    ],
    
    // Pagination
    pagination: [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ]
};

module.exports = {
    validate,
    validationRules
};
