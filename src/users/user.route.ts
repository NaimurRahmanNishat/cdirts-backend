import { Router } from "express";
import { editUserProfile, forgotPassword, getAllUser, resendLoginOtp, resetPassword, userDelete, userLogin, userLogout, userRegister, verifyOtp, verifyRegisterOtp } from "./user.controller";
import { verifyAdmin } from "../middleware/verifyAdmin";
import verifyToken from "../middleware/verifyToken";


const router = Router();

router.post("/register", userRegister);
router.post("/verify-register-otp", verifyRegisterOtp);
router.post("/login", userLogin);
router.post("/verify-login-otp", verifyOtp);
router.post("/resend-login-otp", resendLoginOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", userLogout);
router.get("/", verifyToken, verifyAdmin, getAllUser);
router.delete("/:id", verifyToken, verifyAdmin, userDelete)
router.patch("/edit-profile/:id", verifyToken , editUserProfile);

export default router;