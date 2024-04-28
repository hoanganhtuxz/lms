import { Response, NextFunction, Request } from "express";
import { CatchAsyncError } from "../middieware/catchAsyncError";
import ProductModel from "../models/warehouse.model";

/// create product

export const createProduct = CatchAsyncError(
  async (data: any, res: Response) => {
    const product = await ProductModel.create(data);
    res.status(201).json({
      success: true,
      product,
    });
  }
);
