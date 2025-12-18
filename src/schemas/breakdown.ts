import { z } from "zod";

export const BreakdownEntrySchema = z.object({
  slotType: z.enum([
    "inventory",
    "equipment",
    "relic",
    "relicAlternative",
    "familiar",
    "familiarAlternative",
  ]),
  slotIndex: z.number(),
  description: z.string(),
});

export type BreakdownEntry = z.infer<typeof BreakdownEntrySchema>;