import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion } from 'motion/react';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, X, Eye, EyeOff } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  filePath: string;
  fileName: string;
  annotations: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  onClose: () => void;
}

interface ScribbleAnnotation {
  type: 'arrow' | 'strike' | 'circle' | 'underline';
  text: string;
  color: string;
  message: string;
}

export default function ResumeViewer({ filePath, fileName, annotations, matchedKeywords, missingKeywords, onClose }: Props) {
  const [numPages, setNumPages] = useState<number>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate parsed annotations from backend annotations or from missingKeywords
  const parsedAnnotations: ScribbleAnnotation[] = React.useMemo(() => {
    const parsed: ScribbleAnnotation[] = [];

    // Parse existing annotations from backend
    if (annotations && annotations.length > 0) {
      annotations.forEach(ann => {
        if (typeof ann !== 'string') return;
        if (ann.includes('[ARROW')) {
          const match = ann.match(/\[ARROW: add keyword: ([^\]]+)\]/);
          parsed.push({
            type: 'arrow' as const,
            text: match?.[1] || '',
            color: '#ef4444',
            message: 'Missing keyword - add this to your resume'
          });
        } else if (ann.includes('[STRIKE')) {
          const match = ann.match(/\[STRIKE: ([^\]]+)\]/);
          parsed.push({
            type: 'strike' as const,
            text: match?.[1] || '',
            color: '#f97316',
            message: 'Weak phrasing - consider stronger wording'
          });
        } else if (ann.includes('[CIRCLE')) {
          const match = ann.match(/\[CIRCLE: ([^\]]+)\]/);
          parsed.push({
            type: 'circle' as const,
            text: match?.[1] || '',
            color: '#8b5cf6',
            message: 'Important - review this section'
          });
        } else if (ann.includes('[MISSING]')) {
          const match = ann.match(/\[MISSING: ([^\]]+)\]/);
          parsed.push({
            type: 'underline' as const,
            text: match?.[1] || '',
            color: '#eab308',
            message: 'Section missing from resume'
          });
        } else if (ann.includes('missing section')) {
          const match = ann.match(/missing section - ([^\]]+)/i);
          parsed.push({
            type: 'underline' as const,
            text: match?.[1] || ann,
            color: '#eab308',
            message: 'Missing section - add this to your resume'
          });
        } else if (ann.includes('[NOTE')) {
          const match = ann.match(/\[NOTE: ([^\]]+)\]/);
          parsed.push({
            type: 'circle' as const,
            text: match?.[1] || ann,
            color: '#8b5cf6',
            message: match ? 'Formatting tip' : ann
          });
        }
      });
    }

    // Also add annotations from missingKeywords directly
    if (missingKeywords && missingKeywords.length > 0 && parsed.length === 0) {
      missingKeywords.slice(0, 5).forEach((kw: string) => {
        parsed.push({
          type: 'arrow' as const,
          text: kw,
          color: '#ef4444',
          message: 'Missing keyword - add this to your resume'
        });
      });
    }

    return parsed;
  }, [annotations, missingKeywords]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const getAnnotationIcon = (type: string) => {
    switch (type) {
      case 'arrow': return '→';
      case 'strike': return '̶';
      case 'circle': return '◯';
      case 'underline': return '_';
      default: return '•';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-6xl h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Resume with Scribbles</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{fileName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAnnotations(!showAnnotations)}
              className={`p-2 rounded-lg transition-colors ${showAnnotations ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}
              title={showAnnotations ? 'Hide annotations' : 'Show annotations'}
            >
              {showAnnotations ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* PDF Viewer */}
          <div ref={containerRef} className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-800 p-8 flex justify-center">
            {filePath.startsWith('blob:') ? (
              <Document
                file={filePath}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex items-center justify-center h-96">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center h-96 text-slate-500">
                    <Eye className="w-16 h-16 mb-4" />
                    <p className="font-bold">Unable to load resume</p>
                    <p className="text-sm">The file could not be displayed</p>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  className="shadow-2xl"
                  renderTextLayer={true}
                  renderAnnotationLayer={false}
                />
              </Document>
            ) : (
              <Document
                file={`http://localhost:5001/uploads/${filePath}`}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex flex-col items-center justify-center h-96">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-sm text-slate-500">Loading PDF...</p>
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center h-96 text-slate-500">
                    <Eye className="w-16 h-16 mb-4" />
                    <p className="font-bold">Unable to load PDF</p>
                    <p className="text-xs mt-2 text-red-400">URL: uploads/{filePath}</p>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  className="shadow-2xl"
                  renderTextLayer={true}
                  renderAnnotationLayer={false}
                />
              </Document>
            )}
          </div>

          {/* Annotations Sidebar */}
          <div className="w-80 border-l border-slate-200 dark:border-slate-700 overflow-y-auto p-4 bg-white dark:bg-slate-900">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
              </svg>
              Scribbles & Notes
            </h3>

            {parsedAnnotations.length > 0 ? (
              <div className="space-y-3">
                {parsedAnnotations.map((ann, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 rounded-xl border-2"
                    style={{
                      borderColor: ann.color,
                      backgroundColor: `${ann.color}10`
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ backgroundColor: ann.color }}
                      >
                        {getAnnotationIcon(ann.type)}
                      </span>
                      <span className="font-bold text-sm" style={{ color: ann.color }}>
                        {ann.type.charAt(0).toUpperCase() + ann.type.slice(1)}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                      "{ann.text}"
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {ann.message}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">No issues found!</p>
              </div>
            )}

            {/* Keywords Summary */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3">Keywords</h4>
              <div className="space-y-3">
                {missingKeywords.length > 0 && (
                  <div>
                    <p className="text-xs text-red-500 font-bold mb-2">Missing:</p>
                    <div className="flex flex-wrap gap-1">
                      {missingKeywords.slice(0, 8).map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs font-bold"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {matchedKeywords.length > 0 && (
                  <div>
                    <p className="text-xs text-green-500 font-bold mb-2">Matched:</p>
                    <div className="flex flex-wrap gap-1">
                      {matchedKeywords.slice(0, 8).map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded text-xs font-bold"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale(Math.max(0.5, scale - 0.2))}
              className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(Math.min(2, scale + 0.2))}
              className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
              disabled={pageNumber <= 1}
              className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
              Page {pageNumber} of {numPages || '?'}
            </span>
            <button
              onClick={() => setPageNumber(Math.min(numPages || 1, pageNumber + 1))}
              disabled={pageNumber >= (numPages || 1)}
              className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-sm text-slate-500 dark:text-slate-400">
            {parsedAnnotations.length} scribbles found
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Check(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}