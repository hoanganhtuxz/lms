import { Response, NextFunction, Request } from "express";
import { CatchAsyncError } from "../middieware/catchAsyncError";
import StatusModel from "../models/status.model";

/// create status

export const createStatus = CatchAsyncError(
  async (data: any, res: Response) => {
    const status = await StatusModel.create(data);
    res.status(201).json({
      success: true,
      status,
    });
  }
);
