import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

describe("useSidebarOpen", () => {
  let useSidebarOpen: () => boolean;
  let toggleSidebar: () => void;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("./use-sidebar-open");
    useSidebarOpen = mod.useSidebarOpen;
    toggleSidebar = mod.toggleSidebar;
  });

  it("returns false initially", () => {
    const { result } = renderHook(() => useSidebarOpen());

    expect(result.current).toBe(false);
  });

  it("toggles when toggleSidebar is called", () => {
    const { result } = renderHook(() => useSidebarOpen());

    act(() => {
      toggleSidebar();
    });

    expect(result.current).toBe(true);
  });

  it("shares state across multiple consumers", () => {
    const { result: a } = renderHook(() => useSidebarOpen());
    const { result: b } = renderHook(() => useSidebarOpen());

    act(() => {
      toggleSidebar();
    });

    expect(a.current).toBe(true);
    expect(b.current).toBe(true);
  });
});
