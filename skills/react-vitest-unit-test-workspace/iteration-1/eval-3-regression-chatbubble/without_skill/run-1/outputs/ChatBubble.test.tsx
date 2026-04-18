import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/test-utils';
import { ChatBubble } from '@/features/home/components/ChatBubble';
import type { ChatMessage } from '@/api/model/upload';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMessage(role: ChatMessage['role'], content: string): ChatMessage {
  return { role, content };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('ChatBubble', () => {
  // -------------------------------------------------------------------------
  // 1. Role label
  // -------------------------------------------------------------------------
  describe('role label', () => {
    it('displays "You" label for a user message', () => {
      render(<ChatBubble message={makeMessage('user', 'Hello')} />);
      expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('displays default "Assistant" label for an assistant message when no candidateName is provided', () => {
      render(<ChatBubble message={makeMessage('assistant', 'Hi there')} />);
      expect(screen.getByText('Assistant')).toBeInTheDocument();
    });

    it('displays the candidateName as label when provided for an assistant message', () => {
      render(
        <ChatBubble message={makeMessage('assistant', 'Hi there')} candidateName="Jane Doe" />,
      );
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('does NOT display candidateName as label for a user message', () => {
      render(<ChatBubble message={makeMessage('user', 'Hello')} candidateName="Jane Doe" />);
      expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
      expect(screen.getByText('You')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 2. Message content rendering
  // -------------------------------------------------------------------------
  describe('content rendering', () => {
    it('renders plain text content for a user message as-is', () => {
      render(<ChatBubble message={makeMessage('user', 'What is your experience?')} />);
      expect(screen.getByText('What is your experience?')).toBeInTheDocument();
    });

    it('renders plain text content for an assistant message', () => {
      render(<ChatBubble message={makeMessage('assistant', 'I have 5 years of experience.')} />);
      expect(screen.getByText('I have 5 years of experience.')).toBeInTheDocument();
    });

    it('renders markdown bold text for an assistant message', () => {
      render(<ChatBubble message={makeMessage('assistant', '**React** is great')} />);
      const bold = screen.getByText('React');
      expect(bold.tagName).toBe('STRONG');
    });

    it('renders a markdown unordered list for an assistant message', () => {
      const content = '- TypeScript\n- React\n- Node.js';
      render(<ChatBubble message={makeMessage('assistant', content)} />);
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
    });

    it('renders a markdown ordered list for an assistant message', () => {
      const content = '1. First\n2. Second\n3. Third';
      render(<ChatBubble message={makeMessage('assistant', content)} />);
      const list = screen.getByRole('list');
      expect(list.tagName).toBe('OL');
    });

    it('renders inline code for an assistant message', () => {
      render(<ChatBubble message={makeMessage('assistant', 'Use `npm install` to install')} />);
      const code = screen.getByText('npm install');
      expect(code.tagName).toBe('CODE');
    });

    it('does NOT render markdown for a user message — raw asterisks are preserved', () => {
      render(<ChatBubble message={makeMessage('user', '**bold**')} />);
      // Content should be the raw string, not a <strong> element
      expect(screen.getByText('**bold**')).toBeInTheDocument();
      expect(screen.queryByRole('strong')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 3. Icon rendering
  // -------------------------------------------------------------------------
  describe('icon rendering', () => {
    it('renders the User icon (aria-hidden) for a user message', () => {
      const { container } = render(<ChatBubble message={makeMessage('user', 'Hi')} />);
      const iconWrapper = container.querySelector('[aria-hidden="true"]');
      expect(iconWrapper).toBeInTheDocument();
      // The SVG rendered by lucide-react should be present inside the wrapper
      expect(iconWrapper?.querySelector('svg')).toBeInTheDocument();
    });

    it('renders the Bot icon (aria-hidden) for an assistant message', () => {
      const { container } = render(<ChatBubble message={makeMessage('assistant', 'Hi')} />);
      const iconWrapper = container.querySelector('[aria-hidden="true"]');
      expect(iconWrapper).toBeInTheDocument();
      expect(iconWrapper?.querySelector('svg')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 4. Layout direction (flex-row vs flex-row-reverse)
  // -------------------------------------------------------------------------
  describe('layout direction', () => {
    it('applies flex-row-reverse class for a user message (message on the right)', () => {
      const { container } = render(<ChatBubble message={makeMessage('user', 'Hi')} />);
      // The outermost div should have flex-row-reverse
      const outerDiv = container.firstElementChild;
      expect(outerDiv?.className).toContain('flex-row-reverse');
    });

    it('applies flex-row class for an assistant message (message on the left)', () => {
      const { container } = render(<ChatBubble message={makeMessage('assistant', 'Hi')} />);
      const outerDiv = container.firstElementChild;
      expect(outerDiv?.className).toContain('flex-row');
      expect(outerDiv?.className).not.toContain('flex-row-reverse');
    });
  });

  // -------------------------------------------------------------------------
  // 5. candidateName prop edge cases
  // -------------------------------------------------------------------------
  describe('candidateName prop edge cases', () => {
    it('falls back to "Assistant" when candidateName is an empty string', () => {
      render(<ChatBubble message={makeMessage('assistant', 'Hello')} candidateName="" />);
      // Empty string is falsy, so the fallback translation key should be used
      expect(screen.getByText('Assistant')).toBeInTheDocument();
    });

    it('falls back to "Assistant" when candidateName is undefined', () => {
      render(<ChatBubble message={makeMessage('assistant', 'Hello')} candidateName={undefined} />);
      expect(screen.getByText('Assistant')).toBeInTheDocument();
    });

    it('uses a non-empty candidateName correctly', () => {
      render(
        <ChatBubble message={makeMessage('assistant', 'Hello')} candidateName="Alice Martin" />,
      );
      expect(screen.getByText('Alice Martin')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 6. Empty content
  // -------------------------------------------------------------------------
  describe('empty content', () => {
    it('renders without crashing when message content is an empty string', () => {
      expect(() =>
        render(<ChatBubble message={makeMessage('user', '')} />),
      ).not.toThrow();
    });

    it('renders without crashing for an assistant message with empty content', () => {
      expect(() =>
        render(<ChatBubble message={makeMessage('assistant', '')} />),
      ).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // 7. Memoization — component should re-render on prop change
  // -------------------------------------------------------------------------
  describe('memoization', () => {
    it('updates content when the message prop changes', () => {
      const { rerender } = render(<ChatBubble message={makeMessage('user', 'First message')} />);
      expect(screen.getByText('First message')).toBeInTheDocument();

      rerender(<ChatBubble message={makeMessage('user', 'Second message')} />);
      expect(screen.queryByText('First message')).not.toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
    });

    it('updates label when role switches from user to assistant', () => {
      const { rerender } = render(<ChatBubble message={makeMessage('user', 'Hi')} />);
      expect(screen.getByText('You')).toBeInTheDocument();

      rerender(<ChatBubble message={makeMessage('assistant', 'Hi')} />);
      expect(screen.queryByText('You')).not.toBeInTheDocument();
      expect(screen.getByText('Assistant')).toBeInTheDocument();
    });
  });
});
