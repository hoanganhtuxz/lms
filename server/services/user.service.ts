import { Request, Response, NextFunction } from "express";
import userModel from "../models/user.model";
import { redis } from "../utils/redis";
import { CatchAsyncError } from "../middieware/catchAsyncError";

export const getUserById = async (id: string, res: Response) => {
  const userJson = await redis.get(id);
  if (userJson) {
    const user = JSON.parse(userJson);
    res.status(201).json({
      success: true,
      user,
    });
  }
};


export const createAccount= CatchAsyncError(
  async (data: any, res: Response) => {
    const condition = await userModel.create(data);
    res.status(201).json({
      success: true,
      data: condition,
    });
  }
);

