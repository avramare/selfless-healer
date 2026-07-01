import type { Locator, Page } from "@playwright/test";
import type {
  ElementDescriptor,
  HealRecipe,
  HealTier,
  SelfHealConfig,
} from "./types";
import { loadConfig } from "./config";
import { HealCache } from "./cache";
import { HealReporter } from "./logger";
import { buildLocator, candidateRecipes } from "./strategies";
import { llmHeal } from "./llm";

/** Count current matches without auto-waiting; never throws. */
async function matchCount(locator: Locator): Promise<number> {
  try {
    return await locator.count();
  } catch {
    return 0;
  }
}

interface Resolution {
  recipe: HealRecipe;
  tier: HealTier;
  count: number;
}

/**
 * SelfHeal resolves a descriptor to a working Locator via a four-tier pipeline:
 *
 *   1. primary     — the author's intended selector (precise, zero overhead)
 *   2. cache       — a recipe that already healed this key on an earlier run
 *   3. rule-based  — deterministic semantic fallbacks (role, test id, label…)
 *   4. llm         — optional, DOM-aware, validated, off by default
 *
 * Tier 1 succeeding is the common case and costs nothing extra.
 * Anything past tier 1 is recorded as a heal so the drift is never silent.
 */
export class SelfHeal {
  private readonly config: SelfHealConfig;
  private readonly cache: HealCache;
  private readonly reporter: HealReporter;

  constructor(
    private readonly page: Page,
    config?: Partial<SelfHealConfig>,
  ) {
    this.config = { ...loadConfig(), ...config };
    this.cache = new HealCache(this.config.artifactDir);
    this.reporter = new HealReporter(this.config.artifactDir);
  }

  /** Resolve a descriptor to a usable Locator, healing if necessary. */
  async find(descriptor: ElementDescriptor): Promise<Locator> {
    const resolution = await this.resolve(descriptor);

    if (resolution.tier !== "primary") {
      if (this.config.cacheEnabled) {
        this.cache.set(descriptor.key, resolution.recipe);
      }
      this.reporter.record({
        key: descriptor.key,
        intent: descriptor.intent,
        tier: resolution.tier,
        brokenSelector: descriptor.primary,
        healedWith: resolution.recipe,
        matchCount: resolution.count,
        at: new Date().toISOString(),
      });
    }

    return buildLocator(this.page, resolution.recipe);
  }

  private async resolve(descriptor: ElementDescriptor): Promise<Resolution> {
    // Tier 1: primary selector.
    const primary: HealRecipe = { type: "selector", value: descriptor.primary };
    const primaryCount = await matchCount(buildLocator(this.page, primary));
    if (primaryCount > 0) return { recipe: primary, tier: "primary", count: primaryCount };

    // Tier 2: a previously cached heal for this key.
    const cached = this.cache.get(descriptor.key);
    if (cached) {
      const count = await matchCount(buildLocator(this.page, cached));
      if (count > 0) return { recipe: cached, tier: "cache", count };
    }

    // Tier 3: deterministic semantic fallbacks. Prefer an exact single match;
    // fall back to the first ambiguous-but-present candidate if none is exact.
    let ambiguous: Resolution | null = null;
    for (const recipe of candidateRecipes(descriptor)) {
      if (recipe === primary) continue;
      const count = await matchCount(buildLocator(this.page, recipe));
      if (count === 1) return { recipe, tier: "rule-based", count };
      if (count > 1 && !ambiguous) ambiguous = { recipe, tier: "rule-based", count };
    }
    if (ambiguous) return ambiguous;

    // Tier 4: optional LLM, always validated before it's trusted.
    if (this.config.llmEnabled) {
      const html = await this.page.content();
      const suggestion = await llmHeal(html, descriptor, this.config);
      if (suggestion) {
        const count = await matchCount(buildLocator(this.page, suggestion));
        if (count > 0) return { recipe: suggestion, tier: "llm", count };
      }
    }

    throw new Error(
      `[selfless-healer] Could not resolve "${descriptor.key}" (${descriptor.intent}). ` +
      `Primary selector "${descriptor.primary}" and all fallbacks failed. ` +
      `This usually means the feature itself changed — investigate before healing.`,
    );
  }
}
