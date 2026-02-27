import { v4 } from "uuid";

export function createIdInNumber(): number {
  // Generate a random UUID (version 4)
  const uuid = v4();
  return parseInt(uuid.replace(/-/g, ""), 16) % 1000000000;
}
