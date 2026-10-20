import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Crossword } from "./crossword";
import type { Task } from "../../lib/curriculum-tasks";

const task: Extract<Task, { type: "crossword" }> = {
  type: "crossword",
  question: "Fill in the crossword using the clues below.",
  solution: [
    [null, "S", null, null],
    ["G", "L", "A", "D"],
    [null, "O", null, null],
    [null, "W", null, null],
  ],
  clues: [
    { direction: "across", clue: "A word meaning happy", row: 1, col: 0, length: 4 },
    { direction: "down", clue: "Opposite of fast", row: 0, col: 1, length: 4 },
  ],
};

const CELLS: Array<[string, string]> = [
  ["row 1, column 2", "S"],
  ["row 2, column 1", "G"],
  ["row 2, column 2", "L"],
  ["row 2, column 3", "A"],
  ["row 2, column 4", "D"],
  ["row 3, column 2", "O"],
  ["row 4, column 2", "W"],
];

async function fillCorrectly(user: ReturnType<typeof userEvent.setup>) {
  for (const [name, letter] of CELLS) {
    await user.type(screen.getByRole("textbox", { name: new RegExp(name, "i") }), letter);
  }
}

describe(Crossword, () => {
  it("renders a textbox for every filled cell and nothing for blocked cells", () => {
    render(<Crossword task={task} onCorrect={() => {}} />);

    expect(screen.getAllByRole("textbox")).toHaveLength(7);
    expect(screen.getByRole("textbox", { name: /row 1, column 2/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /row 2, column 1/i })).toBeInTheDocument();
  });

  it("shows unanswered feedback when checking without filling every cell", async () => {
    const user = userEvent.setup();

    render(<Crossword task={task} onCorrect={() => {}} />);

    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByText("Fill in every square first.")).toBeInTheDocument();
  });

  it("shows incorrect feedback for wrong letters", async () => {
    const user = userEvent.setup();

    render(<Crossword task={task} onCorrect={() => {}} />);

    for (const cell of screen.getAllByRole("textbox")) {
      await user.type(cell, "X");
    }
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByText("Not quite. Try again.")).toBeInTheDocument();
  });

  it("shows correct feedback and calls onCorrect when solved", async () => {
    const onCorrect = vi.fn<() => void>();
    const user = userEvent.setup();

    render(<Crossword task={task} onCorrect={onCorrect} />);

    await fillCorrectly(user);
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(onCorrect).toHaveBeenCalledOnce();
  });

  it("disables all cell inputs after a correct answer", async () => {
    const user = userEvent.setup();

    render(<Crossword task={task} onCorrect={() => {}} />);

    await fillCorrectly(user);
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    for (const cell of screen.getAllByRole("textbox")) {
      expect(cell).toBeDisabled();
    }
  });

  it("only the default clue's cell is a tab stop initially", () => {
    render(<Crossword task={task} onCorrect={() => {}} />);

    expect(screen.getByRole("textbox", { name: /row 1, column 2/i }).tabIndex).toBe(0);
    expect(screen.getByRole("textbox", { name: /row 2, column 1/i }).tabIndex).toBe(-1);
  });

  it("moves focus with arrow keys and stops at the edge of a word", async () => {
    const user = userEvent.setup();

    render(<Crossword task={task} onCorrect={() => {}} />);

    const sCell = screen.getByRole("textbox", { name: /row 1, column 2/i });
    const lCell = screen.getByRole("textbox", { name: /row 2, column 2/i });

    await user.click(sCell);
    await user.keyboard("{ArrowUp}");
    expect(sCell).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(lCell).toHaveFocus();
  });

  it("advances focus to the next cell in the word after typing a letter", async () => {
    const user = userEvent.setup();

    render(<Crossword task={task} onCorrect={() => {}} />);

    const gCell = screen.getByRole("textbox", { name: /row 2, column 1/i });
    const lCell = screen.getByRole("textbox", { name: /row 2, column 2/i });

    await user.click(gCell);
    await user.keyboard("G");

    expect(lCell).toHaveFocus();
  });
});
