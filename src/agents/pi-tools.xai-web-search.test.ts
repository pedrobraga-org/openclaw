import { describe, expect, it, vi } from "vitest";
import type { OpenClawConfig } from "../config/config.js";
import { createOpenClawCodingTools } from "./pi-tools.js";

const stubTool = (name: string) => ({
  name,
  description: `${name} stub`,
  parameters: { type: "object" as const, properties: {} },
  execute: vi.fn() as unknown as (...args: unknown[]) => unknown,
});

vi.mock("./tools/image-tool.js", () => ({
  createImageTool: () => stubTool("image"),
}));

vi.mock("./tools/web-tools.js", () => ({
  createWebSearchTool: () => stubTool("web_search"),
  createWebFetchTool: () => null,
}));

vi.mock("../plugins/tools.js", () => ({
  resolvePluginTools: () => [],
  getPluginToolMeta: () => undefined,
}));

const webSearchEnabledConfig = {
  tools: {
    profile: "coding",
    alsoAllow: ["web_search"],
  },
} satisfies OpenClawConfig;

function toolNamesFor(params: { modelProvider: string; modelId?: string }): Set<string> {
  return new Set(
    createOpenClawCodingTools({
      config: webSearchEnabledConfig,
      modelProvider: params.modelProvider,
      modelId: params.modelId,
    }).map((tool) => tool.name),
  );
}

describe("createOpenClawCodingTools xAI web_search handling", () => {
  it("omits the local web_search function tool for direct xAI models", () => {
    expect(toolNamesFor({ modelProvider: "xai", modelId: "grok-4" }).has("web_search")).toBe(false);
  });

  it("omits the local web_search function tool for OpenRouter xAI models", () => {
    expect(
      toolNamesFor({ modelProvider: "openrouter", modelId: "x-ai/grok-4.1-fast" }).has(
        "web_search",
      ),
    ).toBe(false);
  });

  it("keeps the local web_search function tool for non-xAI models", () => {
    expect(toolNamesFor({ modelProvider: "openai", modelId: "gpt-5.2" }).has("web_search")).toBe(
      true,
    );
  });
});
