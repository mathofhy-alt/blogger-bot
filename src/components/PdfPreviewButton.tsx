"use client";

import { useState } from 'react';
import { Eye } from 'lucide-react';
import PdfViewerModal from './PdfViewerModal';

interface Props {
  fileUrl: string;
  fileName: string;
}

export default function PdfPreviewButton({ fileUrl, fileName }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        className="preview-btn"
        onClick={() => setIsOpen(true)}
        title="미리보기"
        aria-label="미리보기"
      >
        <Eye size={18} />
      </button>
      <PdfViewerModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        fileUrl={fileUrl}
        title={fileName}
      />
    </>
  );
}
