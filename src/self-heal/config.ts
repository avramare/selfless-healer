import type { SelfHealConfig } from "./types";

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export function loadConfig(): SelfHealConfig {
  return {
    llmEnabled:
      bool(process.env.SELF_HEAL_LLM, false) && Boolean(process.env.ANTHROPIC_API_KEY),
    model: process.env.SELF_HEAL_MODEL ?? "claude-sonnet-4-6",
    artifactDir: process.env.SELF_HEAL_ARTIFACTS ?? ".self-heal",
    domCharLimit: Number(process.env.SELF_HEAL_DOM_LIMIT ?? 60000),
    cacheEnabled: bool(process.env.SELF_HEAL_CACHE, true),
  };
}
