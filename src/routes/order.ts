import express from "express";

import { adminOnly } from "../middlewares/auth.js";
import {
  allOrder,
  deleteOrder,
  getSingleOrder,
  myOrder,
  newOrder,
  processOrder,
} from "../controllers/order.js";

const app = express.Router();

//  Create New Order - api/v1/order/new
app.post("/new", newOrder);
//  Get my Order - api/v1/order/my
app.get("/my", myOrder);
//  Get All Order - api/v1/order/all
app.get("/all", adminOnly, allOrder);
//  Get Order by id - api/v1/order/id
app
  .route("/:id")
  .get(getSingleOrder)
  .put(adminOnly, processOrder)
  .delete(adminOnly, deleteOrder);
export default app;