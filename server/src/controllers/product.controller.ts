import { Request, Response } from "express";
import * as productService from "../services/product.service.js";
import { mapCategoryWithProductsToDTO } from "../mappers/category.mapper.js";
import { mapProductToDTO } from "../mappers/product.mapper.js";

export const getMenu = async (_req: Request, res: Response) => {
  try {
    const menu = await productService.getMenu();
    const dto = menu.map(mapCategoryWithProductsToDTO);
    res.json(dto);
  } catch (error) {
    console.error("Error fetching menu:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAdminMenu = async (_req: Request, res: Response) => {
  try {
    const menu = await productService.getAllProductsGroupedByCategory();
    const dto = menu.map(mapCategoryWithProductsToDTO);
    res.json(dto);
  } catch (error) {
    console.error("Error fetching admin menu:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, price, categoryId } = req.validated?.body ?? req.body;
    const product = await productService.createProduct({ name, price: parseFloat(price), categoryId: parseInt(categoryId) });
    res.status(201).json(mapProductToDTO(product));
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.validated?.params ?? req.params;
    const { price, active, name, categoryId } = req.validated?.body ?? req.body;
    const product = await productService.updateProduct(parseInt(id), { 
      price: price !== undefined ? parseFloat(price) : undefined, 
      active,
      name,
      categoryId: categoryId !== undefined ? parseInt(categoryId) : undefined
    });
    res.json(mapProductToDTO(product));
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await productService.deleteProduct(parseInt(id));
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateProductActive = async (req: Request, res: Response) => {
  try {
    const { id } = req.validated?.params ?? req.params;
    const { active } = req.validated?.body ?? req.body;
    const product = await productService.updateProduct(parseInt(id), { active });
    res.json(mapProductToDTO(product));
  } catch (error) {
    console.error("Error updating product active:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getInactiveProductNames = async (_req: Request, res: Response) => {
  try {
    const names = await productService.getInactiveProductNames();
    res.json(names);
  } catch (error) {
    console.error("Error fetching inactive product names:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
