import type { Category } from "../../api/types";

export function groupCategories(categories: Category[]) {
  const groups: Record<string, Category[]> = {};

  for (const c of categories) {
    // excluimos "No identificado"
    if (c.name.toLowerCase() === "no identificado") continue;

    const group = c.groupName || "Sin grupo";

    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(c);
  }

  // opcional: ordenar categorías dentro de cada grupo
  for (const g of Object.keys(groups)) {
    groups[g].sort((a, b) => a.name.localeCompare(b.name));
  }

  return groups;
}
