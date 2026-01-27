import { Request, Response } from "express";
import * as orderService from "../services/order.service.js";
import { OrderStatus } from "@prisma/client";
import { mapOrderToDTO, mapPaginatedOrdersToDTO } from "../mappers/order.mapper.js";
import type { CreateOrderRequestDTO } from "../dtos/order.dto.js";

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { customerName, customerPhone, pickupTime, items } = (req.validated?.body ?? req.body) as CreateOrderRequestDTO;

    if (!customerName || !pickupTime) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    if (!items || items.length === 0) {
       res.status(400).json({ error: "Order must contain at least one item" });
       return;
    }

    const order = await orderService.createOrder({
      customerName,
      customerPhone,
      pickupTime,
      items,
    });

    res.status(201).json(mapOrderToDTO(order));
  } catch (error: any) {
    console.error("Error creating order:", error);
    
    // Known business logic errors should return 400
    const knownErrors = [
      "invalid or inactive",
      "phone required",
      "Store is closed",
      "Orders are currently disabled",
      "Pickup time must be",
      "Minimum preparation time",
      "at least one item"
    ];

    if (knownErrors.some(msg => error.message.includes(msg))) {
        res.status(400).json({ error: error.message });
        return;
    }
    
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { status, page, limit } = req.validated?.query ?? req.query;

    const result = await orderService.getOrders(status, page, limit);
    res.json(mapPaginatedOrdersToDTO(result));
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const id = parseInt((req.validated?.params?.id ?? req.params.id) as string);
    const { status } = req.validated?.body ?? req.body;

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    if (!Object.values(OrderStatus).includes(status)) {
       res.status(400).json({ error: "Invalid status value" });
       return;
    }

    const updatedOrder = await orderService.updateOrderStatus(id, status as OrderStatus);
    res.json(mapOrderToDTO(updatedOrder));

  } catch (error: any) {
    console.error("Error updating order status:", error);
    if (error.message === "Order not found") {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes("Invalid status transition") || error.message.includes("Cannot change status")) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const id = parseInt((req.validated?.params?.id ?? req.params.id) as string);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const order = await orderService.getOrderById(id);

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json(mapOrderToDTO(order));
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
