import { describe, expect, it } from "vitest";
import {
  frameworkOptions,
  packageManagerOptions,
  recommendedFrameworkOptions,
  recommendedPackageManagerOptions,
  recommendedRuntimeOptions,
  runtimeOptions,
} from "../../../../src/commands/create/layer-composition/allowed-configuration.js";
import {
  FrameworkSchema,
  PackageManagerSchema,
  RuntimeSchema,
} from "../../../../src/commands/create/layer-composition/schemas/layers.js";
import runtimeFixture from "../../../fixtures/templates/layers/runtime.json";
import frameworkFixture from "../../../fixtures/templates/layers/framework.json";
import packageManagerFixture from "../../../fixtures/templates/layers/package-manager.json";

const runtimeData = RuntimeSchema.parse(runtimeFixture);
const frameworkData = FrameworkSchema.parse(frameworkFixture);
const packageManagerData = PackageManagerSchema.parse(packageManagerFixture);
const RUNTIMES = runtimeOptions(runtimeData).map((runtime) => [runtime]);

describe("allowed-configuration", () => {
  describe(runtimeOptions, () => {
    it("should return an array with all supported runtimes", () => {
      expect(runtimeOptions(runtimeData)).toStrictEqual(
        expect.arrayContaining(["node", "static_web"]),
      );
    });
  });

  describe(frameworkOptions, () => {
    it.each(RUNTIMES)("should return non-empty arrays for runtime '%s'", (runtime) => {
      expect(frameworkOptions(runtimeData, runtime).length).toBeGreaterThan(0);
    });
  });

  describe(packageManagerOptions, () => {
    it.each(RUNTIMES)("should return non-empty arrays for runtime '%s'", (runtime) => {
      expect(packageManagerOptions(runtimeData, runtime).length).toBeGreaterThan(0);
    });
  });

  describe(recommendedRuntimeOptions, () => {
    it("returns all runtimes when recommended is absent", () => {
      expect(recommendedRuntimeOptions(runtimeData)).toStrictEqual(runtimeOptions(runtimeData));
    });

    it("returns only runtimes with recommended !== false", () => {
      const data = RuntimeSchema.parse({
        node: { ...runtimeData["node"], recommended: true },
        static_web: { ...runtimeData["static_web"], recommended: false },
      });
      expect(recommendedRuntimeOptions(data)).toStrictEqual(["node"]);
    });

    it("returns empty array when all runtimes have recommended: false", () => {
      const data = RuntimeSchema.parse({
        node: { ...runtimeData["node"], recommended: false },
        static_web: { ...runtimeData["static_web"], recommended: false },
      });
      expect(recommendedRuntimeOptions(data)).toStrictEqual([]);
    });
  });

  describe(recommendedFrameworkOptions, () => {
    it("returns all frameworks when recommended is absent", () => {
      expect(recommendedFrameworkOptions(runtimeData, "node", frameworkData)).toStrictEqual(
        frameworkOptions(runtimeData, "node"),
      );
    });

    it("returns only frameworks with recommended !== false", () => {
      const frameworks = FrameworkSchema.parse({
        ...frameworkFixture,
        express: { ...frameworkFixture["express"], recommended: true },
        typescript: { ...frameworkFixture["typescript"], recommended: false },
        "react-vite": { ...frameworkFixture["react-vite"], recommended: false },
        "tanstack-shadcn": { ...frameworkFixture["tanstack-shadcn"], recommended: false },
      });
      expect(recommendedFrameworkOptions(runtimeData, "node", frameworks)).toStrictEqual([
        "express",
      ]);
    });

    it("returns empty array when all frameworks have recommended: false", () => {
      const frameworks = FrameworkSchema.parse({
        ...frameworkFixture,
        express: { ...frameworkFixture["express"], recommended: false },
        typescript: { ...frameworkFixture["typescript"], recommended: false },
        "react-vite": { ...frameworkFixture["react-vite"], recommended: false },
        "tanstack-shadcn": { ...frameworkFixture["tanstack-shadcn"], recommended: false },
      });
      expect(recommendedFrameworkOptions(runtimeData, "node", frameworks)).toStrictEqual([]);
    });
  });

  describe(recommendedPackageManagerOptions, () => {
    it("returns all package managers when recommended is absent", () => {
      expect(
        recommendedPackageManagerOptions(runtimeData, "node", packageManagerData),
      ).toStrictEqual(packageManagerOptions(runtimeData, "node"));
    });

    it("returns only package managers with recommended !== false", () => {
      const pms = PackageManagerSchema.parse({
        pnpm: { ...packageManagerFixture["pnpm"], recommended: true },
        bun: { ...packageManagerFixture["bun"], recommended: false },
      });
      expect(recommendedPackageManagerOptions(runtimeData, "node", pms)).toStrictEqual(["pnpm"]);
    });

    it("returns empty array when all package managers have recommended: false", () => {
      const pms = PackageManagerSchema.parse({
        pnpm: { ...packageManagerFixture["pnpm"], recommended: false },
        bun: { ...packageManagerFixture["bun"], recommended: false },
      });
      expect(recommendedPackageManagerOptions(runtimeData, "node", pms)).toStrictEqual([]);
    });
  });
});
