import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MultipleChoice } from "./multiple-choice";
import type { Task } from "../../lib/curriculum-tasks";

const task: Extract<Task, { type: "multiple-choice" }> = {
  type: "multiple-choice",
  question: "Which is correct?",
  options: [
    { text: "Right", correct: true },
    { text: "Wrong", correct: false },
    { text: "Also wrong", correct: false },
  ],
};

describe(MultipleChoice, () => {
  it("renders all options as radio buttons", () => {
    render(<MultipleChoice task={task} onCorrect={() => {}} />);

    expect(screen.getByRole("radio", { name: "Right" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Wrong" })).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "Also wrong" }),
    ).toBeInTheDocument();
  });

  it("shows unanswered feedback when checking without a selection", async () => {
    const user = userEvent.setup();

    render(<MultipleChoice task={task} onCorrect={() => {}} />);

    await user.click(
      screen.getByRole("button", { name: /check answer/i }),
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Select an option first.",
    );
  });

  it("shows incorrect feedback for a wrong selection", async () => {
    const user = userEvent.setup();

    render(<MultipleChoice task={task} onCorrect={() => {}} />);

    await user.click(screen.getByRole("radio", { name: "Wrong" }));
    await user.click(
      screen.getByRole("button", { name: /check answer/i }),
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Not quite. Try again.",
    );
  });

  it("shows correct feedback and calls onCorrect for the right selection", async () => {
    const onCorrect = vi.fn<() => void>();
    const user = userEvent.setup();

    render(<MultipleChoice task={task} onCorrect={onCorrect} />);

    await user.click(screen.getByRole("radio", { name: "Right" }));
    await user.click(
      screen.getByRole("button", { name: /check answer/i }),
    );

    expect(screen.getByRole("status")).toHaveTextContent("Correct!");
    expect(onCorrect).toHaveBeenCalledOnce();
  });

  it("disables all radios after a correct answer", async () => {
    const user = userEvent.setup();

    render(<MultipleChoice task={task} onCorrect={() => {}} />);

    await user.click(screen.getByRole("radio", { name: "Right" }));
    await user.click(
      screen.getByRole("button", { name: /check answer/i }),
    );

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled();
    }
  });
});
