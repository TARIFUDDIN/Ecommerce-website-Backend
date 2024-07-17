import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "./error.js";

// Middleware to make sure only admin is allowed
export const adminOnly = TryCatch(async (req, res, next) => {
  const { id } = req.query;

  if (!id) return next(new ErrorHandler("Saale Login Kr phle", 401));

  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler("Saale Fake ID Deta Hai", 401));
  if (user.role !== "admin")
    return next(new ErrorHandler("Saale Aukat Nhi Hai Teri", 403));

  next();
});

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true
}));

// Your routes here

app.listen(4000, () => {
  console.log('Server is running on port 4000');
});
