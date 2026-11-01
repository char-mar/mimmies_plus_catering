import express from "express";
import cors from "cors";

import categoryRoute from "./routes/category.route";
import menuRoute from "./routes/menu.route";
import imageRoutes from "./routes/image.routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { UPLOAD_ROOT } from "./config/storage.config";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "App is in good health",
  });
});

app.use("/uploads", express.static(UPLOAD_ROOT));

app.use("/api/v1/categories", categoryRoute);
app.use("/api/v1/menu", menuRoute);
app.use("/api/v1/images", imageRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
