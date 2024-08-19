import express from "express";
import { singleUpload } from "../middlewares/multer.js";
import {
  deleteProduct,
  getAdminProducts,
  getAllCategories,
  getAllProducts,
  getLatestProducts,
  getSingleProduct,
  newProduct,
  updateProduct,
} from "../controllers/product.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

//  Create New Product - api/v1/product/new
app.post("/new", adminOnly, singleUpload, newProduct);
//  Get All Products with filters- api/v1/product/all
app.get("/all", getAllProducts);
//  Get Latest 5 Product - api/v1/product/latest
app.get("/latest", getLatestProducts);
//  Get All Product Categories - api/v1/product/categories
app.get("/categories", getAllCategories);
//  Get All Product - api/v1/product/admin-products
app.get("/admin-products", adminOnly, getAdminProducts);
//  Get Single Product - api/v1/product/:id
app
  .route("/:id")
  .get(getSingleProduct)
  .put(adminOnly, singleUpload, updateProduct)
  .delete(adminOnly, deleteProduct);

export default app;