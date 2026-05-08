'use client';

import { useState, useCallback } from 'react';
import { Download, Bookmark, X, Star } from 'lucide-react';

const STORAGE_KEY = 'bookmark_modal_hide_until';

interface Props {
  fileUrl: string;
  fileName: string;
  children: React.ReactNode;
}

export default function DownloadWithBookmark({ fileUrl, fileName, children }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const triggerDownload = useCallback((url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const hideUntil = localStorage.getItem(STORAGE_KEY);
    if (hideUntil && Date.now() < Number(hideUntil)) {
      // 모달 생략 → 바로 다운로드
      triggerDownload(fileUrl);
      return;
    }
    setPending(fileUrl);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    if (pending) triggerDownload(pending);
    setPending(null);
  };

  const handleHideMonth = () => {
    const until = Date.now() + 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, String(until));
    handleClose();
  };

  const [showShortcut, setShowShortcut] = useState(false);

  const handleBookmark = () => {
    // 브라우저 보안 정책상 JS로 직접 북마크 추가 불가 → 인라인 안내로 대체
    setShowShortcut(true);
  };

  if (!open) {
    return (
      <a href={fileUrl} onClick={handleClick} className="download-btn" download>
        {children}
      </a>
    );
  }

  return (
    <>
      <a href={fileUrl} onClick={handleClick} className="download-btn" download>
        {children}
      </a>

      {/* 모달 오버레이 */}
      <div className="bm-overlay" onClick={handleClose}>
        <div className="bm-modal" onClick={(e) => e.stopPropagation()}>
          {/* 닫기 버튼 */}
          <button className="bm-close" onClick={handleClose} aria-label="닫기">
            <X size={18} />
          </button>

          {/* 아이콘 */}
          <div className="bm-icon">
            <Star size={28} />
          </div>

          {/* 텍스트 */}
          <h3 className="bm-title">이 페이지 즐겨찾기에 추가하세요!</h3>
          <p className="bm-desc">
            수학주식은 수능·모의고사 기출문제를<br />
            무료로 제공합니다. 즐겨찾기하면<br />
            다음에도 빠르게 찾아올 수 있어요.
          </p>

          {/* CTA */}
          {!showShortcut ? (
            <button className="bm-btn-primary" onClick={handleBookmark}>
              <Bookmark size={16} />
              즐겨찾기 추가하기
            </button>
          ) : (
            <div className="bm-shortcut-box">
              <p className="bm-shortcut-title">키보드 단축키로 추가하세요</p>
              <div className="bm-shortcut-keys">
                <span className="bm-key-row">
                  <kbd>Ctrl</kbd><span>+</span><kbd>D</kbd>
                  <span className="bm-key-label">Windows / Linux</span>
                </span>
                <span className="bm-key-row">
                  <kbd>⌘</kbd><span>+</span><kbd>D</kbd>
                  <span className="bm-key-label">Mac</span>
                </span>
              </div>
            </div>
          )}

          {/* 다운로드 바로 진행 */}
          <button className="bm-btn-secondary" onClick={handleClose}>
            <Download size={14} />
            다운로드만 할게요
          </button>

          {/* 한 달간 열지 않기 */}
          <button className="bm-btn-ghost" onClick={handleHideMonth}>
            한 달간 열지 않기
          </button>
        </div>
      </div>
    </>
  );
}
