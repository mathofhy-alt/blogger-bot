"use client";

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { X, ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut } from 'lucide-react';

// Set worker to avoid Webpack/Turbopack issues in Next.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  title: string;
}

export default function PdfViewerModal({ isOpen, onClose, fileUrl, title }: Props) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  // 모달 오픈 시 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setPageNumber(1);
      setScale(1.0);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const handlePrev = () => setPageNumber(p => Math.max(1, p - 1));
  const handleNext = () => setPageNumber(p => Math.min(numPages || 1, p + 1));
  const handleZoomIn = () => setScale(s => Math.min(3.0, s + 0.25));
  const handleZoomOut = () => setScale(s => Math.max(0.5, s - 0.25));

  return (
    <div className="pdf-modal-overlay">
      <header className="pdf-modal-header">
        <h3 className="pdf-modal-title">
          <span className="pdf-page-info">미리보기</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--color-muted)', fontWeight: 400 }}>{title}</span>
        </h3>
        <button onClick={onClose} className="pdf-modal-close" aria-label="닫기">
          <X size={24} />
        </button>
      </header>

      <div className="pdf-modal-body">
        <div className="pdf-document-wrapper">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div style={{ padding: '40px', display: 'flex', gap: '8px', alignItems: 'center' }}><Loader2 className="animate-spin" /> PDF 로딩 중...</div>}
            error={<div style={{ padding: '40px', color: 'red' }}>PDF를 불러오지 못했습니다.</div>}
          >
            <Page 
              pageNumber={pageNumber} 
              renderTextLayer={false} 
              renderAnnotationLayer={false}
              width={Math.min(window.innerWidth - 48, 800)}
              scale={scale}
            />
          </Document>
        </div>
      </div>

      <footer className="pdf-modal-controls">
        <button onClick={handleZoomOut} className="pdf-page-btn" title="축소">
          <ZoomOut size={18} />
        </button>
        <button 
          onClick={handlePrev} 
          disabled={pageNumber <= 1} 
          className="pdf-page-btn"
        >
          <ChevronLeft size={18} /> 이전
        </button>
        <span className="pdf-page-info">
          {pageNumber} / {numPages || '?'}
        </span>
        <button 
          onClick={handleNext} 
          disabled={numPages ? pageNumber >= numPages : true} 
          className="pdf-page-btn"
        >
          다음 <ChevronRight size={18} />
        </button>
        <button onClick={handleZoomIn} className="pdf-page-btn" title="확대">
          <ZoomIn size={18} />
        </button>
      </footer>
    </div>
  );
}
