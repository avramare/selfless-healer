import type { ElementDescriptor, HealRecipe, SelfHealConfig } from "./types";

/**
 * When the deterministic tiers can't find the element,
 * we hand the current DOM + the element's intent to a model and ask for a single selector.
 * The result is always validated by the engine before use
 *
 * This tier is OFF by default. The framework is fully functional without it.
 */
export async function llmHeal(
  html: string,
  descriptor: ElementDescriptor,
  config: SelfHealConfig,
): Promise<HealRecipe | null> {
  const pkg = "@anthropic-ai/sdk";
  let Anthropic: any;
  try {
    const mod: any = await import(pkg);
    Anthropic = mod.default ?? mod;
  } catch {
    return null; // LLM healing is disabled if the package isn't installed
  }

  const client = new Anthropic(); // reads Anthropic API key from env
  const prompt =
    `A UI test can no longer find an element.\n` +
    `Intent: ${descriptor.intent}\n` +
    `Original (broken) selector: ${descriptor.primary}\n\n` +
    `Below is the current page HTML. Reply with ONLY a single CSS selector ` +
    `that uniquely matches the intended element. No prose, no backticks.\n\n` +
    html.slice(0, config.domCharLimit);

  try {
    const message = await client.messages.create({
      model: config.model,
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const text: string = (message.content ?? [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("")
      .trim();

    if (!text) return null;

    return { type: "selector", value: text };
  } catch {
    return null;
  }
}