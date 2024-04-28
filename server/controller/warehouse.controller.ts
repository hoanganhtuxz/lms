import cloudinary from "cloudinary";
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middieware/catchAsyncError";
import ProductModel from "../models/warehouse.model";
import { createProduct } from "../services/warehouse.service";

///  interface  Product
interface iProduct {
  name: string;
  description?: string;
  avatar?: any;
  quantity: Number;
  price: Number;
  category: any;
}

export const uploadProduct = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as any;
      const name = data.name;
      const categoryId = req.body.category;
      const avatar = data.avatar;
      const isNameAlreadyExist = await ProductModel.findOne({ name });

      if (isNameAlreadyExist) {
        return next(new ErrorHandler("Name Product already exists", 400));
      }

      if (!name) {
        return next(new ErrorHandler("Please enter name Product", 400));
      }

      if (!categoryId) {
        return next(new ErrorHandler("Plase chonse category product", 400));
      }
      if (avatar) {
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: "product",
        });

        data.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      createProduct(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// eidt Product

export const editProduct = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const name = data.name;
      const categoryId = req.body.category;
      const avatar = data.avatar;
      const ProductId = req.params.id;

      // const oldProduct = await ProductModel.findOne({ ProductId });

      if (avatar) {
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: "product",
        });

        data.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      // if (name) {
      //   const isNameExist = await ProductModel.findOne({ name });
      //   if (isNameExist) {
      //     return next(new ErrorHandler("Name Product already exists", 400));
      //   }
      // }

      if (!categoryId) {
        return next(new ErrorHandler("Plase chonse category product", 400));
      }

      const product = await ProductModel.findByIdAndUpdate(
        ProductId,
        { $set: data },
        { new: true }
      );

      res.status(201).json({
        success: true,
        product,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get all Product

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

export const getAllProduct = CatchAsyncError(
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
    let query = ProductModel.find();

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

        const totalData = await ProductModel.countDocuments(query.getFilter());

        query = query.skip(skip).limit(limit);

        const products = await query;

        return res.status(200).json({
          success: true,
          count: products.length,
          totalPages: Math.ceil(totalData / limit),
          currentPage: pageAsNumber,
          products,
        });
      }
    }

    // Nếu không có limit, trả về tất cả dữ liệu
    const product = await query;
    res.status(200).json({
      success: true,
      count: product.length,
      product,
    });
  }
);

// get one Product by ID
export const getProductById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ProductId = req.params.id;
      const Product = await ProductModel.findById(ProductId);

      if (!Product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      res.status(200).json({
        success: true,
        Product,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// delete byid

export const deleteProductById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ProductId = req.params.id;
      const Product = await ProductModel.findByIdAndDelete(ProductId);

      if (!Product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      res.status(200).json({
        success: true,
        message: "Product has been deleted",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
