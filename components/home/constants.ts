import { Ionicons } from "@expo/vector-icons";
import React from "react";

export const CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Health",
  "Entertainment",
  "Accommodation",
  "Wellness",
  "Other",
];

export const CATEGORY_ICONS: Record<
  string,
  React.ComponentProps<typeof Ionicons>["name"]
> = {
  Food: "restaurant-outline",
  Travel: "car-outline",
  Shopping: "bag-outline",
  Health: "medical-outline",
  Entertainment: "film-outline",
  Accommodation: "home-outline",
  Wellness: "fitness-outline",
};

export function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}
