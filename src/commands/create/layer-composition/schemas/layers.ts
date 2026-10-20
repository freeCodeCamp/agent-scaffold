import { z } from "zod";

const AlwaysSchema = z.record(z.literal("always"), z.strictObject({}));
type Always = z.infer<typeof AlwaysSchema>;

const RuntimeSchema = z.record(
  z.string(),
  z.strictObject({
    baseImage: z.string(),
    frameworks: z.array(z.string()),
    packageManagers: z.array(z.string()),
    recommended: z.boolean().optional(),
  }),
);
type Runtime = z.infer<typeof RuntimeSchema>;

const PackageManagerOptionSchema = z.literal(["bun", "pnpm"]);
type PackageManagerOption = z.infer<typeof PackageManagerOptionSchema>;
const PackageManagerSchema = z.record(
  PackageManagerOptionSchema,
  z.strictObject({
    devCmd: z.array(z.string()),
    lockfile: z.string(),
    manifests: z.array(z.string()),
    pmInstall: z.string(),
    pmVersion: z
      .string()
      .regex(
        /^\d+\.\d+\.\d+$/,
        "pmVersion must be a semver version (major.minor.patch), e.g. 1.2.3",
      ),
    preinstall: z.string().optional(),
    recommended: z.boolean().optional(),
  }),
);
type PackageManager = z.infer<typeof PackageManagerSchema>;

const FrameworkSchema = z.record(
  z.string(),
  z.strictObject({
    devContainer: z.record(z.string(), z.unknown()).optional(),
    devCopySource: z.string(),
    port: z.number(),
    recommended: z.boolean().optional(),
    skills: z.array(z.strictObject({ repo: z.string(), skill: z.string() })).optional(),
    watchSync: z.array(z.strictObject({ path: z.string(), target: z.string() })),
  }),
);
type Framework = z.infer<typeof FrameworkSchema>;

type RuntimeLayerData = Pick<Runtime[string], "baseImage">;

export { AlwaysSchema, FrameworkSchema, RuntimeSchema, PackageManagerSchema };
export type { Always, Framework, PackageManager, PackageManagerOption, Runtime, RuntimeLayerData };
