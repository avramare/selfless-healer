import type { Locator, Page } from "@playwright/test";
import type { ElementDescriptor, HealRecipe } from "./types";

export function buildLocator(page: Page, recipe: HealRecipe): Locator {
  switch (recipe.type) {
    case "selector":
      return page.locator(recipe.value);
    case "role":
      return page.getByRole(recipe.role, {
        name: recipe.name,
        exact: recipe.exact
      });
    case "testId":
      return page.getByTestId(recipe.value);
    case "text":
      return page.getByText(recipe.value, { exact: recipe.exact });
    case "placeholder":
      return page.getByPlaceholder(recipe.value);
    case "label":
      return page.getByLabel(recipe.value);
    case "altText":
      return page.getByAltText(recipe.value);
  }
}

/**
 * Produce candidate recipes in priority order.
 *
 * The primary selector is always first (it's the most precise and the author's
 * intent). Semantic fallbacks follow, ordered by how resilient they tend to be:
 * accessibility role/name and test ids survive restyling and refactors far
 * better than CSS classes, so they come before raw CSS.
 */
export function candidateRecipes(descriptor: ElementDescriptor): HealRecipe[] {
  const recipes: HealRecipe[] = [{ type: "selector", value: descriptor.primary }];
  const fb = descriptor.prescriptions;

  if (!fb) return recipes;

  if (fb.role) {
    recipes.push({
      type: "role",
      role: fb.role.role,
      name: fb.role.name,
      exact: fb.role.exact,
    });
  }
  if (fb.testId) recipes.push({ type: "testId", value: fb.testId });
  if (fb.label) recipes.push({ type: "label", value: fb.label });
  if (fb.placeholder) recipes.push({ type: "placeholder", value: fb.placeholder });
  if (fb.altText) recipes.push({ type: "altText", value: fb.altText });
  if (fb.text) recipes.push({ type: "text", value: fb.text });
  for (const css of fb.css ?? []) recipes.push({ type: "selector", value: css });

  return recipes;
}
/** Human readable description of a heal recipe used in logs/reports. */
export function describeRecipe(recipe: HealRecipe): string {
  switch (recipe.type) {
    case "selector":
      return `selector(${recipe.value})`;
    case "role":
      return `role(${recipe.role}${recipe.name ? `, name="${recipe.name}"` : ""})`;
    case "testId":
      return `testId(${recipe.value})`;
    case "text":
      return `text(${recipe.value})`;
    case "placeholder":
      return `placeholder(${recipe.value})`;
    case "label":
      return `label(${recipe.value})`;
    case "altText":
      return `altText(${recipe.value})`;
  }
}