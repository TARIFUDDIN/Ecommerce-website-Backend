import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "./error.js";

export const adminOnly = TryCatch(async (req, res, next) => {
  const { id } = req.query;
  if (!id) return next(new ErrorHandler("You need to Login First", 401));

  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler("Wrong Id Provided", 401));
  if (user.role !== "admin")
    return next(next(new ErrorHandler("You are not a Admin", 403)));
  next();
});