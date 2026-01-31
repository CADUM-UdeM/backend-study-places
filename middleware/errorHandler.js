function errorHandler(err, req, res, next) {
    console.error('Error:', err);
    
    // MongoDB duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(409).json({
            error: {
                message: `${field} already exists`,
                code: 'DUPLICATE_KEY'
            }
        });
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: {
                message: 'Invalid token',
                code: 'INVALID_TOKEN'
            }
        });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: {
                message: 'Token expired',
                code: 'TOKEN_EXPIRED'
            }
        });
    }
    
    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: {
                message: err.message,
                code: 'VALIDATION_ERROR'
            }
        });
    }
    
    // Default error
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal server error',
            code: err.code || 'INTERNAL_ERROR'
        }
    });
}

module.exports = errorHandler;
