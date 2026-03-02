import { prisma } from "../prisma/client.js";

export interface CreateSupplierInput {
  name: string;
  fiscalId?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export async function createSupplier(data: CreateSupplierInput) {
  return (prisma.supplier as any).create({
    data,
  });
}

export async function getSuppliers() {
  return (prisma.supplier as any).findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function getSupplierById(id: string) {
  return (prisma.supplier as any).findUnique({
    where: { id },
  });
}

export async function updateSupplier(id: string, data: Partial<CreateSupplierInput>) {
  return (prisma.supplier as any).update({
    where: { id },
    data,
  });
}

export async function deleteSupplier(id: string) {
  return (prisma.supplier as any).delete({
    where: { id },
  });
}
