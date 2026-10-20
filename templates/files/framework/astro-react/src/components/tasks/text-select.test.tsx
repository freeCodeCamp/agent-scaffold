import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextSelect } from "./text-select";
import type { Task } from "../../lib/curriculum-tasks";

const task: Extract<Task, { type: "text-select" }> = {
  type: "text-select",
  prompt: "Select the nouns.",
  tokens: [
    { text: "The", correct: false },
    { text: "chef", correct: true },
    { text: "bought", correct: false },
    { text: "apples", correct: true },
  ],
};

describe(TextSelect, () => {
  it("renders all tokens as checkboxes", () => {
    render(<TextSelect task={task} onCorrect={() => {}} />);

    expect(screen.getByRole("checkbox", { name: "The" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "chef" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "bought" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "apples" })).toBeInTheDocument();
  });

  it("shows unanswered feedback when checking without a selection", async () => {
    const user = userEvent.setup();

    render(<TextSelect task={task} onCorrect={() => {}} />);

    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByRole("status")).toHaveTextContent("Select at least one word first.");
  });

  it("shows incorrect feedback when the wrong token is selected", async () => {
    const user = userEvent.setup();

    render(<TextSelect task={task} onCorrect={() => {}} />);

    await user.click(screen.getByRole("checkbox", { name: "The" }));
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByRole("status")).toHaveTextContent("Not quite. Try again.");
  });

  it("shows incorrect feedback when only some correct tokens are selected", async () => {
    const user = userEvent.setup();

    render(<TextSelect task={task} onCorrect={() => {}} />);

    await user.click(screen.getByRole("checkbox", { name: "chef" }));
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByRole("status")).toHaveTextContent("Not quite. Try again.");
  });

  it("shows correct feedback and calls onCorrect when all correct tokens are selected", async () => {
    const onCorrect = vi.fn<() => void>();
    const user = userEvent.setup();

    render(<TextSelect task={task} onCorrect={onCorrect} />);

    await user.click(screen.getByRole("checkbox", { name: "chef" }));
    await user.click(screen.getByRole("checkbox", { name: "apples" }));
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByRole("status")).toHaveTextContent("Correct!");
    expect(onCorrect).toHaveBeenCalledOnce();
  });

  it("disables all tokens after a correct answer", async () => {
    const user = userEvent.setup();

    render(<TextSelect task={task} onCorrect={() => {}} />);

    await user.click(screen.getByRole("checkbox", { name: "chef" }));
    await user.click(screen.getByRole("checkbox", { name: "apples" }));
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox).toBeDisabled();
    }
  });

  it("hides the reset and check buttons after a correct answer", async () => {
    const user = userEvent.setup();

    render(<TextSelect task={task} onCorrect={() => {}} />);

    await user.click(screen.getByRole("checkbox", { name: "chef" }));
    await user.click(screen.getByRole("checkbox", { name: "apples" }));
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.queryByRole("button", { name: /check answer/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument();
  });

  it("clears the selection when reset is clicked", async () => {
    const user = userEvent.setup();

    render(<TextSelect task={task} onCorrect={() => {}} />);

    await user.click(screen.getByRole("checkbox", { name: "chef" }));
    expect(screen.getByRole("checkbox", { name: "chef" })).toBeChecked();

    await user.click(screen.getByRole("button", { name: /reset/i }));

    expect(screen.getByRole("checkbox", { name: "chef" })).not.toBeChecked();
  });

  it("only the first token is a tab stop initially", () => {
    render(<TextSelect task={task} onCorrect={() => {}} />);

    expect(screen.getByRole("checkbox", { name: "The" }).tabIndex).toBe(0);
    expect(screen.getByRole("checkbox", { name: "chef" }).tabIndex).toBe(-1);
    expect(screen.getByRole("checkbox", { name: "bought" }).tabIndex).toBe(-1);
    expect(screen.getByRole("checkbox", { name: "apples" }).tabIndex).toBe(-1);
  });

  it("moves focus between tokens with arrow keys and stops at the edges", async () => {
    const user = userEvent.setup();

    render(<TextSelect task={task} onCorrect={() => {}} />);

    const the = screen.getByRole("checkbox", { name: "The" });
    const chef = screen.getByRole("checkbox", { name: "chef" });
    const bought = screen.getByRole("checkbox", { name: "bought" });

    await user.click(the);
    await user.keyboard("{ArrowLeft}");
    expect(the).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(chef).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(bought).toHaveFocus();
  });
});
