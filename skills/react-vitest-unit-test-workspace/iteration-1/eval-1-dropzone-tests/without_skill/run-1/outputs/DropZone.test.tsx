import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/tests/test-utils';
import { DropZone, DOCUMENT_MIMETYPES } from '@/features/home/components/DropZone';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePdfFile(name = 'resume.pdf') {
  return new File(['%PDF-1.4 fake content'], name, { type: 'application/pdf' });
}

function makeTextFile(name = 'resume.txt') {
  return new File(['plain text content'], name, { type: 'text/plain' });
}

function makeImageFile(name = 'photo.png') {
  return new File(['fake image'], name, { type: 'image/png' });
}

const DEFAULT_PROPS = {
  label: 'Resume',
  hint: 'Required · PDF, Word or TXT',
  dropText: 'Drop resume here',
  browseText: 'Browse',
  file: null,
  onFile: vi.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DropZone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  describe('rendering — empty state', () => {
    it('renders the label', () => {
      render(<DropZone {...DEFAULT_PROPS} />);
      expect(screen.getByText('Resume')).toBeInTheDocument();
    });

    it('renders the hint text', () => {
      render(<DropZone {...DEFAULT_PROPS} />);
      expect(screen.getByText('Required · PDF, Word or TXT')).toBeInTheDocument();
    });

    it('renders the drop zone button with dropText', () => {
      render(<DropZone {...DEFAULT_PROPS} />);
      expect(screen.getByText('Drop resume here')).toBeInTheDocument();
    });

    it('renders the browse button text', () => {
      render(<DropZone {...DEFAULT_PROPS} />);
      expect(screen.getByText('Browse')).toBeInTheDocument();
    });

    it('does NOT render the "Optional" badge when optional prop is absent', () => {
      render(<DropZone {...DEFAULT_PROPS} />);
      expect(screen.queryByText('Optional')).not.toBeInTheDocument();
    });

    it('renders the "Optional" badge when optional prop is true', () => {
      render(<DropZone {...DEFAULT_PROPS} optional />);
      expect(screen.getByText('Optional')).toBeInTheDocument();
    });

    it('does NOT render file info when no file is provided', () => {
      render(<DropZone {...DEFAULT_PROPS} />);
      expect(screen.queryByRole('button', { name: /remove file/i })).not.toBeInTheDocument();
    });
  });

  describe('rendering — file selected state', () => {
    it('shows the file name when a file is provided', () => {
      const file = makePdfFile('john-doe-cv.pdf');
      render(<DropZone {...DEFAULT_PROPS} file={file} />);
      expect(screen.getByText('john-doe-cv.pdf')).toBeInTheDocument();
    });

    it('hides the drop zone area when a file is provided', () => {
      const file = makePdfFile();
      render(<DropZone {...DEFAULT_PROPS} file={file} />);
      expect(screen.queryByText('Drop resume here')).not.toBeInTheDocument();
    });

    it('shows the remove button when a file is provided', () => {
      const file = makePdfFile();
      render(<DropZone {...DEFAULT_PROPS} file={file} />);
      expect(screen.getByRole('button', { name: /remove file/i })).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // DOCUMENT_MIMETYPES export
  // -------------------------------------------------------------------------

  describe('DOCUMENT_MIMETYPES constant', () => {
    it('includes application/pdf', () => {
      expect(DOCUMENT_MIMETYPES).toContain('application/pdf');
    });

    it('includes docx mimetype', () => {
      expect(DOCUMENT_MIMETYPES).toContain(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
    });

    it('includes text/plain', () => {
      expect(DOCUMENT_MIMETYPES).toContain('text/plain');
    });
  });

  // -------------------------------------------------------------------------
  // File selection via click / input change
  // -------------------------------------------------------------------------

  describe('file input — change event', () => {
    it('calls onFile with the selected file when a valid file is picked', async () => {
      const onFile = vi.fn();
      render(<DropZone {...DEFAULT_PROPS} onFile={onFile} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = makePdfFile();

      await userEvent.upload(input, file);

      expect(onFile).toHaveBeenCalledOnce();
      expect(onFile).toHaveBeenCalledWith(file);
    });

    it('calls onFile with a text file when text/plain is in acceptedTypes', async () => {
      const onFile = vi.fn();
      render(
        <DropZone
          {...DEFAULT_PROPS}
          onFile={onFile}
          acceptedTypes={['application/pdf', 'text/plain']}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = makeTextFile();

      await userEvent.upload(input, file);

      expect(onFile).toHaveBeenCalledWith(file);
    });
  });

  // -------------------------------------------------------------------------
  // Remove file
  // -------------------------------------------------------------------------

  describe('remove file button', () => {
    it('calls onFile(null) when the remove button is clicked', async () => {
      const onFile = vi.fn();
      const file = makePdfFile();
      render(<DropZone {...DEFAULT_PROPS} file={file} onFile={onFile} />);

      const removeBtn = screen.getByRole('button', { name: /remove file/i });
      await userEvent.click(removeBtn);

      expect(onFile).toHaveBeenCalledOnce();
      expect(onFile).toHaveBeenCalledWith(null);
    });
  });

  // -------------------------------------------------------------------------
  // Drag & drop interactions
  // -------------------------------------------------------------------------

  describe('drag and drop', () => {
    function getDropZoneButton() {
      // The drop zone is the button that contains the dropText
      return screen.getByRole('button', { name: /drop resume here/i });
    }

    it('accepts a valid PDF dropped onto the zone', () => {
      const onFile = vi.fn();
      render(<DropZone {...DEFAULT_PROPS} onFile={onFile} />);

      const file = makePdfFile();
      const dropZone = getDropZoneButton();

      fireEvent.dragOver(dropZone, {
        dataTransfer: { files: [file] },
      });
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });

      expect(onFile).toHaveBeenCalledWith(file);
    });

    it('does NOT call onFile when an invalid file type is dropped', () => {
      const onFile = vi.fn();
      render(<DropZone {...DEFAULT_PROPS} onFile={onFile} />);

      const file = makeImageFile();
      const dropZone = getDropZoneButton();

      fireEvent.dragOver(dropZone, {
        dataTransfer: { files: [file] },
      });
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });

      expect(onFile).not.toHaveBeenCalled();
    });

    it('applies dragging styles on dragOver and removes them on dragLeave', () => {
      render(<DropZone {...DEFAULT_PROPS} />);
      const dropZone = getDropZoneButton();

      // Before drag: should NOT have border-primary class (uses border-border)
      expect(dropZone.className).not.toContain('border-primary ');

      fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } });
      // After dragOver: should have dragging classes (border-primary, bg-primary/10)
      expect(dropZone.className).toContain('border-primary');

      fireEvent.dragLeave(dropZone);
      // After dragLeave: dragging class should be removed
      expect(dropZone.className).not.toContain('bg-primary/10');
    });

    it('removes dragging state after a successful drop', () => {
      render(<DropZone {...DEFAULT_PROPS} onFile={vi.fn()} />);
      const dropZone = getDropZoneButton();
      const file = makePdfFile();

      fireEvent.dragOver(dropZone, { dataTransfer: { files: [file] } });
      fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });

      expect(dropZone.className).not.toContain('bg-primary/10');
    });
  });

  // -------------------------------------------------------------------------
  // acceptedTypes prop
  // -------------------------------------------------------------------------

  describe('acceptedTypes prop', () => {
    it('defaults to application/pdf when acceptedTypes is not provided', () => {
      render(<DropZone {...DEFAULT_PROPS} />);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input.accept).toBe('application/pdf');
    });

    it('sets the input accept attribute to all provided mimetypes joined by commas', () => {
      render(
        <DropZone
          {...DEFAULT_PROPS}
          acceptedTypes={['application/pdf', 'text/plain']}
        />,
      );
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input.accept).toBe('application/pdf,text/plain');
    });

    it('rejects a drop of a type not in acceptedTypes', () => {
      const onFile = vi.fn();
      render(
        <DropZone
          {...DEFAULT_PROPS}
          onFile={onFile}
          acceptedTypes={['application/pdf']}
        />,
      );

      const dropZone = screen.getByRole('button', { name: /drop resume here/i });
      const docxFile = new File(['content'], 'doc.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      fireEvent.drop(dropZone, { dataTransfer: { files: [docxFile] } });

      expect(onFile).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  describe('accessibility', () => {
    it('the hidden file input is aria-hidden', () => {
      render(<DropZone {...DEFAULT_PROPS} />);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toHaveAttribute('aria-hidden', 'true');
    });

    it('the hidden file input has tabIndex -1', () => {
      render(<DropZone {...DEFAULT_PROPS} />);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input.tabIndex).toBe(-1);
    });

    it('the drop zone button has a descriptive aria-label containing label and dropText', () => {
      render(<DropZone {...DEFAULT_PROPS} />);
      const dropZone = screen.getByRole('button', { name: /drop resume here — resume/i });
      expect(dropZone).toBeInTheDocument();
    });

    it('the remove button has an aria-label', () => {
      const file = makePdfFile();
      render(<DropZone {...DEFAULT_PROPS} file={file} />);
      const removeBtn = screen.getByRole('button', { name: /remove file/i });
      expect(removeBtn).toBeInTheDocument();
    });
  });
});
