import { prisma } from "../prisma/client.js";
import { notificationService } from "./notification.service.js";

export const getCategories = async () => {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          products: {
            where: { active: true },
          },
        },
      },
    },
  });

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

  categories.sort(byCustomOrder);

  return categories.map((cat: { id: number; name: string; _count: { products: number } }) => ({
    id: cat.id,
    name: cat.name,
    productCount: cat._count.products,
  }));
};

export const createCategory = async (name: string) => {
  const category = await prisma.category.create({
    data: {
      name,
    },
  });
  notificationService.notifyProductsUpdated();
  return category;
};
