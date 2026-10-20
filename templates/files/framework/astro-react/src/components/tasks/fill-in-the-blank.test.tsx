import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FillInTheBlank } from "./fill-in-the-blank";
import type { Task } from "../../lib/curriculum-tasks";

const task: Extract<Task, { type: "fill-in-the-blank" }> = {
  type: "fill-in-the-blank",
  segments: [
    { kind: "text", value: "The sky is " },
    { kind: "blank", answers: ["blue"] },
    { kind: "text", value: " and the grass is " },
    { kind: "blank", answers: ["green"] },
  ],
};

describe(FillInTheBlank, () => {
  it("renders one input per blank with surrounding text", () => {
    render(<FillInTheBlank task={task} onCorrect={() => {}} />);

    expect(
      screen.getByRole("textbox", { name: /blank 1/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /blank 2/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("The sky is")).toBeInTheDocument();
    expect(screen.getByText("and the grass is")).toBeInTheDocument();
  });

  it("shows unanswered feedback when inputs are empty", async () => {
    const user = userEvent.setup();

    render(<FillInTheBlank task={task} onCorrect={() => {}} />);

    await user.click(
      screen.getByRole("button", { name: /check answer/i }),
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Fill in every blank first.",
    );
  });

  it("shows incorrect feedback for wrong answers", async () => {
    const user = userEvent.setup();

    render(<FillInTheBlank task={task} onCorrect={() => {}} />);

    await user.type(
      screen.getByRole("textbox", { name: /blank 1/i }),
      "red",
    );
    await user.type(
      screen.getByRole("textbox", { name: /blank 2/i }),
      "green",
    );
    await user.click(
      screen.getByRole("button", { name: /check answer/i }),
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Not quite. Try again.",
    );
  });

  it("accepts correct answers case-insensitively and calls onCorrect", async () => {
    const onCorrect = vi.fn<() => void>();
    const user = userEvent.setup();

    render(<FillInTheBlank task={task} onCorrect={onCorrect} />);

    await user.type(
      screen.getByRole("textbox", { name: /blank 1/i }),
      "  Blue  ",
    );
    await user.type(
      screen.getByRole("textbox", { name: /blank 2/i }),
      "GREEN",
    );
    await user.click(
      screen.getByRole("button", { name: /check answer/i }),
    );

    expect(screen.getByRole("status")).toHaveTextContent("Correct!");
    expect(onCorrect).toHaveBeenCalledOnce();
  });

  it("disables inputs after a correct answer", async () => {
    const user = userEvent.setup();

    render(<FillInTheBlank task={task} onCorrect={() => {}} />);

    await user.type(
      screen.getByRole("textbox", { name: /blank 1/i }),
      "blue",
    );
    await user.type(
      screen.getByRole("textbox", { name: /blank 2/i }),
      "green",
    );
    await user.click(
      screen.getByRole("button", { name: /check answer/i }),
    );

    for (const input of screen.getAllByRole("textbox")) {
      expect(input).toBeDisabled();
    }
  });
});
