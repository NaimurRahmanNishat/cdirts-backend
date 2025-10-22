import { IUser } from "../models/user.model";
import { redis } from "../utils/redis";

const PREFIX = "userState:";
export const DEFAULT_TTL_SECONDS = 15 * 60;

export type CachedUser = Omit<Partial<IUser>, "password"> & {
  _id: any;
};

function key(userId: string) {
  return PREFIX + userId;
}

export async function setUserState(userId: string, userObj: Partial<IUser>, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const plain = { ...userObj } as any;
  if ("password" in plain) delete plain.password;
  if (plain._id && plain._id.toString) plain._id = plain._id.toString();
  await redis.set(key(userId), JSON.stringify(plain), "EX", ttlSeconds);
}

export async function getUserState(userId: string): Promise<CachedUser | null> {
  const raw = await redis.get(key(userId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedUser;
    return parsed;
  } catch (err) {
    console.error("getUserState parse error:", err);
    return null;
  }
}

export async function deleteUserState(userId: string) {
  await redis.del(key(userId));
}
