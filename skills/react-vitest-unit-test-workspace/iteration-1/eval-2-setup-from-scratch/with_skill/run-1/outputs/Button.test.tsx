// src/features/ui/__tests__/Button.test.tsx
// Minimal validation test — confirms the test stack is wired end-to-end.
// Tests observable behavior: renders correctly, responds to click.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/tests/test-utils';
import userEvent from '@testing-library/user-event';
import { Button } from '../components/Button';

describe('Button', () => {
  describe('initial render', () => {
    it('renders its label', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('is enabled by default', () => {
      render(<Button>Submit</Button>);
      expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled();
    });

    it('is disabled when the disabled prop is set', () => {
      render(<Button disabled>Submit</Button>);
      expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
    });
  });

  describe('user interactions', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Save</Button>);
      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick} disabled>Save</Button>);
      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });
});
