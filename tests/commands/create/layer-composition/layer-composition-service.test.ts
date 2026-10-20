import { beforeAll, describe, expect, it } from "vitest";
import type { CreateSelections } from "../../../../src/commands/create/prompt/prompt.port.js";
import { LayerCompositionService } from "../../../../src/commands/create/layer-composition/layer-composition-service.js";
import { loadFromDir } from "../../../../src/commands/create/layer-composition/template-provider.js";
import { resolve } from "node:path";

const FIXTURES_DIR = resolve("tests/fixtures/templates");

describe(LayerCompositionService, () => {
  let service: LayerCompositionService;

  beforeAll(async () => {
    const { labels, registry } = await loadFromDir(FIXTURES_DIR);
    service = new LayerCompositionService(labels, registry);
  });

  const nodeExpressSelection: CreateSelections = {
    framework: "express",
    name: "test",
    packageManager: "pnpm",
    runtime: "node",
  };

  const staticSelection: CreateSelections = {
    framework: "html-css-js",
    name: "test",
    packageManager: "pnpm",
    runtime: "static_web",
  };

  it("emits a Dockerfile for node + express + pnpm", () => {
    const result = service.resolveLayers(nodeExpressSelection);

    expect(result.files["Dockerfile"]).toBeDefined();
    expect(result.files["Dockerfile"]).toContain("FROM node:24-slim AS base");
    expect(result.files["Dockerfile"]).toContain("FROM package-manager AS dev");
    expect(result.files["Dockerfile"]).toContain('CMD ["pnpm"]');
  });

  it("derives devInstall from manifests and lockfile for pnpm", () => {
    const result = service.resolveLayers(nodeExpressSelection);
    expect(result.files["Dockerfile"]).toContain("COPY package.json pnpm-lock.yaml ./");
    expect(result.files["Dockerfile"]).toContain("RUN pnpm install");
  });

  it("derives devInstall from manifests and lockfile for bun", () => {
    const result = service.resolveLayers({
      ...nodeExpressSelection,
      packageManager: "bun",
    });
    expect(result.files["Dockerfile"]).toContain("COPY package.json bun.lockb ./");
    expect(result.files["Dockerfile"]).toContain("RUN bun install");
  });

  it("emits a compose.yaml for node + express + pnpm", () => {
    const result = service.resolveLayers(nodeExpressSelection);

    expect(result.files["compose.yaml"]).toBeDefined();
    expect(result.files["compose.yaml"]).toContain("3000:3000");
    expect(result.files["compose.yaml"]).toContain("target: dev");
  });

  it("emits a Dockerfile for node + typescript + pnpm", () => {
    const result = service.resolveLayers({
      ...nodeExpressSelection,
      framework: "typescript",
    });

    expect(result.files["Dockerfile"]).toBeDefined();
    expect(result.files["Dockerfile"]).toContain("FROM node:24-slim AS base");
    expect(result.files["Dockerfile"]).toContain('CMD ["pnpm"]');
  });

  it("emits a compose.yaml for node + typescript + pnpm", () => {
    const result = service.resolveLayers({
      ...nodeExpressSelection,
      framework: "typescript",
    });

    expect(result.files["compose.yaml"]).toBeDefined();
    expect(result.files["compose.yaml"]).toContain("3000:3000");
  });

  it("does not add packageManager field to package.json for pnpm (set later by specifyDeps)", () => {
    const result = service.resolveLayers(nodeExpressSelection);
    const pkg = JSON.parse(result.files["package.json"]!) as Record<string, unknown>;
    expect(pkg["packageManager"]).toBeUndefined();
  });

  it("pins pnpm version in Dockerfile via corepack install -g", () => {
    const result = service.resolveLayers(nodeExpressSelection);
    expect(result.files["Dockerfile"]).toContain(
      "RUN corepack enable pnpm && corepack install -g pnpm@9.0.0",
    );
  });

  it("pins bun version in Dockerfile pmInstall", () => {
    const result = service.resolveLayers({
      ...nodeExpressSelection,
      packageManager: "bun",
    });
    expect(result.files["Dockerfile"]).toContain("RUN npm i -g bun@1.0.0");
  });

  it("does not add packageManager field to package.json for bun", () => {
    const result = service.resolveLayers({
      ...nodeExpressSelection,
      packageManager: "bun",
    });
    const pkg = JSON.parse(result.files["package.json"]!) as Record<string, unknown>;
    expect(pkg["packageManager"]).toBeUndefined();
  });

  it("emits a .dockerignore for node scaffold", () => {
    const result = service.resolveLayers(nodeExpressSelection);

    expect(result.files[".dockerignore"]).toBeDefined();
  });

  it("emits a Dockerfile and compose.yaml for static scaffold", () => {
    const result = service.resolveLayers(staticSelection);

    expect(result.files["Dockerfile"]).toBeDefined();
    expect(result.files[".dockerignore"]).toBeDefined();
    expect(result.files["compose.yaml"]).toBeDefined();
  });
});
