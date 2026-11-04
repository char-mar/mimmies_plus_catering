import type { Request, Response, NextFunction } from "express";

import { analyticsService } from "../service/analytics.service";
import { analyticsQuerySchema } from "../dto/analytics.dto";
import { parseWith } from "../common/utils/validation";

export class AnalyticsController {
  overview = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { days } = parseWith(analyticsQuerySchema, req.query);
      const overview = await analyticsService.overview(days);

      res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const analyticsController = new AnalyticsController();
