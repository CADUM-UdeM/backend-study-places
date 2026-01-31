const Saved = require('../models/Saved');
const Place = require('../models/Place');
const Promo = require('../models/Promo');
const StudySession = require('../models/StudySession');

async function getSavedContent(req, res, next) {
    try {
        const userId = req.user._id.toString();
        const { type } = req.query;
        
        const saved = await Saved.findUserSaved(userId, type || null, {
            page: req.query.page || 1,
            limit: req.query.limit || 50
        });
        
        // Populate saved items with full details
        const result = {
            places: [],
            promos: [],
            sessions: []
        };
        
        for (const item of saved) {
            if (item.targetType === 'place') {
                const place = await Place.findPlaceById(item.targetId);
                if (place) result.places.push(place);
            } else if (item.targetType === 'promo') {
                const promo = await Promo.findPromoById(item.targetId);
                if (promo) result.promos.push(promo);
            } else if (item.targetType === 'session') {
                const session = await StudySession.findSessionById(item.targetId);
                if (session) result.sessions.push(session);
            }
        }
        
        res.json({
            data: result
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getSavedContent
};
