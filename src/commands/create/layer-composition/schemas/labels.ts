// This is the odd schema out: it doesn't correspond to a layer.
import { z } from "zod";

const LabelsSchema = z.record(
  z.union([z.literal("runtime"), z.literal("framework"), z.literal("packageManager")]),
  z.record(z.string(), z.string()),
);

type Labels = z.infer<typeof LabelsSchema>;

export { LabelsSchema };
export type { Labels };
