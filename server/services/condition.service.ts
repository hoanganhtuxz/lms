import { Response, NextFunction, Request } from "express";
import { CatchAsyncError } from "../middieware/catchAsyncError";
import ConditionModel from "../models/condition.model";

/// create Condition

export const createCondition= CatchAsyncError(
  async (data: any, res: Response) => {
    const condition = await ConditionModel.create(data);
    res.status(201).json({
      success: true,
      data: condition,
    });
  }
);
