"use client";

import CategoryManager from "@/components/categories/CategoryManager";
import { useApp } from "@/components/shell/AppProvider";

export default function CategoriesSection() {
  const { state, saveCategory, deleteCategory } = useApp();

  return (
    <CategoryManager
      categories={state.categories}
      habits={state.habits}
      onSave={saveCategory}
      onDelete={deleteCategory}
    />
  );
}
