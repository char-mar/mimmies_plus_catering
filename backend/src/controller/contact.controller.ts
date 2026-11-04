import type { Request, Response, NextFunction } from "express";

import { contactService } from "../service/contact.service";
import {
  createContactSchema,
  listContactsQuerySchema,
  updateContactStatusSchema,
} from "../dto/contact.dto";
import { parseUuid, parseWith } from "../common/utils/validation";

export class ContactController {
  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = parseWith(createContactSchema, req.body);
      const contact = await contactService.create(dto);

      res.status(201).json({
        success: true,
        message: "Thanks for reaching out. We will get back to you shortly.",
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  };

  findAll = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = parseWith(listContactsQuerySchema, req.query);
      const result = await contactService.findAll(query);

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { status } = parseWith(updateContactStatusSchema, req.body);
      const contact = await contactService.updateStatus(
        parseUuid(req.params.id, "Contact id"),
        status,
      );

      res.status(200).json({
        success: true,
        message: "Contact status updated successfully.",
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await contactService.delete(parseUuid(req.params.id, "Contact id"));

      res.status(204).json({ message: "" });
    } catch (error) {
      next(error);
    }
  };
}

export const contactController = new ContactController();
