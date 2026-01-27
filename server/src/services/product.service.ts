import { prisma } from "../prisma/client.js";
import { logger } from "../utils/logger.js";
import { notificationService } from "./notification.service.js";

const CUSTOM_CATEGORY_ORDER = [
  "Pollos Asados",
  "Costillas y Patas Asadas",
  "Guarniciones",
  "Quesadillas y Burritos",
  "Platos Combinados",
  "Mojos y Salsas",
  "Bebidas",
];

const byCustomOrder = (a: { name: string }, b: { name: string }) => {
  const ia = CUSTOM_CATEGORY_ORDER.indexOf(a.name);
  const ib = CUSTOM_CATEGORY_ORDER.indexOf(b.name);
  const pa = ia === -1 ? Number.POSITIVE_INFINITY : ia;
  const pb = ib === -1 ? Number.POSITIVE_INFINITY : ib;
  if (pa !== pb) return pa - pb;
  return a.name.localeCompare(b.name);
};

export const getMenu = async () => {
  const cats = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      products: {
        where: {
          active: true,
        },
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          price: true,
          active: true,
          categoryId: true
        },
      },
    },
  });
  cats.sort(byCustomOrder);
  return cats;
};

export const getAllProductsGroupedByCategory = async () => {
  const cats = await prisma.category.findMany({
    include: {
      products: {
        orderBy: {
          name: "asc",
        },
      },
    },
  });
  cats.sort(byCustomOrder);
  return cats;
};

export const createProduct = async (data: { name: string; price: number; categoryId: number }) => {
  const product = await prisma.product.create({
    data: {
      ...data,
      active: true,
    },
  });
  notificationService.notifyProductsUpdated();
  return product;
};

export const updateProduct = async (id: number, data: { price?: number; active?: boolean; name?: string; categoryId?: number }) => {
  const before = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, active: true, price: true, categoryId: true },
  });
  const updated = await prisma.product.update({
    where: { id },
    data,
  });
  if (data.active !== undefined && before && before.active !== data.active) {
    logger.info(
      `AUDIT ProductActiveChange id=${id} name="${before.name}" from=${before.active} to=${data.active}`
    );
  }
  notificationService.notifyProductsUpdated();
  return updated;
};

export const deleteProduct = async (id: number) => {
  const result = await prisma.product.delete({
    where: { id },
  });
  notificationService.notifyProductsUpdated();
  return result;
};

export const getInactiveProductNames = async (): Promise<string[]> => {
  const products = await prisma.product.findMany({
    where: { active: false },
    select: { name: true },
    orderBy: { name: "asc" },
  });
  return products.map((p: {name : string }) => p.name);
};
