import { authorieRoles, isAutheticated } from "./../middieware/auth";
import exporess from "express";
import {
  uploadCondition,
  editCondition,
  getAllCondition,
  getConditionById,
  deleteConditionById,
} from "../controller/condition.controller";

export const conditionRouter = exporess.Router();

conditionRouter.post(
  "/condition",
  isAutheticated,
  authorieRoles("admin", "management"),
  uploadCondition
);

conditionRouter.put(
  "/condition/:id",
  isAutheticated,
  authorieRoles("admin", "management"),
  editCondition
);

conditionRouter.get(
  "/condition/:id",
  isAutheticated,
  authorieRoles("admin", "management", "user"),
  getConditionById
  
);

conditionRouter.get(
  "/condition",
  isAutheticated,
  authorieRoles("admin", "management", "user"),
  getAllCondition
);

conditionRouter.delete(
  "/condition/:id",
  isAutheticated,
  authorieRoles("admin", "management"),
  deleteConditionById
);

export default conditionRouter;
