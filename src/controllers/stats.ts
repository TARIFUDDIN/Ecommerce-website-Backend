import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import {
  calculatePercentage,
  getChartData,
  getInventories,
} from "../utils/features.js";

export const getDashboardStats = TryCatch(async (req, res, next) => {
  let stats = {};
  const key = "admin-stats";
  if (myCache.has(key)) stats = JSON.parse(myCache.get(key) as string);
  else {
    const today = new Date();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const currentMonth = {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: today,
    };
    const lastMonth = {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: new Date(today.getFullYear(), today.getMonth(), 0),
    };
    const currentMonthProductsPromise = Product.find({
      createdAt: {
        $gte: currentMonth.start,
        $lte: currentMonth.end,
      },
    });
    const lastMonthProductsPromise = Product.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const currentMonthUsersPromise = User.find({
      createdAt: {
        $gte: currentMonth.start,
        $lte: currentMonth.end,
      },
    });
    const lastMonthUsersPromise = User.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const currentMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: currentMonth.start,
        $lte: currentMonth.end,
      },
    });
    const lastMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });
    const lastSixMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    });

    const latestTransactionsPromise = Order.find({})
      .select(["orderItems", "discount", "total", "status"])
      .limit(4);
    const [
      currentMonthProducts,
      currentMonthUsers,
      currentMonthOrders,
      lastMonthProducts,
      lastMonthUsers,
      lastMonthOrders,
      productsCount,
      usersCount,
      allOrders,
      lastSixMonthOrders,
      categories,
      femaleUsersCount,
      latestTransactions,
    ] = await Promise.all([
      currentMonthProductsPromise,
      currentMonthUsersPromise,
      currentMonthOrdersPromise,
      lastMonthProductsPromise,
      lastMonthUsersPromise,
      lastMonthOrdersPromise,
      Product.countDocuments(),
      User.countDocuments(),
      Order.find({}).select("total"),
      lastSixMonthOrdersPromise,
      Product.distinct("category"),
      User.countDocuments({ gender: "female" }),
      latestTransactionsPromise,
    ]);
    const currentMonthRevenue = currentMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );
    const lastMonthRevenue = lastMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );
    const changedPercent = {
      product: calculatePercentage(
        currentMonthProducts.length,
        lastMonthProducts.length
      ),
      user: calculatePercentage(
        currentMonthUsers.length,
        lastMonthUsers.length
      ),
      order: calculatePercentage(
        currentMonthOrders.length,
        lastMonthOrders.length
      ),
      revenue: calculatePercentage(currentMonthRevenue, lastMonthRevenue),
    };
    const revenue = allOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );
    const counts = {
      product: productsCount,
      user: usersCount,
      order: allOrders.length,
      revenue,
    };

    const orderMonthCounts = new Array(6).fill(0);
    const orderMonthlyRevenue = new Array(6).fill(0);

    lastSixMonthOrders.forEach((order) => {
      const creationDate = order.createdAt;
      const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

      if (monthDiff < 6) {
        orderMonthCounts[6 - monthDiff - 1] += 1;
        orderMonthlyRevenue[6 - monthDiff - 1] += order.total;
      }
    });
    const chart = {
      order: orderMonthCounts,
      revenue: orderMonthlyRevenue,
    };

    const categoryCount = await getInventories({
      categories,
      productsCount,
    });

    const userRatio = {
      male: usersCount - femaleUsersCount,
      female: femaleUsersCount,
    };

    const modifiedLatestTransaction = latestTransactions.map((i) => ({
      _id: i._id,
      discount: i.discount,
      amount: i.total,
      quantity: i.orderItems.length,
      status: i.status,
    }));
    stats = {
      changedPercent,
      counts,
      chart,
      categoryCount,
      userRatio,
      modifiedLatestTransaction,
    };

    myCache.set(key, JSON.stringify(stats));
  }
  return res.status(200).json({
    success: true,
    stats,
  });
});
export const getPieCharts = TryCatch(async (req, res, next) => {
  let charts;
  const key = "admin-pie-charts";
  if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
  else {
    const allOrderPromise = Order.find({}).select([
      "total",
      "discount",
      "subtotal",
      "tax",
      "shippingCharges",
    ]);
    const [
      processingOrder,
      shippedOrder,
      deliveredOrder,
      categories,
      productsCount,
      productsOutOfStock,
      allOrders,
      allUsers,
      adminUsers,
      customerUsers,
    ] = await Promise.all([
      Order.countDocuments({ status: "Processing" }),
      Order.countDocuments({ status: "Shipped" }),
      Order.countDocuments({ status: "Delivered" }),
      Product.distinct("category"),
      Product.countDocuments(),
      Product.countDocuments({ stock: 0 }),
      allOrderPromise,
      User.find({}).select(["dob"]),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
    ]);

    const orderFullfillment = {
      processing: processingOrder,
      shipped: shippedOrder,
      delivered: deliveredOrder,
    };
    const productCategoriesRatio = await getInventories({
      categories,
      productsCount,
    });

    const stockAvialability = {
      inStock: productsCount - productsOutOfStock,
      outOfStock: productsOutOfStock,
    };
    const totalGrossIncome = allOrders.reduce(
      (prev, order) => prev + (order.total || 0),
      0
    );
    const totalDiscount = allOrders.reduce(
      (prev, order) => prev + (order.discount || 0),
      0
    );
    const totalProductionCost = allOrders.reduce(
      (prev, order) => prev + (order.shippingCharges || 0),
      0
    );
    const totalBurnt = allOrders.reduce(
      (prev, order) => prev + (order.tax || 0),
      0
    );
    const totalMarketingCost = Math.round(totalGrossIncome * (30 / 100));
    const netMargin =
      totalGrossIncome -
      totalDiscount -
      totalProductionCost -
      totalBurnt -
      totalMarketingCost;
    const revenueDistribution = {
      netMargin,
      totalDiscount,
      totalProductionCost,
      totalBurnt,
      totalMarketingCost,
    };
    const usersAgeGroup = {
      teen: allUsers.filter((i) => i.age < 20).length,
      adult: allUsers.filter((i) => i.age >= 20 && i.age < 40).length,
      old: allUsers.filter((i) => i.age >= 40).length,
    };
    const adminsAndUsersCount = {
      admin: adminUsers,
      user: customerUsers,
    };
    charts = {
      orderFullfillment,
      productCategoriesRatio,
      stockAvialability,
      revenueDistribution,
      adminsAndUsersCount,
      usersAgeGroup,
    };

    myCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json({
    success: true,
    charts,
  });
});
export const getBarCharts = TryCatch(async (req, res, next) => {
  let charts;
  const key = "admin-bar-charts";

  if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
  else {
    const today = new Date();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const lastSixMonthProductsPromise = Product.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");
    const lastSixMonthUsersPromise = User.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");
    const lastTwelveMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: twelveMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");
    const [lastSixMonthProducts, lastSixMonthUsers, lastTwelveMonthOrders] =
      await Promise.all([
        lastSixMonthProductsPromise,
        lastSixMonthUsersPromise,
        lastTwelveMonthOrdersPromise,
      ]);
    const productCount = getChartData({
      length: 6,
      today,
      docArr: lastSixMonthProducts,
    });
    const usersCount = getChartData({
      length: 6,
      today,
      docArr: lastSixMonthUsers,
    });
    const orderCount = getChartData({
      length: 12,
      today,
      docArr: lastTwelveMonthOrders,
    });
    charts = {
      users: usersCount,
      products: productCount,
      orders: orderCount,
    };
    myCache.set(key, JSON.stringify(charts));
  }
  return res.status(200).json({
    success: true,
    charts,
  });
});
export const getLineCharts = TryCatch(async (req, res, next) => {
  let charts;
  const key = "admin-line-charts";

  if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
  else {
    const today = new Date();

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const baseQuery = {
      createdAt: {
        $gte: twelveMonthsAgo,
        $lte: today,
      },
    };

    const [
      lastTwelveMonthProducts,
      lastTwelveMonthUsers,
      lastTwelveMonthOrders,
    ] = await Promise.all([
      Product.find(baseQuery).select("createdAt"),
      User.find(baseQuery).select("createdAt"),
      Order.find(baseQuery).select(["createdAt", "discount", "total"]),
    ]);
    const productCount = getChartData({
      length: 12,
      today,
      docArr: lastTwelveMonthProducts,
    });
    const usersCount = getChartData({
      length: 12,
      today,
      docArr: lastTwelveMonthUsers,
    });
    const discount = getChartData({
      length: 12,
      today,
      docArr: lastTwelveMonthOrders,
      property: "discount",
    });
    const revenue = getChartData({
      length: 12,
      today,
      docArr: lastTwelveMonthOrders,
      property: "total",
    });
    charts = {
      users: usersCount,
      products: productCount,
      discount,
      revenue,
    };
    myCache.set(key, JSON.stringify(charts));
  }
  return res.status(200).json({
    success: true,
    charts,
  });
});