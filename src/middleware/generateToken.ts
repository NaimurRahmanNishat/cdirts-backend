// import jwt from "jsonwebtoken";

// const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY as string;
// const generateToken = (userId: string): string => {
//   if (!JWT_SECRET_KEY) {
//     throw new Error("JWT_SECRET not defined");
//   }

//   return jwt.sign(
//     { id: userId },                        // payload (object / string)
//     JWT_SECRET_KEY,                        // secret (must NOT be null)
//     { expiresIn: "1d" }                    // options (expiresIn allowed here)
//   );
// };

// export default generateToken;

import jwt from "jsonwebtoken";
import User, { IUser } from "../users/user.model"; 
import { Types } from "mongoose";

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY as string;

if (!JWT_SECRET_KEY) {
  throw new Error("JWT_SECRET_KEY is not defined in environment variables.");
}

const generateToken = async (userId: Types.ObjectId | string): Promise<string> => {
  try {
    const user = await User.findById(userId) as IUser | null;
    if (!user) {
      throw new Error("User not found");
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    return token;
  } catch (error) {
    console.error("Error generating token", error);
    throw error;
  }
};

export default generateToken;