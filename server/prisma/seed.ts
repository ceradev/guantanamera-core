import { prisma } from "../src/prisma/client.js";

const menuData = {
  menuCategories: {
    pollos: {
      title: "Pollos Asados",
      items: [
        { name: "Pollo Entero", price: "8.50€" },
        { name: "Pollo Asado Entero con Papas", price: "11.80€" },
        { name: "Pollo Asado Entero con Papas Familiar", price: "14.00€" },
        { name: "Medio Pollo", price: "4.40€" },
        { name: "Medio Pollo con Papas Fritas", price: "8.00€" },
      ],
    },
    costillasYPatas: {
      title: "Costillas y Patas Asadas",
      items: [
        { name: "Medio Costillar", price: "13.50€" },
        { name: "Costillar Entero", price: "26.00€" },
        { name: "Pata Asada", price: "20.00€ / 1Kg" },
        { name: "Pata Asada Entera", price: "130€" },
      ],
    },
    guarniciones: {
      title: "Guarniciones",
      items: [
        { name: "Papas Fritas 'Guantanamera'", price: "3.50€" },
        { name: "Papas Fritas Familiar", price: "5.50€" },
        { name: "Papas Campesinas", price: "3.90€" },
        { name: "Croquetas de Pollo", price: "5.00€" },
        { name: "Pan Horneado", price: "0.80€" },
      ],
    },
    quesadillasYBurritos: {
      title: "Quesadillas y Burritos",
      items: [
        { name: "Quesadilla de Pollo", price: "6.00€" },
        { name: "Quesadilla de pollo con refresco", price: "6.80€" },
        { name: "Burrito de Pollo", price: "5.00€" },
        { name: "Burrito de Pollo con refresco", price: "5.80€" },
      ],
    },
  },
  bebidas: [
    { name: "Coca-Cola Original (33cl)", price: "1.50€" },
    { name: "Coca-Cola Zero (33cl)", price: "1.50€" },
    { name: "Fanta Naranja (33cl)", price: "1.50€" },
    { name: "Fanta Limón (33cl)", price: "1.50€" },
    { name: "Sprite (33cl)", price: "1.50€" },
    { name: "Coca-Cola Original (1,5L)", price: "3.00€" },
    { name: "Coca-Cola Zero (1,5L)", price: "3.00€" },
    { name: "Fanta Naranja (1,5L)", price: "3.00€" },
    { name: "Agua Mineral Natural (33cl)", price: "1.00€" },
    { name: "Nestea de Mango Piña (33cl)", price: "1.80€" },
    { name: "Aquarius de Naranja (33cl)", price: "1.80€" },
    { name: "Aquarius de Limón (33cl)", price: "1.80€" },
    { name: "Nestea de Mango Piña (1,5L)", price: "3.50€" },
    { name: "Aquarius de Naranja (1,5L)", price: "3.50€" },
    { name: "Clipper de Fresa (50cl)", price: "1.80€" },
    { name: "Seven Up de Limón (50cl)", price: "1.80€" },
    { name: "Cerveza Dorada", price: "1.70€" },
    { name: "Cerveza Heineken", price: "1.50€" },
  ],
  mojos: [
    { name: "Mojo Rojo", price: "1.20€" },
    { name: "Mojo Verde", price: "1.20€" },
    { name: "Alioli Tradicional", price: "1.20€" },
  ],
  comboMeals: [
    { name: "Menu Pollo", price: "14.50€" },
    { name: "Menu Medio Pollo", price: "8.80€" },
    { name: "Menu Burrito", price: "7.50€" },
  ],
};

