import fs from "node:fs";
import path from "node:path";
import { HealEvent } from "./types";
import { describeRecipe } from "./strategies";

export class HealReporter {
  private readonly file: string;
  private readonly events: HealEvent[] = [];

  constructor(artifactDir: string) {
    this.file = path.join(artifactDir, "heal-report.json");
  }

  record(event: HealEvent): void {
    this.events.push(event);
    // eslint-disable-next-line no-console
    console.warn(
      `🩹 [reweave] healed "${event.key}" via ${event.tier}: ` +
        `${event.brokenSelector} → ${describeRecipe(event.healedWith)} ` +
        `(${event.matchCount} match${event.matchCount === 1 ? "" : "es"})`,
    );
    this.flush();
  }

  private flush(): void {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(this.events, null, 2));
  }
}