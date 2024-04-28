import { Response, NextFunction, Request } from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middieware/catchAsyncError";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendEmail from "../utils/sendMail";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import { redis } from "../utils/redis";
import { createAccount, getUserById } from "../services/user.service";
import cloudinary from "cloudinary";

require("dotenv").config();

// register user
interface IRegistratiionBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registrationUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;
      const isEmailExist = await userModel.findOne({ email });
      if (isEmailExist) {
        return next(new ErrorHandler("Email already exist", 400));
      }
      const user: IRegistratiionBody = {
        name,
        email,
        password,
      };
      const activationToken = createActivationToken(user);
      const activationCode = activationToken.activationCode;
      const data = { user: { name: user.name }, activationCode };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );
      try {
        await sendEmail({
          email: user.email,
          subject: "Activate your account",
          template: "activation-mail.ejs",
          data,
        });
        res.status(201).json({
          success: true,
          message: `Please check your email: ${user.email} to activate account`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IActivationoken {
  token: String;
  activationCode: String;
}

export const createActivationToken = (user: any): IActivationoken => {
  const activationCode = Math.floor(1000 * Math.random() * 9000).toString();
  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );
  return { token, activationCode };
};

// activate user

interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_code, activation_token } =
        req.body as IActivationRequest;
      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("Invaild activation code", 400));
      }
      const { name, email, password } = newUser.user;
      const existUser = await userModel.findOne({ email });
      if (existUser) {
        return next(new ErrorHandler("Email already exist", 400));
      }
      const user = await userModel.create({
        name,
        email,
        password,
      });
      res.status(201).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// login user
interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;
      if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
      }
      const user = await userModel.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler("Invatid email or password", 400));
      }

      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invatid email or password", 400));
      }
      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// logout user
export const logoutUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      const userId = req.user?._id || "";
      redis.del(userId);
      res.status(200).json({
        success: true,
        message: "Logout successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update access token
export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token as string;
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string
      ) as JwtPayload;

      const message = "Cloud not refresh token";
      if (!decoded) {
        return next(new ErrorHandler(message, 400));
      }

      const session = await redis.get(decoded.id as string);
      if (!session) {
        return next(new ErrorHandler(message, 400));
      }

      const user = JSON.parse(session);
      const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN, {
        expiresIn: "5m",
      });

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN,
        {
          expiresIn: "3d",
        }
      );

      req.user = user;

      res.cookie("access_token", accessToken, accessTokenOptions);
      res.cookie("refresh_token", refreshToken, refreshTokenOptions);

      res.status(200).json({
        status: "succes",
        accessToken,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//  get user info

export const getUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      getUserById(userId, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// social auth
interface ISocialAuth {
  email: string;
  name: string;
  avatar: string;
}

export const socialAuth = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, avatar } = req.body as ISocialAuth;
      const user = await userModel.findOne({ email });
      if (!user) {
        const newUser = await userModel.create({ email, name, avatar });
        sendToken(newUser, 200, res);
      } else {
        sendToken(user, 200, res);
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//update user
interface IUpdateUserInfor {
  name?: string;
  email: string;
}

export const updateUserInfor = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email } = req.body as IUpdateUserInfor;
      const userId = req.user?._id;
      const user = await userModel.findById(userId);

      if (user && email) {
        const isEmailExist = await userModel.findOne({ email });
        if (isEmailExist) {
          return next(new ErrorHandler("Email already exist ", 4000));
        }
        user.email = email;
      }

      if (name && user) {
        user.name = name;
      }

      await user?.save();
      await redis.set(userId, JSON.stringify(user));
      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update password

interface IUpdatePassword {
  oldPassword: string;
  newPassword: string;
}
export const updatePassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as IUpdatePassword;

      if (!oldPassword || !newPassword) {
        return next(
          new ErrorHandler(
            "Please enter your new password and old password",
            400
          )
        );
      }

      const user = await userModel.findById(req.user?._id).select("+password");

      if (user?.password === undefined) {
        return next(new ErrorHandler("Invailid user", 400));
      }
      const isPasswordMatch = await user?.comparePassword(oldPassword);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invailid old password", 400));
      }

      user.password = newPassword;
      await user?.save();
      await redis.set(req.user?._id, JSON.stringify(user));

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update avatar
interface IupdateAvatar {
  avatar: string;
}

export const updateProfileAvatar = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body as IupdateAvatar;
      const userId = req.user?._id;

      const user = await userModel.findById(userId);

      if (user && avatar) {
        // if we have avatar
        if (user?.avatar?.public_id) {
          // first delete images
          await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
          });

          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        } else {
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
          });

          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        }

        await user?.save();
        await redis.set(userId, JSON.stringify(user));

        res.status(200).json({
          success: true,
          user,
        });
      }
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
  date?: any;
  month?: any;
  year?: any;
  price?: "asc" | "desc";
  quantity?: "asc" | "desc";
}

export const getAllUser = CatchAsyncError(
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
    let query = userModel.find();

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

        const totalData = await userModel.countDocuments(query.getFilter());

        query = query.skip(skip).limit(limit);

        const user = await query;

        return res.status(200).json({
          success: true,
          count: user.length,
          totalPages: Math.ceil(totalData / limit),
          currentPage: pageAsNumber,
          results: user,
        });
      }
    }

    // Nếu không có limit, trả về tất cả dữ liệu
    const user = await query;
    res.status(200).json({
      success: true,
      count: user.length,
      results: user,
    });
  }
);



export const editUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id;
      const data = req.body as any;

      // Kiểm tra xem user có tồn tại hay không
      const user = await userModel.findById(userId);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      // Cập nhật thông tin user
      user.name = data.name || user.name;
      user.email = data.email || user.email;
      
      // Kiểm tra xem password có được cập nhật hay không
      if (data.password) {
        user.password = data.password;
      }
      
      user.role = data.role || user.role;

      await user.save();

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const deleteUserById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id;
      const user = await userModel.findByIdAndDelete(userId);

      if (!user) {
        return next(new ErrorHandler("Status not found", 404));
      }
      res.status(200).json({
        success: true,
        message: "Condition has been deleted",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const uploadUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as any;
      const name = data.name;
      const email = data.email;
      const password = data.password;
      const iEmailAlreadyExist = await userModel.findOne({ email });

      if (iEmailAlreadyExist) {
        return next(new ErrorHandler("Email already exists", 400));
      }

 if (!password) {
        return next(new ErrorHandler("Please enter password Condition", 400));
      }
      if (!name) {
        return next(new ErrorHandler("Please enter name Condition", 400));
      }

      if (!email) {
        return next(new ErrorHandler("Please enter email Condition", 400));
      }

      createAccount(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

