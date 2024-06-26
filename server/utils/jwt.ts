import { Response } from "express";
import { IUser } from "../models/user.model";
import { redis } from "./redis";

require("dotenv").config();

interface ITokenOptions {
  expries: Date;
  maxAge: number;
  httpOnl: boolean;
  samSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}
// parse enviromnt validate
const accessTokenExpire = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE || "300",
  10
);
const refrshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || "1200",
  10
);
//otpions for cookie
export const accessTokenOptions: ITokenOptions = {
  expries: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
  maxAge: accessTokenExpire * 60 * 60 * 1000,
  httpOnl: true,
  samSite: "lax",
};

export const refreshTokenOptions: ITokenOptions = {
  expries: new Date(Date.now() + refrshTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: accessTokenExpire * 24 * 60 * 60 * 1000,
  httpOnl: true,
  samSite: "lax",
};

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.SignAccesTolen();
  const refreshToken = user.SignRefreshTolen();

  // upload session to redis
  redis.set(user._id, JSON.stringify(user) as any);

  // only set sure to in production
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
  }
  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);
  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};
