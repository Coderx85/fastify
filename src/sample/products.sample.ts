import { TProduct } from "@/db/schema";

export const productsSample: TProduct[] = [
  {
    id: 1,
    name: "Classic Reader",
    description: "High-quality e-reader for book lovers.",
    price: 12900,
    category: "Electronics",
    productId: 101,
  },
  {
    id: 2,
    name: "Urban Tee",
    description: "Comfortable cotton t-shirt for daily wear.",
    price: 2500,
    category: "Clothing",
    productId: 102,
  },
  {
    id: 3,
    name: "Mastering TypeScript",
    description: "Complete guide to advanced TypeScript patterns.",
    price: 4500,
    category: "Books",
    productId: 103,
  },
  {
    // id: 4,
    id: 4,
    name: "Nordic Chair",
    description: "Minimalist wooden chair for modern interiors.",
    price: 8900,
    category: "Furniture",
    productId: 104,
  },
  {
    id: 5,
    name: "Pro Headphones",
    description: "Noise-canceling headphones for professional audio.",
    price: 29900,
    category: "Electronics",
    productId: 105,
  },
  {
    id: 6,
    name: "Wool Scarf",
    description: "Warm and cozy scarf for winter seasons.",
    price: 3200,
    category: "Clothing",
    productId: 106,
  },
  {
    id: 7,
    name: "Recipe Collection",
    description: "Delicious recipes from around the world.",
    price: 3800,
    category: "Books",
    productId: 107,
  },
];

// Counters for generating new IDs (for in-memory operations)
export let nextId = 8;
export let nextProductId = 108;

// Helper functions to update counters
export function getNextId(): number {
  return nextId++;
}

export function getNextProductId(): number {
  return nextProductId++;
}
