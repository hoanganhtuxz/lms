import express from "express";
import {
  loginUser,
  activateUser,
  registrationUser,
  logoutUser,
  updateAccessToken,
  getUserInfo,
  socialAuth,
  updateUserInfor,
  updatePassword,
  updateProfileAvatar,
  getAllUser,
  editUser,
  deleteUserById,
  uploadUser,
} from "../controller/user.controller";
import { authorieRoles, isAutheticated } from "../middieware/auth";
export const userRouter = express.Router();

userRouter.post("/registration", registrationUser);
userRouter.post("/activation-user", activateUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", isAutheticated, logoutUser);
userRouter.get("/refresh", updateAccessToken);
userRouter.get("/user", isAutheticated, getUserInfo);
userRouter.post("/social-auth", socialAuth);
userRouter.put("/user", isAutheticated, updateUserInfor);
userRouter.put("/update-password", isAutheticated, updatePassword);
userRouter.put("/update-avatar", isAutheticated, updateProfileAvatar);

userRouter.get("/accounts", getAllUser, authorieRoles("admin"));
userRouter.post("/accounts", uploadUser, authorieRoles("admin"));
userRouter.put("/accounts/:id", editUser, authorieRoles("admin"));
userRouter.delete("/accounts/:id", deleteUserById, authorieRoles("admin"));

export default userRouter;
