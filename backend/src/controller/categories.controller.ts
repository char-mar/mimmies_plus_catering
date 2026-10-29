import type { Request, Response, NextFunction } from "express";
import type { CreateCategoryDto, UpdateCategoryDto } from "../dto/category.dto";
import { categoryService } from "../service/categories.service";

type CategoryParams = {
  id: string;
};

export class CategoryController {
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = req.body as CreateCategoryDto;
      const category = await categoryService.create(dto);

      return res
        .status(201)
        .json({ message: "Category created successfully.", data: category });
    } catch (error) {
      next(error);
    }
  };

  findAll = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const categories = await categoryService.findAll();

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  };

  findById = async (
    req: Request<CategoryParams>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const category = await categoryService.findById(req.params.id);
      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (
    req: Request<CategoryParams>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const dto = req.body as UpdateCategoryDto;
      const category = await categoryService.update(req.params.id, dto);

      return res.status(200).json({
        message: "Category created successfully.",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (
    req: Request<CategoryParams>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await categoryService.delete(req.params.id);

      res.status(204).json({ message: "" });
    } catch (error: unknown) {
      next(error);
    }
  };
}

export const categoryController = new CategoryController();
