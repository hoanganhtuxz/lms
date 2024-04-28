import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middieware/catchAsyncError";
import { createClassification } from "../services/classification.service";
import ClassificationModel from "../models/classification.model";

/// upload classifcation

interface iClassification {
  name: string;
  description?: string;
}

export const uploadClassification = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as any;
      const name = data.name;
      const isNameAlreadyExist = await ClassificationModel.findOne({ name });

      if (isNameAlreadyExist) {
        return next(new ErrorHandler("Name Classification already exists", 400));
      }

      if (!name) {
        return next(new ErrorHandler("Please enter name Classification", 400));
      }

      createClassification(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// eidt classifcation

export const editClassifcation = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as iClassification;
      const name = data.name;

      if (name) {
        const isNameExist = await ClassificationModel.findOne({ name });
        if (isNameExist) {
          return next(new ErrorHandler("Name classification already exists", 400));
        }
      }

      const classificationId = req.params.id;

      const classification = await ClassificationModel.findByIdAndUpdate(
        classificationId,
        { $set: data },
        { new: true }
      );

      res.status(201).json({
        success: true,
        data:classification,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get all status
interface QueryParams {
  keyword?: string;
  limit?: string;
  page?: string;
  sort?: "asc" | "desc";
  date?: any;
  month?: any;
  year?: any;
  price?: "asc" | "desc";
  quantity?: "asc" | "desc";
}

export const getAllClassification= CatchAsyncError(
  async (
    req: Request<any, any, any, QueryParams>,
    res: Response,
    next: NextFunction
  ) => {
    const {
      keyword,
      sort = "desc",
      page = "1",
      date,
      month,
      year,
      price,
      quantity,
    } = req.query;

    let limit: any = req.query.limit;
    let query = ClassificationModel.find();

    // Keyword
    if (keyword) {
      query = query.find({ name: { $regex: keyword, $options: "i" } });
    }
    // Tìm kiếm theo mốc thời gian chỉ định
    if (date || month || year) {
      const createdAtQuery: any = {};

      if (date) {
        createdAtQuery.$gte = new Date(date as string);
        createdAtQuery.$lt = new Date(
          new Date(createdAtQuery.$gte).getTime() + 24 * 60 * 60 * 1000
        );
      }

      if (month) {
        const monthNumber = parseInt(month as string, 10) - 1;
        const year = new Date().getFullYear();
        createdAtQuery.$gte = new Date(year, monthNumber, 1);
        createdAtQuery.$lt = new Date(year, monthNumber + 1, 1);
      }

      if (year) {
        createdAtQuery.$gte = new Date(parseInt(year as string, 10), 0, 1);
        createdAtQuery.$lt = new Date(parseInt(year as string, 10) + 1, 0, 1);
      }

      query = query.find({ createdAt: createdAtQuery });
    }

    // Sort
    let sortCriteria = "-createdAt";
    if (sort === "asc") {
      sortCriteria = "createdAt";
    } else if (price === "asc") {
      sortCriteria = "price";
    } else if (price === "desc") {
      sortCriteria = "-price";
    } else if (quantity === "asc") {
      sortCriteria = "quantity";
    } else if (quantity === "desc") {
      sortCriteria = "-quantity";
    }
    query = query.sort(sortCriteria);

    if (limit) {
      limit = parseInt(limit, 10);
      if (!isNaN(limit) && limit > 0) {
        const pageAsNumber = parseInt(page, 10) || 1;
        const skip = (pageAsNumber - 1) * limit;

        const totalData = await ClassificationModel.countDocuments(query.getFilter());

        query = query.skip(skip).limit(limit);

        const classification = await query;

        return res.status(200).json({
          success: true,
          count: classification.length,
          totalPages: Math.ceil(totalData / limit),
          currentPage: pageAsNumber,
          classification,
        });
      }
    }

    // Nếu không có limit, trả về tất cả dữ liệu
    const classification = await query;
    res.status(200).json({
      success: true,
      count: classification.length,
      classification,
    });
  }
);

// get one classification  by ID

export const getClassificationById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const statusId = req.params.id;
      const status = await ClassificationModel.findById(statusId);

      if (!status) {
        return next(new ErrorHandler("Classification not found", 404));
      }

      res.status(200).json({
        success: true,
        status,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// delete byid

export const deleteClassificationById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const statusId = req.params.id;
      const status = await ClassificationModel.findByIdAndDelete(statusId);

      if (!status) {
        return next(new ErrorHandler("Status not found", 404));
      }

      res.status(200).json({
        success: true,
        message: "Classification has been deleted",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
