import { Request, Response } from "express";
import * as categoryService from "../services/category.service.js";
import { mapCategorySummaryToDTO } from "../mappers/category.mapper.js";

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await categoryService.getCategories();
    res.json(categories.map(mapCategorySummaryToDTO));
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: "Name is required" });
      return;
    }
    const category = await categoryService.createCategory(name);
    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
