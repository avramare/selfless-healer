import fs from "node:fs";
import path from "node:path";
import type { HealRecipe } from "./types.js";

interface CacheEntry {
    recipe: HealRecipe;
    healedAt: string;
}
/**
 * Once an element is healed, its recipe is 
 * stored here and replayed directly on subsequent runs — so healing cost
 * (especially an LLM call) is paid once, not every run.
 *
 * Commit this file if you want healed locators to be shared/reviewed via PRs;
 * leave it gitignored (the default here) if you prefer ephemeral healing.
 */
export class HealCache {
    private readonly file: string;
    private data: Record<string, CacheEntry> = {};
    
  constructor(artifactDir: string) {
        this.file = path.join(artifactDir, "cache.json");
        try{
            this.data = JSON.parse(fs.readFileSync(this.file, "utf-8"));
        } catch {
            this.data = {}; 
        }
    }

    get(key: string): HealRecipe | undefined {
        return this.data[key]?.recipe;
    }

    set(key: string, recipe: HealRecipe): void {
        this.data[key] = { recipe, healedAt: new Date().toISOString() };
        fs.mkdirSync(path.dirname(this.file), { recursive: true });
        fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
    }
}