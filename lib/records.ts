import { env } from "cloudflare:workers";
export function database() { if (!env.DB) throw new Error("Storage unavailable"); return env.DB; }
export const kinds = ["task","project","event","grocery","memory","checkin","metric","document"];
export const areas = ["Health","Fitness","Finances","Professional life","Family life","Mental wellbeing","Relationships","Productivity","Home","Family planning","Personal growth"];
