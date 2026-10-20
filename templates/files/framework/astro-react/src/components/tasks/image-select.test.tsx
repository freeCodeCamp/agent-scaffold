import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageSelect } from "./image-select";
import type { Task } from "../../lib/curriculum-tasks";

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect id="a" data-region="true" data-label="Region A" x="0" y="0" width="40" height="40"/>
  <rect id="b" data-region="true" data-label="Region B" x="60" y="60" width="40" height="40"/>
</svg>`;

const task: Extract<Task, { type: "image-select" }> = {
  type: "image-select",
  prompt: "Click region A.",
  imageSrc: "/images/test.svg",
  correct: ["a"],
};

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(SVG) }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(ImageSelect, () => {
  it("renders a checkbox for each region once the image loads", async () => {
    render(<ImageSelect task={task} onCorrect={() => {}} />);

    expect(await screen.findByRole("checkbox", { name: "Region A" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Region B" })).toBeInTheDocument();
  });

  it("shows an error message when the image fails to load", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    render(<ImageSelect task={task} onCorrect={() => {}} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("This image couldn't be loaded.");
  });

  it("shows an error message when the SVG fails to parse", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve("not valid xml <<<") }),
    );

    render(<ImageSelect task={task} onCorrect={() => {}} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("This image couldn't be loaded.");
  });

  it("treats any tagged element with data-region as a selectable region, regardless of tag", async () => {
    const lineSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <line id="wire" data-region="true" data-label="Wire" x1="0" y1="0" x2="100" y2="100"/>
    </svg>`;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(lineSvg) }),
    );
    const lineTask: Extract<Task, { type: "image-select" }> = {
      type: "image-select",
      prompt: "Click the wire.",
      imageSrc: "/images/line.svg",
      correct: ["wire"],
    };

    render(<ImageSelect task={lineTask} onCorrect={() => {}} />);

    expect(await screen.findByRole("checkbox", { name: "Wire" })).toBeInTheDocument();
  });

  it("ignores an id'd element that has no data-region", async () => {
    const svgWithStrayId = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <g id="layer1">
        <rect id="a" data-region="true" data-label="Region A" x="0" y="0" width="40" height="40"/>
      </g>
    </svg>`;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(svgWithStrayId) }),
    );

    render(<ImageSelect task={task} onCorrect={() => {}} />);

    await screen.findByRole("checkbox", { name: "Region A" });
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
  });

  it("shows unanswered feedback when checking without a selection", async () => {
    const user = userEvent.setup();
    render(<ImageSelect task={task} onCorrect={() => {}} />);
    await screen.findByRole("checkbox", { name: "Region A" });

    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByText("Select at least one region first.")).toBeInTheDocument();
  });

  it("shows incorrect feedback for a wrong selection", async () => {
    const user = userEvent.setup();
    render(<ImageSelect task={task} onCorrect={() => {}} />);

    fireEvent.click(await screen.findByRole("checkbox", { name: "Region B" }));
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByText("Not quite. Try again.")).toBeInTheDocument();
  });

  it("shows correct feedback and calls onCorrect for the correct selection", async () => {
    const onCorrect = vi.fn<() => void>();
    const user = userEvent.setup();
    render(<ImageSelect task={task} onCorrect={onCorrect} />);

    fireEvent.click(await screen.findByRole("checkbox", { name: "Region A" }));
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(onCorrect).toHaveBeenCalledOnce();
  });

  it("marks every region aria-disabled after a correct answer", async () => {
    const user = userEvent.setup();
    render(<ImageSelect task={task} onCorrect={() => {}} />);

    fireEvent.click(await screen.findByRole("checkbox", { name: "Region A" }));
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    for (const region of screen.getAllByRole("checkbox")) {
      expect(region).toHaveAttribute("aria-disabled", "true");
    }
  });

  it("defaults to the first region as the active descendant", async () => {
    render(<ImageSelect task={task} onCorrect={() => {}} />);

    const regionA = await screen.findByRole("checkbox", { name: "Region A" });

    expect(screen.getByRole("group")).toHaveAttribute("aria-activedescendant", regionA.id);
  });

  it("moves the active descendant on hover", async () => {
    const user = userEvent.setup();
    render(<ImageSelect task={task} onCorrect={() => {}} />);
    const regionB = await screen.findByRole("checkbox", { name: "Region B" });
    const regionBId = regionB.id;

    await user.hover(regionB);

    expect(screen.getByRole("group")).toHaveAttribute("aria-activedescendant", regionBId);
  });

  it("moves the active descendant with arrow keys and stops at the edge", async () => {
    const user = userEvent.setup();
    render(<ImageSelect task={task} onCorrect={() => {}} />);
    await screen.findByRole("checkbox", { name: "Region A" });
    const regionB = screen.getByRole("checkbox", { name: "Region B" });
    const group = screen.getByRole("group");

    group.focus();
    await user.keyboard("{ArrowRight}");
    expect(group).toHaveAttribute("aria-activedescendant", regionB.id);

    await user.keyboard("{ArrowRight}");
    expect(group).toHaveAttribute("aria-activedescendant", regionB.id);
  });

  it("toggles the active region's selection with Space", async () => {
    const user = userEvent.setup();
    render(<ImageSelect task={task} onCorrect={() => {}} />);
    await screen.findByRole("checkbox", { name: "Region A" });
    const group = screen.getByRole("group");

    group.focus();
    await user.keyboard(" ");

    expect(screen.getByRole("checkbox", { name: "Region A" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});
