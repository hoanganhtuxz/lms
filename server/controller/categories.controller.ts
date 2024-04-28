import cloudinary from "cloudinary";
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middieware/catchAsyncError";
import { createCategorie } from "../services/categories.service";
import CategoryModel from "../models/categories.model";

/// upload categoris
interface iCategory {
  name: string;
  description?: string;
  avatar?: any;
}

export const uploadCategory = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as any;
      const name = data.name;
      const avatar = data.avatar;
      const isNameAlreadyExist = await CategoryModel.findOne({ name });

      if (isNameAlreadyExist) {
        return next(new ErrorHandler("Name category already exists", 400));
      }

      if (!name) {
        return next(new ErrorHandler("Please enter name category", 400));
      }

      if (avatar) {
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: "cateory",
        });

        data.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      createCategorie(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// eidt category

export const editCategory = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as iCategory;
      const name = data.name;
      const avatar = data.avatar;

      if (avatar) {
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: "cateory",
        });

        data.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      if (name) {
        const isNameExist = await CategoryModel.findOne({ name });
        if (isNameExist) {
          return next(new ErrorHandler("Name category already exists", 400));
        }
      }

      const categoryId = req.params.id;

      const category = await CategoryModel.findByIdAndUpdate(
        categoryId,
        { $set: data },
        { new: true }
      );

      res.status(201).json({
        success: true,
        category,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface QueryParams {
  keyword?: string;
  limit?: string;
  page?: string;
  sort?: "asc" | "desc";
}

export const getAllCategory = CatchAsyncError(
  async (
    req: Request<any, any, any, QueryParams>,
    res: Response,
    next: NextFunction
  ) => {
    const { keyword, sort = "desc", page = "1" } = req.query;

    let limit: any = req.query.limit;
    let query = CategoryModel.find();

    // Keyword
    if (keyword) {
      query = query.find({ name: { $regex: keyword, $options: "i" } });
    }

    // Sort
    const sortCriteria = sort === "desc" ? "-createdAt" : "createdAt";
    query = query.sort(sortCriteria);

    // Nếu có limit, áp dụng limit và phân trang
    if (limit) {
      limit = parseInt(limit, 10);
      if (!isNaN(limit) && limit > 0) {
        const pageAsNumber = parseInt(page, 10) || 1;
        const skip = (pageAsNumber - 1) * limit;

        // Đếm tổng số dữ liệu phù hợp để tính tổng số trang
        const totalData = await CategoryModel.countDocuments(query.getFilter());

        query = query.skip(skip).limit(limit);

        const categories = await query;

        return res.status(200).json({
          success: true,
          count: categories.length,
          totalPages: Math.ceil(totalData / limit),
          currentPage: pageAsNumber,
          categories,
        });
      }
    }

    // Nếu không có limit, trả về tất cả dữ liệu
    const categories = await query;
    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  }
);

// get one category by ID
export const getCategoryById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categoryId = req.params.id;
      const category = await CategoryModel.findById(categoryId);

      if (!category) {
        return next(new ErrorHandler("Category not found", 404));
      }

      res.status(200).json({
        success: true,
        category,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// delete byid

export const deleteCategoryById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categoryId = req.params.id;
      const category = await CategoryModel.findByIdAndDelete(categoryId);

      if (!category) {
        return next(new ErrorHandler("Category not found", 404));
      }

      res.status(200).json({
        success: true,
        message: "Category has been deleted",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
