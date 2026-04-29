import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";

const DEFAULT_CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Health",
  "Entertainment",
  "Accommodation",
  "Wellness",
  "Other",
];

export let CATEGORIES = [...DEFAULT_CATEGORIES];

const CUSTOM_CATEGORIES_KEY = "customCategories";

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

export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "₹0";
  }
  return "₹" + amount.toLocaleString("en-IN");
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

/**
 * Load custom categories from AsyncStorage and merge with default categories
 */
export async function loadCategories(): Promise<string[]> {
  try {
    const customCategoriesJSON = await AsyncStorage.getItem(
      CUSTOM_CATEGORIES_KEY,
    );
    const customCategories = customCategoriesJSON
      ? JSON.parse(customCategoriesJSON)
      : [];
    CATEGORIES = [...DEFAULT_CATEGORIES, ...customCategories];
    return CATEGORIES;
  } catch (error) {
    console.error("Error loading categories:", error);
    CATEGORIES = [...DEFAULT_CATEGORIES];
    return CATEGORIES;
  }
}

/**
 * Add a new custom category
 * @param categoryName - Name of the new category to add
 * @returns true if category was added successfully, false if it already exists
 */
export async function addCustomCategory(
  categoryName: string,
): Promise<boolean> {
  try {
    const trimmedName = categoryName.trim();

    // Prevent duplicates
    if (CATEGORIES.includes(trimmedName)) {
      console.warn(`Category "${trimmedName}" already exists`);
      return false;
    }

    // Prevent empty strings
    if (trimmedName.length === 0) {
      console.warn("Category name cannot be empty");
      return false;
    }

    // Get existing custom categories
    const customCategoriesJSON = await AsyncStorage.getItem(
      CUSTOM_CATEGORIES_KEY,
    );
    const customCategories = customCategoriesJSON
      ? JSON.parse(customCategoriesJSON)
      : [];

    // Add to custom categories
    customCategories.push(trimmedName);
    await AsyncStorage.setItem(
      CUSTOM_CATEGORIES_KEY,
      JSON.stringify(customCategories),
    );

    // Update the global CATEGORIES array
    CATEGORIES = [...DEFAULT_CATEGORIES, ...customCategories];
    return true;
  } catch (error) {
    console.error("Error adding custom category:", error);
    return false;
  }
}

/**
 * Remove a custom category
 * @param categoryName - Name of the category to remove
 * @returns true if category was removed, false if it's a default category or doesn't exist
 */
export async function removeCustomCategory(
  categoryName: string,
): Promise<boolean> {
  try {
    // Prevent deletion of default categories
    if (DEFAULT_CATEGORIES.includes(categoryName)) {
      console.warn("Cannot delete default categories");
      return false;
    }

    const customCategoriesJSON = await AsyncStorage.getItem(
      CUSTOM_CATEGORIES_KEY,
    );
    const customCategories = customCategoriesJSON
      ? JSON.parse(customCategoriesJSON)
      : [];

    const filteredCategories = customCategories.filter(
      (cat) => cat !== categoryName,
    );

    await AsyncStorage.setItem(
      CUSTOM_CATEGORIES_KEY,
      JSON.stringify(filteredCategories),
    );

    // Update the global CATEGORIES array
    CATEGORIES = [...DEFAULT_CATEGORIES, ...filteredCategories];
    return true;
  } catch (error) {
    console.error("Error removing custom category:", error);
    return false;
  }
}

/**
 * Get all categories (both default and custom)
 * @returns Array of all available categories
 */
export function getAllCategories(): string[] {
  return [...CATEGORIES];
}
