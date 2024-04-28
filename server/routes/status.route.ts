import { authorieRoles, isAutheticated } from "./../middieware/auth";
import exporess from "express";
import { deleteStatusById, editStatus, getAllStatus, getStatusById, uploadStatus } from "../controller/status.controller";

export const statusRouter = exporess.Router();

statusRouter.post(
  "/status",
  isAutheticated,
  authorieRoles("admin", "management",),
  uploadStatus
);

statusRouter.put(
  "/status/:id",
  isAutheticated,
  authorieRoles("admin", "management", "user"),
  editStatus
);

statusRouter.get(
  "/status/:id",
  isAutheticated,
  authorieRoles("admin", "management", "user"),
  getStatusById
);

statusRouter.get(
  "/status",
  isAutheticated,
  authorieRoles("admin", "management", "user"),
  getAllStatus
);

statusRouter.delete(
  "/status/:id",
  isAutheticated,
  authorieRoles("admin", "management", "user"),
  deleteStatusById
);

export default statusRouter;
