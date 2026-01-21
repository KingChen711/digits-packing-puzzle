"use client";

import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "../app/challenge-viewer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function ChallengeViewer() {
  const storageKey = "digits:lastChallengePage";
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window === "undefined") return 1;
    const saved = window.localStorage.getItem(storageKey);
    const page = Number(saved);
    return !Number.isNaN(page) && page >= 1 ? page : 1;
  });
  const [numPages, setNumPages] = useState<number | null>(null);
  const challengesPerPage = 4;

  // Persist current page
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, String(currentPage));
    }
  }, [currentPage]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    // Clamp to valid range if stored page > available pages
    setCurrentPage((prev) => Math.min(prev, numPages));
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (numPages && currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageSelect = (page: number) => {
    setCurrentPage(page);
  };

  const getLevelRangeForPage = (page: number) => {
    const start = (page - 1) * challengesPerPage + 1;
    const end = page * challengesPerPage;
    return `Levels ${start}-${end}`;
  };

  return (
    <div className="flex-col" style={{ height: "100%" }}>
      {/* Page Navigation */}
      <div className="pagination-container">
        <label className="pagination-label">Level Range:</label>
        <div className="pagination-controls-row">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            ← Prev
          </button>
          <select
            value={currentPage}
            onChange={(e) => handlePageSelect(Number(e.target.value))}
            className="pagination-select"
          >
            {Array.from({ length: numPages || 15 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {getLevelRangeForPage(i + 1)}
              </option>
            ))}
          </select>
          <button
            onClick={handleNextPage}
            disabled={!numPages || currentPage === numPages}
            className="pagination-btn"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Challenge Display */}
      <div className="challenge-display">
        <Document
          file="/challenges.pdf"
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="loading">Loading PDF...</div>}
          error={
            <div className="error">
              Failed to load PDF. Please check if challenges.pdf exists in the
              public folder.
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            width={400}
          />
        </Document>
      </div>
    </div>
  );
}
