"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  Share2,
  X,
  FileText,
  Check,
  Scissors,
  Hand,
} from "lucide-react";
import ClippingModal from "./ClippingModal";

interface EpaperReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  editionTitle: string;
  editionSubtitle?: string;
  editionDate?: string;
}

interface PdfRenderTask {
  promise: Promise<void>;
  cancel: () => void;
}

interface PdfPageProxy {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => PdfRenderTask;
}

interface PdfDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageProxy>;
}

export default function EpaperReaderModal({
  isOpen,
  onClose,
  pdfUrl,
  editionTitle,
  editionSubtitle,
  editionDate,
}: EpaperReaderModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportWrapperRef = useRef<HTMLDivElement | null>(null);

  const [pdfDoc, setPdfDoc] = useState<PdfDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.25);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Interaction modes: 'pan' | 'select' | 'clip'
  const [toolMode, setToolMode] = useState<"pan" | "clip">("pan");

  // Clipping tool state
  const [isDraggingClip, setIsDraggingClip] = useState<boolean>(false);
  const [clipStart, setClipStart] = useState<{ x: number; y: number } | null>(null);
  const [clipCurrent, setClipCurrent] = useState<{ x: number; y: number } | null>(null);
  const [clippedImageUrl, setClippedImageUrl] = useState<string | null>(null);
  const [isClipModalOpen, setIsClipModalOpen] = useState<boolean>(false);

  // Pan / Drag scroll state
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  const currentRenderTaskRef = useRef<PdfRenderTask | null>(null);

  // Initialize PDF.js document when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function loadPdf() {
      setLoading(true);
      setError(null);

      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const loadingTask = pdfjs.getDocument({
          url: pdfUrl,
          cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/",
          cMapPacked: true,
        });

        const doc = (await loadingTask.promise) as unknown as PdfDocumentProxy;
        if (isMounted) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
          setLoading(false);
        }
      } catch (err: unknown) {
        console.error("PDF loading error:", err);
        if (isMounted) {
          setError(
            "పిడిఎఫ్ ఫైల్ లోడ్ చేయడంలో సమస్య ఏర్పడింది. దయచేసి మళ్లీ ప్రయత్నించండి లేదా డౌన్‌లోడ్ చేయండి."
          );
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isMounted = false;
      setPdfDoc(null);
      setCurrentPage(1);
    };
  }, [isOpen, pdfUrl]);

  // Page navigation callbacks
  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => (prev < numPages ? prev + 1 : prev));
  }, [numPages]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isClipModalOpen) {
          setIsClipModalOpen(false);
        } else if (toolMode === "clip") {
          setToolMode("pan");
        } else {
          onClose();
        }
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        goToNextPage();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        goToPrevPage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isClipModalOpen, toolMode, goToNextPage, goToPrevPage, onClose]);

  // Render current page onto canvas with Retina / High-DPI support
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isCancelled = false;

    async function renderPage() {
      try {
        if (currentRenderTaskRef.current) {
          currentRenderTaskRef.current.cancel();
        }

        const page = await pdfDoc!.getPage(currentPage);
        if (isCancelled || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        const viewport = page.getViewport({ scale });

        // Set display resolution (high-DPI)
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderTask = page.render({
          canvasContext: context,
          viewport: viewport,
        });

        currentRenderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err: unknown) {
        const isCancel =
          err &&
          typeof err === "object" &&
          "name" in err &&
          (err as { name: string }).name === "RenderingCancelledException";
        if (!isCancel) {
          console.error("Page rendering error:", err);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (currentRenderTaskRef.current) {
        currentRenderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, currentPage, scale]);

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.5));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.6));
  };

  // Fit to screen width for natural column scrolling
  const fitToWidth = () => {
    if (viewportWrapperRef.current) {
      const containerWidth = viewportWrapperRef.current.clientWidth - 48;
      // standard document width ~600px at scale 1.0
      const calculatedScale = Math.max(containerWidth / 620, 0.7);
      setScale(calculatedScale);
    }
  };

  // Fit whole page to viewport height
  const fitToPage = () => {
    if (viewportWrapperRef.current) {
      const containerHeight = viewportWrapperRef.current.clientHeight - 64;
      // standard document height ~840px at scale 1.0
      const calculatedScale = Math.max(containerHeight / 840, 0.6);
      setScale(calculatedScale);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullScreen(false);
    }
  };

  // -------------------------------------------------------------
  // Pan / Drag to scroll handlers
  // -------------------------------------------------------------
  const handleMouseDownPan = (e: React.MouseEvent<HTMLDivElement>) => {
    if (toolMode !== "pan" || !viewportWrapperRef.current) return;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: viewportWrapperRef.current.scrollLeft,
      scrollTop: viewportWrapperRef.current.scrollTop,
    };
  };

  const handleMouseMovePan = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning || toolMode !== "pan" || !viewportWrapperRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    viewportWrapperRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
    viewportWrapperRef.current.scrollTop = panStartRef.current.scrollTop - dy;
  };

  const handleMouseUpPan = () => {
    setIsPanning(false);
  };

  // -------------------------------------------------------------
  // Scissors / Rectangular Clipping Tool Handlers
  // -------------------------------------------------------------
  const handleClipMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (toolMode !== "clip" || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDraggingClip(true);
    setClipStart({ x, y });
    setClipCurrent({ x, y });
  };

  const handleClipMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingClip || toolMode !== "clip" || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    setClipCurrent({ x, y });
  };

  const handleClipMouseUp = () => {
    if (!isDraggingClip || !clipStart || !clipCurrent || !canvasRef.current) {
      setIsDraggingClip(false);
      return;
    }

    setIsDraggingClip(false);

    const x1 = Math.min(clipStart.x, clipCurrent.x);
    const y1 = Math.min(clipStart.y, clipCurrent.y);
    const width = Math.abs(clipCurrent.x - clipStart.x);
    const height = Math.abs(clipCurrent.y - clipStart.y);

    // Require minimum selection of 30x30 pixels
    if (width < 30 || height < 30) {
      setClipStart(null);
      setClipCurrent(null);
      return;
    }

    // Extract clipping from source canvas with authentic branding banner
    generateClippingImage(x1, y1, width, height);
    setClipStart(null);
    setClipCurrent(null);
  };

  const generateClippingImage = (
    cssX: number,
    cssY: number,
    cssWidth: number,
    cssHeight: number
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const sourceX = Math.floor(cssX * scaleX);
    const sourceY = Math.floor(cssY * scaleY);
    const sourceW = Math.floor(cssWidth * scaleX);
    const sourceH = Math.floor(cssHeight * scaleY);

    const bannerHeaderHeight = 44;
    const bannerFooterHeight = 26;
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = sourceW;
    outputCanvas.height = sourceH + bannerHeaderHeight + bannerFooterHeight;

    const ctx = outputCanvas.getContext("2d");
    if (!ctx) return;

    // Fill background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

    // 1. Draw top brand masthead banner
    ctx.fillStyle = "#0f2b5c";
    ctx.fillRect(0, 0, outputCanvas.width, bannerHeaderHeight);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px 'Noto Serif Telugu', serif, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText("జనసైన్యం దినపత్రిక", 14, 22);

    ctx.fillStyle = "#bfdbfe";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("TELUGU DAILY NEWSPAPER", outputCanvas.width - 14, 22);

    // 2. Draw cropped news article from PDF canvas
    ctx.drawImage(
      canvas,
      sourceX,
      sourceY,
      sourceW,
      sourceH,
      0,
      bannerHeaderHeight,
      sourceW,
      sourceH
    );

    // 3. Draw bottom footer banner
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, bannerHeaderHeight + sourceH, outputCanvas.width, bannerFooterHeight);

    ctx.strokeStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(0, bannerHeaderHeight + sourceH);
    ctx.lineTo(outputCanvas.width, bannerHeaderHeight + sourceH);
    ctx.stroke();

    ctx.fillStyle = "#64748b";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("నిజమైన ప్రజా గళం • epaper.janasainyam.in", 14, bannerHeaderHeight + sourceH + 13);

    // Convert to PNG data URL and show modal
    const dataUrl = outputCanvas.toDataURL("image/png");
    setClippedImageUrl(dataUrl);
    setIsClipModalOpen(true);
    setToolMode("pan"); // return to pan mode after clipping
  };

  const handleShare = async () => {
    const shareData = {
      title: "జనసైన్యం దినపత్రిక ఈ-పేపర్",
      text: "జనసైన్యం తాజా ఈ-పేపర్ ఎడిషన్ చదవండి",
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Ignored
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (!isOpen) return null;

  // Calculate selection box style in CSS pixels
  const clipBoxStyle =
    clipStart && clipCurrent
      ? {
          left: `${Math.min(clipStart.x, clipCurrent.x)}px`,
          top: `${Math.min(clipStart.y, clipCurrent.y)}px`,
          width: `${Math.abs(clipCurrent.x - clipStart.x)}px`,
          height: `${Math.abs(clipCurrent.y - clipStart.y)}px`,
        }
      : null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col h-screen w-screen overflow-hidden text-white select-none"
    >
      {/* 1. Reader Master Top Toolbar */}
      <div className="bg-[#0f2b5c] border-b border-[#1b3d7d] px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 shrink-0 shadow-md z-30">
        {/* Left: Close & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs sm:text-sm font-medium transition cursor-pointer"
            title="హోమ్‌కి తిరిగి వెళ్ళండి (Back to Home)"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline font-telugu">మూసివేయి</span>
          </button>

          <div className="border-l border-white/20 pl-3 min-w-0">
            <h2 className="text-xs sm:text-sm font-bold font-telugu truncate">
              {editionTitle}
            </h2>
            {editionSubtitle && (
              <p className="text-[11px] text-blue-200 truncate hidden lg:block">
                {editionSubtitle}
              </p>
            )}
          </div>
        </div>

        {/* Center: Page Navigation Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="మునుపటి పేజీ (Previous Page)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 px-2.5 py-1 bg-black/40 rounded text-xs sm:text-sm font-medium font-telugu">
            <span>పేజీ</span>
            <select
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              className="bg-transparent text-white font-bold cursor-pointer focus:outline-hidden"
            >
              {Array.from({ length: numPages || 1 }, (_, i) => i + 1).map((p) => (
                <option key={p} value={p} className="bg-slate-900 text-white">
                  {p}
                </option>
              ))}
            </select>
            <span className="text-blue-300">/ {numPages || "..."}</span>
          </div>

          <button
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="తరువాతి పేజీ (Next Page)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Tools (Scissors/Clipping, Hand, Zoom, Download, Share) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Tool Mode Toggles: Hand/Pan vs Scissors/Clip */}
          <div className="flex items-center bg-black/30 p-0.5 rounded border border-white/10">
            <button
              onClick={() => setToolMode("pan")}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded flex items-center gap-1 text-xs transition cursor-pointer ${
                toolMode === "pan"
                  ? "bg-blue-600 text-white font-bold"
                  : "text-slate-300 hover:text-white"
              }`}
              title="చదవడానికి స్క్రోల్ చేయండి (Scroll / Pan tool)"
            >
              <Hand className="w-3.5 h-3.5" />
              <span className="hidden xl:inline font-telugu">స్క్రోల్</span>
            </button>

            {/* SCISSORS / CLIPPING BUTTON */}
            <button
              onClick={() => setToolMode("clip")}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded flex items-center gap-1 text-xs transition cursor-pointer ${
                toolMode === "clip"
                  ? "bg-[#c9182b] text-white font-bold animate-pulse"
                  : "text-slate-300 hover:text-white"
              }`}
              title="వార్త భాగాన్ని కత్తిరించండి (Scissors / Clipping tool)"
            >
              <Scissors className="w-3.5 h-3.5 text-yellow-300" />
              <span className="font-telugu font-bold">కత్తిరింపు (Clip)</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="hidden lg:flex items-center gap-1 bg-black/30 p-0.5 rounded">
            <button
              onClick={zoomOut}
              className="p-1.5 hover:bg-white/20 rounded transition cursor-pointer"
              title="జూమ్ తగ్గించు (Zoom Out)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs px-1.5 font-mono">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-1.5 hover:bg-white/20 rounded transition cursor-pointer"
              title="జూమ్ పెంచు (Zoom In)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={fitToWidth}
              className="px-2 py-1 text-xs hover:bg-white/20 rounded font-telugu transition cursor-pointer"
              title="స్క్రీన్ వెడల్పుకు సరిపోల్చు (Fit Width)"
            >
              వెడల్పు
            </button>
            <button
              onClick={fitToPage}
              className="px-2 py-1 text-xs hover:bg-white/20 rounded font-telugu transition cursor-pointer"
              title="మొత్తం పేజీని సరిపోల్చు (Fit Page)"
            >
              పూర్తి
            </button>
          </div>

          {/* Thumbnails Sidebar Toggle */}
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
              showThumbnails ? "bg-blue-600 text-white" : "bg-white/10 hover:bg-white/20 text-white"
            }`}
            title="పేజీల సూచిక (Thumbnails)"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden xl:inline font-telugu">పేజీలు</span>
          </button>

          {/* Download Direct */}
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            download="janasainyam-epaper.pdf"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium flex items-center gap-1 transition cursor-pointer"
            title="పూర్తి ఈ-పేపర్ పిడిఎఫ్ డౌన్‌లోడ్ చేయండి"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline font-telugu">డౌన్‌లోడ్</span>
          </a>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1 transition cursor-pointer"
            title="షేర్ చేయండి"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden md:inline font-telugu">
              {copiedLink ? "కాపీ అయింది!" : "షేర్"}
            </span>
          </button>

          {/* Full Screen */}
          <button
            onClick={toggleFullScreen}
            className="p-1.5 hover:bg-white/20 rounded transition cursor-pointer hidden sm:block"
            title="ఫుల్‌స్క్రీన్"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Scissors Mode Interactive Help Banner */}
      {toolMode === "clip" && (
        <div className="bg-[#c9182b] text-white py-1.5 px-4 text-xs font-telugu flex items-center justify-between shadow-md shrink-0 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-yellow-300" />
            <span className="font-bold">కత్తిరింపు మోడ్ (Clipping Mode Active):</span>
            <span>పేజీపై కావలసిన వార్త లేదా ప్రకటన భాగాన్ని మౌస్‌తో లేదా వేలితో బాక్స్‌లా డ్రాగ్ చేయండి.</span>
          </div>
          <button
            onClick={() => setToolMode("pan")}
            className="px-2.5 py-0.5 bg-black/30 hover:bg-black/50 text-white rounded text-xs transition cursor-pointer font-bold"
          >
            రద్దు (Cancel)
          </button>
        </div>
      )}

      {/* 2. Main Reader Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Optional Page Thumbnails Drawer */}
        {showThumbnails && (
          <aside className="w-48 sm:w-60 bg-slate-900 border-r border-slate-800 p-3 overflow-y-auto shrink-0 flex flex-col gap-3 z-20">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-telugu">
              అన్ని పేజీలు ({numPages})
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`p-2 rounded border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    pageNum === currentPage
                      ? "border-blue-500 bg-blue-950/60 text-white font-bold"
                      : "border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <FileText className="w-5 h-5 text-blue-400" />
                  <span className="text-xs font-telugu">పేజీ {pageNum}</span>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Floating Quick Page Flip Chevrons (Desktop & Tablet) */}
        {currentPage > 1 && (
          <button
            onClick={goToPrevPage}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-[#0f2b5c] text-white shadow-xl transition backdrop-blur-xs hidden md:flex items-center justify-center"
            title="మునుపటి పేజీ"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {currentPage < numPages && (
          <button
            onClick={goToNextPage}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-[#0f2b5c] text-white shadow-xl transition backdrop-blur-xs hidden md:flex items-center justify-center"
            title="తరువాతి పేజీ"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Scrollable & Pannable PDF Workspace */}
        <div
          ref={viewportWrapperRef}
          onMouseDown={handleMouseDownPan}
          onMouseMove={handleMouseMovePan}
          onMouseUp={handleMouseUpPan}
          className={`flex-1 overflow-auto bg-slate-900 p-2 sm:p-8 flex flex-col items-center justify-start overscroll-contain transition-colors ${
            toolMode === "pan"
              ? isPanning
                ? "cursor-grabbing"
                : "cursor-grab"
              : "cursor-crosshair"
          }`}
          style={{
            touchAction: toolMode === "pan" ? "pan-x pan-y" : "none",
          }}
        >
          {loading && (
            <div className="absolute inset-0 bg-slate-950/70 z-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <p className="font-telugu text-sm text-blue-200">
                ఈ-పేపర్ పిడిఎఫ్ లోడ్ అవుతోంది...
              </p>
            </div>
          )}

          {error ? (
            <div className="my-auto max-w-md p-6 bg-slate-800 border border-red-500/30 rounded-lg text-center space-y-4">
              <p className="text-red-400 text-sm font-telugu">{error}</p>
              <div className="flex justify-center gap-3">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-telugu font-semibold"
                >
                  బయటి విండోలో తెరవండి
                </a>
              </div>
            </div>
          ) : (
            <div
              className="relative shadow-2xl border border-slate-700 rounded-xs bg-white my-auto max-w-none transition-shadow"
              onMouseDown={handleClipMouseDown}
              onMouseMove={handleClipMouseMove}
              onMouseUp={handleClipMouseUp}
            >
              {/* PDF Canvas */}
              <canvas ref={canvasRef} className="block max-w-none pointer-events-auto" />

              {/* Scissors Drag Overlay Box */}
              {toolMode === "clip" && clipBoxStyle && (
                <div
                  className="absolute border-2 border-dashed border-[#c9182b] bg-[#c9182b]/20 pointer-events-none shadow-sm flex items-start justify-end p-1"
                  style={clipBoxStyle}
                >
                  <span className="bg-[#c9182b] text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-bold leading-none">
                    CLIP
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Mobile Touch Reading & Quick Navigation Bar */}
      <div className="sm:hidden bg-[#0a1c3d] border-t border-[#1b3d7d] px-3 py-2 flex items-center justify-between text-xs z-30">
        <button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 rounded disabled:opacity-30 font-telugu"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>మునుపటి</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Quick Fit Width on Mobile */}
          <button
            onClick={fitToWidth}
            className="px-2 py-1 bg-white/10 rounded font-telugu text-[11px]"
            title="వెడల్పుకు సరిపోల్చు"
          >
            ఫిట్
          </button>

          {/* Quick Scissors on Mobile */}
          <button
            onClick={() => setToolMode(toolMode === "clip" ? "pan" : "clip")}
            className={`px-2 py-1 rounded font-telugu text-[11px] flex items-center gap-1 ${
              toolMode === "clip" ? "bg-[#c9182b] text-white font-bold" : "bg-white/10 text-slate-200"
            }`}
          >
            <Scissors className="w-3.5 h-3.5 text-yellow-300" />
            <span>కత్తిరింపు</span>
          </button>

          <span className="font-telugu font-medium text-blue-200 text-xs">
            {currentPage} / {numPages || 1}
          </span>
        </div>

        <button
          onClick={goToNextPage}
          disabled={currentPage >= numPages}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 rounded disabled:opacity-30 font-telugu"
        >
          <span>తరువాతి</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 4. Clipping Preview, Share & Download Modal */}
      {clippedImageUrl && (
        <ClippingModal
          isOpen={isClipModalOpen}
          onClose={() => {
            setIsClipModalOpen(false);
            setClippedImageUrl(null);
          }}
          imageUrl={clippedImageUrl}
          editionTitle={editionTitle}
          editionDate={editionDate}
        />
      )}
    </div>
  );
}
