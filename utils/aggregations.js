const { ObjectId } = require('mongodb');

/**
 * Helper to add personalization flags (isLikedByMe, isSavedByMe) to items
 */
async function addPersonalizationFlags(items, userId, likeModel, savedModel) {
    if (!userId || items.length === 0) {
        return items.map(item => ({
            ...item,
            isLikedByMe: false,
            isSavedByMe: false
        }));
    }

    const itemIds = items.map(item => item._id || item.placeId || item.promoId);
    const targetType = items[0].placeId ? 'place' : (items[0].promoId ? 'promo' : 'session');
    
    const likedIds = await likeModel.checkMultipleLikes(userId, targetType, itemIds);
    const savedIds = await savedModel.checkMultipleSaved(userId, targetType, itemIds);
    
    return items.map(item => {
        const itemId = item._id?.toString() || item.placeId || item.promoId;
        return {
            ...item,
            isLikedByMe: likedIds.includes(itemId),
            isSavedByMe: savedIds.includes(itemId)
        };
    });
}

/**
 * Helper to populate user details in results
 */
async function populateUserDetails(items, userIdField, userModel) {
    if (items.length === 0) return items;
    
    const userIds = [...new Set(items.map(item => item[userIdField]?.toString()).filter(Boolean))];
    
    if (userIds.length === 0) return items;
    
    const users = await Promise.all(
        userIds.map(id => userModel.findUserById(id))
    );
    
    const userMap = {};
    users.forEach(user => {
        if (user) {
            userMap[user._id.toString()] = {
                _id: user._id,
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl
            };
        }
    });
    
    return items.map(item => ({
        ...item,
        user: userMap[item[userIdField]?.toString()] || null
    }));
}

module.exports = {
    addPersonalizationFlags,
    populateUserDetails
};
