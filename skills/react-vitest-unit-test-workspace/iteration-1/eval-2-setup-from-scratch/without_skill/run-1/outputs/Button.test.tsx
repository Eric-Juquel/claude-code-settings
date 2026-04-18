import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "@/tests/test-utils";
import { Button } from "@/features/ui/components/Button";

describe("Button", () => {
  it("renders its label", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Submit</Button>);
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when the disabled prop is set", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    const button = screen.getByRole("button", { name: /disabled/i });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("forwards extra HTML attributes to the button element", () => {
    render(<Button data-testid="my-btn">Action</Button>);
    expect(screen.getByTestId("my-btn")).toBeInTheDocument();
  });
});
