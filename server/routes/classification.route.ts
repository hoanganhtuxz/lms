import { authorieRoles, isAutheticated } from "./../middieware/auth";
import exporess from "express";
import { uploadClassification,
    editClassifcation,
    getAllClassification,
    getClassificationById,
    deleteClassificationById } from "../controller/classification.controller";

export const classificationRouter = exporess.Router();

classificationRouter.post(
  "/classification",
  isAutheticated,
  authorieRoles("admin", "management",),
  uploadClassification
);

classificationRouter.put(
  "/classification/:id",
  isAutheticated,
  authorieRoles("admin", "management",),
  editClassifcation
);

classificationRouter.get(
  "/classification/:id",
  isAutheticated,
  authorieRoles("admin", "management", "user"),
  getClassificationById
);

classificationRouter.get(
  "/classification",
  isAutheticated,
  authorieRoles("admin", "management", "user"),
  getAllClassification
);

classificationRouter.delete(
  "/classification/:id",
  isAutheticated,
  authorieRoles("admin", "management",),
  deleteClassificationById
);

export default classificationRouter;
