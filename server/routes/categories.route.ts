import { authorieRoles, isAutheticated } from "./../middieware/auth";
import exporess from "express";
import {
  deleteCategoryById,
  editCategory,
  getAllCategory,
  getCategoryById,
  uploadCategory,
} from "../controller/categories.controller";

export const categoriesRouter = exporess.Router();

categoriesRouter.post(
  "/create-category",
  isAutheticated,
  authorieRoles("admin", "management", "user"),
  uploadCategory
);

categoriesRouter.put(
  "/edit-category/:id",
  isAutheticated,
  authorieRoles("admin", "management", "user"),
  editCategory
);

categoriesRouter.get(
  "/category/:id",
  isAutheticated,
  authorieRoles("admin", "management", "user"),
  getCategoryById
);

categoriesRouter.get(
  "/category/",
  isAutheticated,
  authorieRoles("admin", "management", "user"),
  getAllCategory
);

categoriesRouter.delete(
  "/category/:id",
  isAutheticated,
  authorieRoles("admin", "management", "user"),
  deleteCategoryById
);

export default categoriesRouter;
