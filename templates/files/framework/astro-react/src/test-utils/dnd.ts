import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";

export function mockRect(element: Element, rect: Partial<DOMRect>) {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    width: 100,
    height: 40,
    top: 0,
    left: 0,
    right: 100,
    bottom: 40,
    toJSON: () => {},
    ...rect,
  });
}

export function dragPointerTo(
  source: Element,
  target: Element,
  targetRect: Partial<DOMRect>,
  sourceRect: Partial<DOMRect> = { top: 0, left: 0, bottom: 40, right: 100 },
) {
  mockRect(source, sourceRect);
  mockRect(target, targetRect);

  const centerX = ((targetRect.left ?? 0) + (targetRect.right ?? 100)) / 2;
  const centerY = ((targetRect.top ?? 0) + (targetRect.bottom ?? 40)) / 2;

  fireEvent.pointerDown(source, { pointerId: 1, isPrimary: true, button: 0, clientX: 50, clientY: 20 });
  fireEvent.pointerMove(document, { pointerId: 1, clientX: centerX, clientY: centerY });
  fireEvent.pointerUp(document, { pointerId: 1, clientX: centerX, clientY: centerY });
}

export async function waitOutDragClickGuard() {
  await new Promise((resolve) => setTimeout(resolve, 60));
}