function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  // Extract numeric part from string like "8.50€" or "20.00€ / 1Kg"
  const match = priceStr.match(/(\d+[.,]?\d*)/);
  if (match) {
    return parseFloat(match[0].replace(",", "."));
  }
  return 0;
}

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Process Menu Categories
  for (const [key, categoryData] of Object.entries(menuData.menuCategories)) {
    const categoryName = categoryData.title;
    console.log(`Processing Category: ${categoryName}`);

    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: {
        name: categoryName,
      },
    });

    for (const item of categoryData.items) {
      console.log(`  - Processing Product: ${item.name}`);
      await prisma.product.upsert({
        where: { name: item.name },
        update: {
          price: parsePrice(item.price),
          active: true,
          categoryId: category.id,
        },
        create: {
          name: item.name,
          price: parsePrice(item.price),
          active: true,
          categoryId: category.id,
        },
      });
    }
  }

  // 2. Process Bebidas (Grouped into 'Bebidas')
  if (menuData.bebidas && menuData.bebidas.length > 0) {
    const categoryName = "Bebidas";
    console.log(`Processing Category: ${categoryName}`);

    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: {
        name: categoryName,
      },
    });

    for (const item of menuData.bebidas) {
      console.log(`  - Processing Product: ${item.name}`);
      await prisma.product.upsert({
        where: { name: item.name },
        update: {
          price: parsePrice(item.price),
          active: true,
          categoryId: category.id,
        },
        create: {
          name: item.name,
          price: parsePrice(item.price),
          active: true,
          categoryId: category.id,
        },
      });
    }
  }

  // 3. Process Mojos (Grouped into 'Mojos')
  if (menuData.mojos && menuData.mojos.length > 0) {
    const categoryName = "Mojos";
    console.log(`Processing Category: ${categoryName}`);

    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: {
        name: categoryName,
      },
    });

    for (const item of menuData.mojos) {
      console.log(`  - Processing Product: ${item.name}`);
      await prisma.product.upsert({
        where: { name: item.name },
        update: {
          price: parsePrice(item.price),
          active: true,
          categoryId: category.id,
        },
        create: {
          name: item.name,
          price: parsePrice(item.price),
          active: true,
          categoryId: category.id,
        },
      });
    }
  }

  // 4. Process Combo Meals (Grouped into 'Combos')
  if (menuData.comboMeals && menuData.comboMeals.length > 0) {
    const categoryName = "Combos";
    console.log(`Processing Category: ${categoryName}`);

    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: {
        name: categoryName,
      },
    });

    for (const item of menuData.comboMeals) {
      console.log(`  - Processing Product: ${item.name}`);
      await prisma.product.upsert({
        where: { name: item.name },
        update: {
          price: parsePrice(item.price),
          active: true,
          categoryId: category.id,
        },
        create: {
          name: item.name,
          price: parsePrice(item.price),
          active: true,
          categoryId: category.id,
        },
      });
    }
  }

  // 5. Process Default Settings
  const defaultSettings = [
    { key: "orders_enabled", value: "true", type: "boolean" },
    { key: "prep_time", value: "15", type: "number" },
    { key: "store_name", value: "Guantanamera", type: "string" },
    { key: "store_address", value: "C. Castro, 7, 38611 San Isidro, Santa Cruz de Tenerife", type: "string" },
    { key: "store_phone", value: "+34 922 17 30 39", type: "string" },
    { 
      key: "weekly_schedule", 
      value: JSON.stringify([
        { day: 1, name: "Lunes", open: "09:00", close: "18:00", enabled: true },
        { day: 2, name: "Martes", open: "09:00", close: "17:00", enabled: false },
        { day: 3, name: "Miércoles", open: "09:00", close: "17:00", enabled: false },
        { day: 4, name: "Jueves", open: "09:00", close: "18:00", enabled: true },
        { day: 5, name: "Viernes", open: "09:00", close: "18:00", enabled: true },
        { day: 6, name: "Sábado", open: "09:00", close: "17:00", enabled: true },
        { day: 0, name: "Domingo", open: "09:00", close: "17:00", enabled: true },
      ]), 
      type: "json" 
    },
  ];

  console.log("Processing Default Settings...");
  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log("✅ Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
