import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Order } from "./order";
import type { Task } from "../../lib/curriculum-tasks";
import { dragPointerTo, mockRect, waitOutDragClickGuard } from "../../test-utils/dnd";

const task: Extract<Task, { type: "order" }> = {
  type: "order",
  question: "Put these in order:",
  items: ["Alpha", "Beta", "Gamma"],
};

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0.1);
});

function getItemOrder(): string[] {
  const group = screen.getByRole("group", { name: "Put these in order:" });
  return within(group)
    .queryAllByText((_, element) => element?.className === "item-card")
    .map((element) => element.textContent ?? "");
}

const ROW_HEIGHT = 40;

function mockRowRects(order: string[]) {
  order.forEach((text, index) => {
    const row = screen.getByText(text).closest(".order-row");
    if (row) mockRect(row, { top: index * ROW_HEIGHT, left: 0, bottom: (index + 1) * ROW_HEIGHT, right: 100 });
  });
}

function dragItemToRow(itemText: string, targetText: string, currentOrder: string[]) {
  mockRowRects(currentOrder);
  const item = screen.getByText(itemText);
  const sourceRow = item.closest(".order-row");
  const targetRow = screen.getByText(targetText).closest(".order-row");
  if (!sourceRow || !targetRow) throw new Error("Could not find row");

  dragPointerTo(item, targetRow, targetRow.getBoundingClientRect(), sourceRow.getBoundingClientRect());
}

describe(Order, () => {
  it("renders items in shuffled order", () => {
    render(<Order task={task} onCorrect={() => {}} />);

    expect(getItemOrder()).toEqual(["Beta", "Gamma", "Alpha"]);
  });

  it("moves an item into a new position by dragging it", () => {
    render(<Order task={task} onCorrect={() => {}} />);

    dragItemToRow("Gamma", "Beta", ["Beta", "Gamma", "Alpha"]);

    expect(getItemOrder()).toEqual(["Gamma", "Beta", "Alpha"]);
  });

  it("shows correct feedback and calls onCorrect for the right order", async () => {
    const onCorrect = vi.fn<() => void>();
    const user = userEvent.setup();
    render(<Order task={task} onCorrect={onCorrect} />);

    dragItemToRow("Alpha", "Beta", ["Beta", "Gamma", "Alpha"]);
    await waitOutDragClickGuard();
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(onCorrect).toHaveBeenCalledOnce();
  });

  it("shows incorrect feedback for the wrong order", async () => {
    const user = userEvent.setup();
    render(<Order task={task} onCorrect={() => {}} />);

    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByText("Not quite. Try again.")).toBeInTheDocument();
  });

  it("restores the initial shuffled order on reset", async () => {
    const user = userEvent.setup();
    render(<Order task={task} onCorrect={() => {}} />);

    dragItemToRow("Alpha", "Beta", ["Beta", "Gamma", "Alpha"]);
    await waitOutDragClickGuard();
    await user.click(screen.getByRole("button", { name: /reset/i }));

    expect(getItemOrder()).toEqual(["Beta", "Gamma", "Alpha"]);
  });
});
