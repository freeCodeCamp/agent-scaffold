import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlashCard } from "./flash-card";
import type { Task } from "../../lib/curriculum-tasks";

const task: Extract<Task, { type: "flash-card" }> = {
  type: "flash-card",
  prompt: "There's a mistake in the sentence below, can you find it?",
  front: "I goed to the store yesterday.",
  back: "I went to the store yesterday.",
};

describe(FlashCard, () => {
  it("renders the prompt and the front content", () => {
    render(<FlashCard task={task} onCorrect={() => {}} />);

    expect(screen.getByText(task.prompt)).toBeInTheDocument();
    expect(screen.getByText(task.front)).toBeInTheDocument();
  });

  it("flips to the back on click, and back to the front on a second click", async () => {
    const user = userEvent.setup();
    render(<FlashCard task={task} onCorrect={() => {}} />);

    await user.click(screen.getByRole("button", { pressed: false }));
    expect(screen.getByRole("button", { pressed: true })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { pressed: true }));
    expect(screen.getByRole("button", { pressed: false })).toBeInTheDocument();
  });

  it("flips with the keyboard using Enter and Space", async () => {
    const user = userEvent.setup();
    render(<FlashCard task={task} onCorrect={() => {}} />);
    screen.getByRole("button", { pressed: false }).focus();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { pressed: true })).toBeInTheDocument();

    await user.keyboard(" ");
    expect(screen.getByRole("button", { pressed: false })).toBeInTheDocument();
  });

  it("shows unanswered feedback when checking without flipping", async () => {
    const user = userEvent.setup();
    render(<FlashCard task={task} onCorrect={() => {}} />);

    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByText("Flip the card first.")).toBeInTheDocument();
  });

  it("shows correct feedback and calls onCorrect once flipped and checked", async () => {
    const onCorrect = vi.fn<() => void>();
    const user = userEvent.setup();
    render(<FlashCard task={task} onCorrect={onCorrect} />);

    await user.click(screen.getByRole("button", { pressed: false }));
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByText("Complete!")).toBeInTheDocument();
    expect(onCorrect).toHaveBeenCalledOnce();
  });

  it("stays flippable and keeps its feedback after being marked complete", async () => {
    const onCorrect = vi.fn<() => void>();
    const user = userEvent.setup();
    render(<FlashCard task={task} onCorrect={onCorrect} />);

    await user.click(screen.getByRole("button", { pressed: false }));
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    await user.click(screen.getByRole("button", { pressed: true }));

    expect(screen.getByRole("button", { pressed: false })).toBeInTheDocument();
    expect(screen.getByText("Complete!")).toBeInTheDocument();
    expect(onCorrect).toHaveBeenCalledOnce();
  });

  it("disables the reset button until the card has been flipped", () => {
    render(<FlashCard task={task} onCorrect={() => {}} />);

    expect(screen.getByRole("button", { name: /reset/i })).toHaveAttribute("aria-disabled", "true");
  });

  it("hides the reset button once the card is marked complete", async () => {
    const user = userEvent.setup();
    render(<FlashCard task={task} onCorrect={() => {}} />);

    await user.click(screen.getByRole("button", { pressed: false }));
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument();
  });

  it("resets the card to the front", async () => {
    const user = userEvent.setup();
    render(<FlashCard task={task} onCorrect={() => {}} />);

    await user.click(screen.getByRole("button", { pressed: false }));
    await user.click(screen.getByRole("button", { name: /reset/i }));

    expect(screen.getByRole("button", { pressed: false })).toBeInTheDocument();
  });
});
