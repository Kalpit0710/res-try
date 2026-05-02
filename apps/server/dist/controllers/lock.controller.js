"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocks = getLocks;
exports.createLock = createLock;
exports.updateLock = updateLock;
exports.deleteLock = deleteLock;
const zod_1 = require("zod");
const Lock_1 = require("../models/Lock");
const LockCreateSchema = zod_1.z.object({
    type: zod_1.z.enum(['system', 'class', 'student', 'teacher']),
    referenceId: zod_1.z.string().trim().min(1, 'referenceId is required'),
    isLocked: zod_1.z.boolean().optional(),
});
const LockUpdateSchema = zod_1.z.object({
    isLocked: zod_1.z.boolean(),
});
async function getLocks(req, res) {
    const { type, referenceId } = req.query;
    const query = {};
    if (type)
        query.type = type;
    if (referenceId)
        query.referenceId = referenceId;
    const locks = await Lock_1.Lock.find(query).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, data: locks });
}
async function createLock(req, res) {
    const parsed = LockCreateSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Invalid body' });
        return;
    }
    const doc = await Lock_1.Lock.findOneAndUpdate({ type: parsed.data.type, referenceId: parsed.data.referenceId }, { $set: { isLocked: parsed.data.isLocked ?? true } }, { new: true, upsert: true });
    res.status(201).json({ success: true, data: doc });
}
async function updateLock(req, res) {
    const parsed = LockUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Invalid body' });
        return;
    }
    const doc = await Lock_1.Lock.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true });
    if (!doc) {
        res.status(404).json({ success: false, message: 'Lock not found' });
        return;
    }
    res.json({ success: true, data: doc });
}
async function deleteLock(req, res) {
    const doc = await Lock_1.Lock.findByIdAndDelete(req.params.id);
    if (!doc) {
        res.status(404).json({ success: false, message: 'Lock not found' });
        return;
    }
    res.json({ success: true, message: 'Lock deleted' });
}
