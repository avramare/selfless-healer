import type { Page } from "@playwright/test";

/** The ARIA role union accepted by Playwright's getByRole. */
export type AriaRole = Parameters<Page["getByRole"]>[0];

/**
 * A "recipe" is a single relayable way to locate an element.
 * Recipes are cached and written in heal reports.
 */
export type HealRecipe =
  | { type: "selector"; value: string } // raw Playwright/CSS selector string
  | { type: "role"; role: AriaRole; name?: string; exact?: boolean }
  | { type: "testId"; value: string }
  | { type: "text"; value: string; exact?: boolean }
  | { type: "placeholder"; value: string }
  | { type: "label"; value: string }
  | { type: "altText"; value: string };


/**
 * Semantic fallbacks that desribe *what the element is*
 */
export interface Fallbacks {
  role?: { role: AriaRole; name?: string; exact?: boolean };
  testId?: string;
  text?: string;
  placeholder?: string;
  label?: string;
  altText?: string;
  css?: string[];
}

/** Everything the engine needs to find (and, if needed, heal) one element.*/
export interface ElementDescriptor {
  key: string;

  primary: string;

  intent: string;

  fallbacks: Fallbacks;
}

export type HealTier = "primary" | "cache" | "rule-based" | "llm";

/** One healing event, appended to the audit report. */
export interface HealEvent {
  key: string;
  intent: string;
  tier: HealTier;
  brokenSelector: string;
  healedWith: HealRecipe;
  matchCount: number;
  at: string; // ISO timestamp
}

export interface SelfHealConfig {
  llmEnabled: boolean;

  model: string;

  artifactDir: string;

  domCharLimit: number;

  cacheEnabled: boolean;
}