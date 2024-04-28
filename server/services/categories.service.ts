import { Response, NextFunction, Request } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middieware/catchAsyncError";
import CategoryModel from "../models/categories.model";

/// create categoris

export const createCategorie = CatchAsyncError(
  async (data: any, res: Response) => {
    const categorie = await CategoryModel.create(data);
    res.status(201).json({
      success: true,
      categorie,
    });
  }
);
