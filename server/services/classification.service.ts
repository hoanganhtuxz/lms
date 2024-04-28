import { Response, NextFunction, Request } from "express";
import { CatchAsyncError } from "../middieware/catchAsyncError";
import ClassificationModel from "../models/classification.model";

/// create Classification

export const createClassification = CatchAsyncError(
  async (data: any, res: Response) => {
    const classification = await ClassificationModel.create(data);
    res.status(201).json({
      success: true,
      data: classification,
    });
  }
);
