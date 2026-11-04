import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import categoryRoute from "./routes/category.route";
import menuRoute from "./routes/menu.route";
import imageRoutes from "./routes/image.routes";
import authRoute from "./routes/auth.route";
import userRoute from "./routes/user.route";
import orderRoute from "./routes/order.route";
import paymentRoute from "./routes/payment.route";
import paystackWebhookRoute from "./routes/payment-webhook.route";
import analyticsRoute from "./routes/analytics.route";
import contactRoute from "./routes/contact.route";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { UPLOAD_ROOT } from "./config/storage.config";
import { env } from "./config/env";

export const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.includes("*") ? true : allowedOrigins,
    credentials: true,
  }),
);

if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Paystack signs the raw request bytes, so its webhook is mounted before the
// JSON body parser.
app.use("/api/v1/payments/webhook", paystackWebhookRoute);

app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "App is in good health",
  });
});

app.use("/uploads", express.static(UPLOAD_ROOT));

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/orders", orderRoute);
app.use("/api/v1/payments", paymentRoute);
app.use("/api/v1/categories", categoryRoute);
app.use("/api/v1/menu", menuRoute);
app.use("/api/v1/images", imageRoutes);
app.use("/api/v1/analytics", analyticsRoute);
app.use("/api/v1/contacts", contactRoute);

app.use(notFoundHandler);
app.use(errorHandler);
