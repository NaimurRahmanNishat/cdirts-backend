"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TTL_SECONDS = void 0;
exports.setUserState = setUserState;
exports.getUserState = getUserState;
exports.deleteUserState = deleteUserState;
const redis_1 = require("../utils/redis");
const PREFIX = "userState:";
exports.DEFAULT_TTL_SECONDS = 15 * 60;
function key(userId) {
    return PREFIX + userId;
}
async function setUserState(userId, userObj, ttlSeconds = exports.DEFAULT_TTL_SECONDS) {
    const plain = { ...userObj };
    if ("password" in plain)
        delete plain.password;
    if (plain._id && plain._id.toString)
        plain._id = plain._id.toString();
    await redis_1.redis.set(key(userId), JSON.stringify(plain), "EX", ttlSeconds);
}
async function getUserState(userId) {
    const raw = await redis_1.redis.get(key(userId));
    if (!raw)
        return null;
    try {
        const parsed = JSON.parse(raw);
        return parsed;
    }
    catch (err) {
        console.error("getUserState parse error:", err);
        return null;
    }
}
async function deleteUserState(userId) {
    await redis_1.redis.del(key(userId));
}
//# sourceMappingURL=authState.js.map