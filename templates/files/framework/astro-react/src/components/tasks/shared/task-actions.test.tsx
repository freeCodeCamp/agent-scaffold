import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskActions } from "./task-actions";

describe(TaskActions, () => {
  it("renders the feedback message", () => {
    render(
      <TaskActions
        result="incorrect"
        message="Try again"
        onCheck={() => {}}
        feedbackId="fb"
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Try again");
  });

  it("hides the check button when result is correct", () => {
    render(
      <TaskActions
        result="correct"
        message="Nice!"
        onCheck={() => {}}
        feedbackId="fb"
      />,
    );

    expect(screen.queryByRole("button", { name: /check answer/i })).not.toBeInTheDocument();
  });

  it("shows the check button when result is not correct", () => {
    render(
      <TaskActions
        result="incorrect"
        message="Try again"
        onCheck={() => {}}
        feedbackId="fb"
      />,
    );

    expect(screen.getByRole("button", { name: /check answer/i })).toBeInTheDocument();
  });

  it("fires onCheck when the button is clicked", async () => {
    const onCheck = vi.fn<() => void>();
    const user = userEvent.setup();

    render(
      <TaskActions
        result={null}
        message=""
        onCheck={onCheck}
        feedbackId="fb"
      />,
    );

    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(onCheck).toHaveBeenCalledOnce();
  });

  it("renders the secondary action when provided", () => {
    render(
      <TaskActions
        result={null}
        message=""
        onCheck={() => {}}
        feedbackId="fb"
        secondaryAction={<button>Reset</button>}
      />,
    );

    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });
});
