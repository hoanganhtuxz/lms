import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middieware/catchAsyncError";
import { createStatus } from "../services/status.service";
import StatusModel from "../models/status.model";

/// upload status

interface iStatus {
  name: string;
  description?: string;
}

export const uploadStatus = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as any;
      const name = data.name;
      const isNameAlreadyExist = await StatusModel.findOne({ name });

      if (isNameAlreadyExist) {
        return next(new ErrorHandler("Name status already exists", 400));
      }

      if (!name) {
        return next(new ErrorHandler("Please enter name status", 400));
      }

      createStatus(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// eidt status

export const editStatus = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as iStatus;
      const name = data.name;

      // if (name) {
      //   const isNameExist = await StatusModel.findOne({ name });
      //   if (isNameExist) {
      //     return next(new ErrorHandler("Name status already exists", 400));
      //   }
      // }

      const statusId = req.params.id;

      const status = await StatusModel.findByIdAndUpdate(
        statusId,
        { $set: data },
        { new: true }
      );

      res.status(201).json({
        success: true,
        status,
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

export const getAllStatus = CatchAsyncError(
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
    let query = StatusModel.find();

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

        const totalData = await StatusModel.countDocuments(query.getFilter());

        query = query.skip(skip).limit(limit);

        const status = await query;

        return res.status(200).json({
          success: true,
          count: status.length,
          totalPages: Math.ceil(totalData / limit),
          currentPage: pageAsNumber,
          status,
        });
      }
    }

    // Nếu không có limit, trả về tất cả dữ liệu
    const status = await query;
    res.status(200).json({
      success: true,
      count: status.length,
      status,
    });
  }
);

// get one status  by ID

export const getStatusById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const statusId = req.params.id;
      const status = await StatusModel.findById(statusId);

      if (!status) {
        return next(new ErrorHandler("Status not found", 404));
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

export const deleteStatusById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const statusId = req.params.id;
      const status = await StatusModel.findByIdAndDelete(statusId);

      if (!status) {
        return next(new ErrorHandler("Status not found", 404));
      }

      res.status(200).json({
        success: true,
        message: "Status has been deleted",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
