import express from "express";
import cors from "cors";

export const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "App is in good health",
  });
});
