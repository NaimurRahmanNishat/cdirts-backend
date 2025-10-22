import { IUser } from "../models/user.model";
export declare const DEFAULT_TTL_SECONDS: number;
export type CachedUser = Omit<Partial<IUser>, "password"> & {
    _id: any;
};
export declare function setUserState(userId: string, userObj: Partial<IUser>, ttlSeconds?: number): Promise<void>;
export declare function getUserState(userId: string): Promise<CachedUser | null>;
export declare function deleteUserState(userId: string): Promise<void>;
//# sourceMappingURL=authState.d.ts.map