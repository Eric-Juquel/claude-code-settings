import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/tests/test-utils';
import userEvent from '@testing-library/user-event';
import { DropZone, DOCUMENT_MIMETYPES } from '../components/DropZone';

// Helper to create a fake File with a specific MIME type
function makeFile(name: string, type = 'application/pdf'): File {
  return new File(['dummy content'], name, { type });
}

// Default props shared across tests
const defaultProps = {
  label: 'Resume',
  hint: 'PDF, Word or TXT',
  dropText: 'Drop resume here',
  browseText: 'Browse',
  file: null,
  onFile: vi.fn(),
};

describe('DropZone', () => {
  describe('initial render — no file', () => {
    it('renders the label and hint', () => {
      render(<DropZone {...defaultProps} />);

      expect(screen.getByText('Resume')).toBeInTheDocument();
      expect(screen.getByText('PDF, Word or TXT')).toBeInTheDocument();
    });

    it('renders the drop zone button with the correct aria-label', () => {
      render(<DropZone {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /drop resume here — resume/i }),
      ).toBeInTheDocument();
    });

    it('renders dropText and browseText inside the drop zone', () => {
      render(<DropZone {...defaultProps} />);

      expect(screen.getByText('Drop resume here')).toBeInTheDocument();
      expect(screen.getByText('Browse')).toBeInTheDocument();
    });

    it('does not render the "Optional" badge when optional prop is absent', () => {
      render(<DropZone {...defaultProps} />);

      expect(screen.queryByText('Optional')).not.toBeInTheDocument();
    });

    it('renders the "Optional" badge when optional prop is true', () => {
      render(<DropZone {...defaultProps} optional />);

      expect(screen.getByText('Optional')).toBeInTheDocument();
    });

    it('does not render the remove button when no file is selected', () => {
      render(<DropZone {...defaultProps} />);

      expect(
        screen.queryByRole('button', { name: /remove file/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('file selected state', () => {
    it('renders the filename when a file is provided', () => {
      const file = makeFile('john-doe-cv.pdf');
      render(<DropZone {...defaultProps} file={file} />);

      expect(screen.getByText('john-doe-cv.pdf')).toBeInTheDocument();
    });

    it('does not render the drop zone button when a file is provided', () => {
      const file = makeFile('john-doe-cv.pdf');
      render(<DropZone {...defaultProps} file={file} />);

      expect(
        screen.queryByRole('button', { name: /drop resume here/i }),
      ).not.toBeInTheDocument();
    });

    it('renders the remove button when a file is provided', () => {
      const file = makeFile('john-doe-cv.pdf');
      render(<DropZone {...defaultProps} file={file} />);

      expect(
        screen.getByRole('button', { name: /remove file/i }),
      ).toBeInTheDocument();
    });

    it('calls onFile(null) when the remove button is clicked', async () => {
      const user = userEvent.setup();
      const onFile = vi.fn();
      const file = makeFile('john-doe-cv.pdf');

      render(<DropZone {...defaultProps} file={file} onFile={onFile} />);

      await user.click(screen.getByRole('button', { name: /remove file/i }));

      expect(onFile).toHaveBeenCalledOnce();
      expect(onFile).toHaveBeenCalledWith(null);
    });
  });

  describe('file input — browse interaction', () => {
    it('calls onFile with the selected file when a file is chosen via input', async () => {
      const onFile = vi.fn();
      render(<DropZone {...defaultProps} onFile={onFile} />);

      // The hidden input is in the DOM — simulate change directly
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = makeFile('cover-letter.pdf');

      await userEvent.upload(input, file);

      expect(onFile).toHaveBeenCalledOnce();
      expect(onFile).toHaveBeenCalledWith(file);
    });

    it('does not call onFile when no file is selected (empty input change)', () => {
      const onFile = vi.fn();
      render(<DropZone {...defaultProps} onFile={onFile} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [] } });

      expect(onFile).not.toHaveBeenCalled();
    });
  });

  describe('drag & drop interactions', () => {
    it('applies the drag-active style class on dragOver', () => {
      render(<DropZone {...defaultProps} />);
      const dropButton = screen.getByRole('button', { name: /drop resume here/i });

      fireEvent.dragOver(dropButton, { preventDefault: vi.fn() });

      expect(dropButton.className).toContain('border-primary');
    });

    it('removes the drag-active style class on dragLeave', () => {
      render(<DropZone {...defaultProps} />);
      const dropButton = screen.getByRole('button', { name: /drop resume here/i });

      fireEvent.dragOver(dropButton, { preventDefault: vi.fn() });
      fireEvent.dragLeave(dropButton);

      expect(dropButton.className).toContain('border-border');
    });

    it('calls onFile with the dropped file when type matches acceptedTypes', () => {
      const onFile = vi.fn();
      render(<DropZone {...defaultProps} onFile={onFile} />);
      const dropButton = screen.getByRole('button', { name: /drop resume here/i });
      const file = makeFile('cv.pdf', 'application/pdf');

      fireEvent.drop(dropButton, {
        dataTransfer: { files: [file] },
      });

      expect(onFile).toHaveBeenCalledOnce();
      expect(onFile).toHaveBeenCalledWith(file);
    });

    it('does not call onFile when the dropped file type is not accepted', () => {
      const onFile = vi.fn();
      render(<DropZone {...defaultProps} onFile={onFile} />);
      const dropButton = screen.getByRole('button', { name: /drop resume here/i });
      const file = makeFile('photo.png', 'image/png');

      fireEvent.drop(dropButton, {
        dataTransfer: { files: [file] },
      });

      expect(onFile).not.toHaveBeenCalled();
    });

    it('resets dragging state after a drop', () => {
      render(<DropZone {...defaultProps} />);
      const dropButton = screen.getByRole('button', { name: /drop resume here/i });
      const file = makeFile('cv.pdf', 'application/pdf');

      fireEvent.dragOver(dropButton, { preventDefault: vi.fn() });
      fireEvent.drop(dropButton, { dataTransfer: { files: [file] } });

      // After drop, dragging is false — class should revert to non-dragging state
      expect(dropButton.className).not.toContain('bg-primary/10');
    });
  });

  describe('acceptedTypes customization', () => {
    it('accepts docx files when acceptedTypes includes the docx mime type', () => {
      const onFile = vi.fn();
      render(
        <DropZone
          {...defaultProps}
          onFile={onFile}
          acceptedTypes={DOCUMENT_MIMETYPES}
        />,
      );
      const dropButton = screen.getByRole('button', { name: /drop resume here/i });
      const docxMime =
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const file = makeFile('resume.docx', docxMime);

      fireEvent.drop(dropButton, { dataTransfer: { files: [file] } });

      expect(onFile).toHaveBeenCalledWith(file);
    });

    it('rejects pdf when acceptedTypes is restricted to plain text', () => {
      const onFile = vi.fn();
      render(
        <DropZone
          {...defaultProps}
          onFile={onFile}
          acceptedTypes={['text/plain']}
        />,
      );
      const dropButton = screen.getByRole('button', { name: /drop resume here/i });
      const file = makeFile('cv.pdf', 'application/pdf');

      fireEvent.drop(dropButton, { dataTransfer: { files: [file] } });

      expect(onFile).not.toHaveBeenCalled();
    });
  });

  describe('DOCUMENT_MIMETYPES export', () => {
    it('exports the expected mime types', () => {
      expect(DOCUMENT_MIMETYPES).toContain('application/pdf');
      expect(DOCUMENT_MIMETYPES).toContain(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      expect(DOCUMENT_MIMETYPES).toContain('text/plain');
    });
  });
});
