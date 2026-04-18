import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/test-utils';
import { ChatBubble } from '@/features/home/components/ChatBubble';
import type { ChatMessage } from '@/api/model/upload';

// ─── helpers ────────────────────────────────────────────────────────────────

const userMessage = (content: string): ChatMessage => ({ role: 'user', content });
const assistantMessage = (content: string): ChatMessage => ({ role: 'assistant', content });

// ─── tests ──────────────────────────────────────────────────────────────────

describe('ChatBubble', () => {
  // --------------------------------------------------------------------------
  describe('user bubble', () => {
    it('renders the message text', () => {
      render(<ChatBubble message={userMessage('Hello world')} />);
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('displays the "Vous" label (i18n key chat.you)', () => {
      render(<ChatBubble message={userMessage('Hi')} />);
      // The FR default translation for chat.you is "Vous"
      expect(screen.getByText('Vous')).toBeInTheDocument();
    });

    it('does NOT render the candidateName or "Assistant" label', () => {
      render(<ChatBubble message={userMessage('Hi')} candidateName='Jean Dupont' />);
      expect(screen.queryByText('Jean Dupont')).not.toBeInTheDocument();
      expect(screen.queryByText('Assistant')).not.toBeInTheDocument();
    });

    it('renders the user message as plain text — markdown is NOT processed', () => {
      // If markdown were applied, **bold** would become a <strong> element
      const { container } = render(<ChatBubble message={userMessage('**bold text**')} />);
      expect(screen.getByText('**bold text**')).toBeInTheDocument();
      expect(container.querySelector('strong')).not.toBeInTheDocument();
    });

    it('places the icon container on the right (flex-row-reverse)', () => {
      const { container } = render(<ChatBubble message={userMessage('Hi')} />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toContain('flex-row-reverse');
    });
  });

  // --------------------------------------------------------------------------
  describe('assistant bubble', () => {
    it('renders the message content', () => {
      render(<ChatBubble message={assistantMessage('Je suis votre assistant.')} />);
      expect(screen.getByText('Je suis votre assistant.')).toBeInTheDocument();
    });

    it('displays the "Assistant" fallback label when candidateName is not provided', () => {
      render(<ChatBubble message={assistantMessage('Bonjour')} />);
      // FR translation for chat.assistant is "Assistant"
      expect(screen.getByText('Assistant')).toBeInTheDocument();
    });

    it('displays the candidateName as the label when provided', () => {
      render(<ChatBubble message={assistantMessage('Bonjour')} candidateName='Marie Curie' />);
      expect(screen.getByText('Marie Curie')).toBeInTheDocument();
      expect(screen.queryByText('Assistant')).not.toBeInTheDocument();
    });

    it('places the icon container on the left (flex-row)', () => {
      const { container } = render(<ChatBubble message={assistantMessage('Hi')} />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toContain('flex-row');
      expect(outerDiv.className).not.toContain('flex-row-reverse');
    });
  });

  // --------------------------------------------------------------------------
  describe('markdown rendering (assistant only)', () => {
    it('renders **bold** as a <strong> element', () => {
      const { container } = render(
        <ChatBubble message={assistantMessage('Voici **important**')} />,
      );
      const strong = container.querySelector('strong');
      expect(strong).toBeInTheDocument();
      expect(strong?.textContent).toBe('important');
    });

    it('renders `inline code` as a <code> element', () => {
      const { container } = render(
        <ChatBubble message={assistantMessage('Utilisez `npm install`')} />,
      );
      const code = container.querySelector('code');
      expect(code).toBeInTheDocument();
      expect(code?.textContent).toBe('npm install');
    });

    it('renders an unordered list', () => {
      const { container } = render(
        <ChatBubble
          message={assistantMessage('Liste :\n- item A\n- item B')}
        />,
      );
      expect(container.querySelector('ul')).toBeInTheDocument();
      const items = container.querySelectorAll('li');
      expect(items).toHaveLength(2);
    });

    it('renders an ordered list', () => {
      const { container } = render(
        <ChatBubble
          message={assistantMessage('Étapes :\n1. premier\n2. second')}
        />,
      );
      expect(container.querySelector('ol')).toBeInTheDocument();
      const items = container.querySelectorAll('li');
      expect(items).toHaveLength(2);
    });
  });

  // --------------------------------------------------------------------------
  describe('accessibility', () => {
    it('icon wrapper has aria-hidden="true" (decorative icon)', () => {
      const { container } = render(<ChatBubble message={userMessage('Hi')} />);
      const hiddenEl = container.querySelector('[aria-hidden="true"]');
      expect(hiddenEl).toBeInTheDocument();
    });

    it('icon wrapper has aria-hidden="true" on the assistant side too', () => {
      const { container } = render(<ChatBubble message={assistantMessage('Hi')} />);
      const hiddenEl = container.querySelector('[aria-hidden="true"]');
      expect(hiddenEl).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  describe('edge cases', () => {
    it('renders without crashing when content is an empty string (user)', () => {
      expect(() => render(<ChatBubble message={userMessage('')} />)).not.toThrow();
    });

    it('renders without crashing when content is an empty string (assistant)', () => {
      expect(() => render(<ChatBubble message={assistantMessage('')} />)).not.toThrow();
    });

    it('renders without crashing when candidateName is undefined', () => {
      expect(() =>
        render(<ChatBubble message={assistantMessage('Bonjour')} />),
      ).not.toThrow();
    });
  });
});
