const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/database');

const COLLECTION_NAME = 'reports';

async function createReport(reportData) {
    const db = getDatabase();
    const now = new Date();
    
    const report = {
        reporterId: new ObjectId(reportData.reporterId),
        targetType: reportData.targetType,
        targetId: new ObjectId(reportData.targetId),
        reason: reportData.reason,
        createdAt: now
    };

    const result = await db.collection(COLLECTION_NAME).insertOne(report);
    return { ...report, _id: result.insertedId };
}

async function findReportsByTargetType(targetType, options = {}) {
    const db = getDatabase();
    
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 50;
    const skip = (page - 1) * limit;
    
    return await db.collection(COLLECTION_NAME)
        .find({ targetType })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
}

module.exports = {
    COLLECTION_NAME,
    createReport,
    findReportsByTargetType
};
