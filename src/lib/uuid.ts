import { v4, v7 } from "uuid";

export function createIdInNumber(): number {
  // Generate a random UUID (version 4)
  const uuid = v4();
  return parseInt(uuid.replace(/-/g, ""), 16) % 1000000000;
}

export function generateUUID(): number {
  return parseInt(v4().replace(/-/g, ""), 16) % 1000000000;
}

export function createOrderId(): number {
  return parseInt(v7().replace(/-/g, ""), 16) % 1000000000;
}
