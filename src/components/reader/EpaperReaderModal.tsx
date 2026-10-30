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

  // Touch handlers for mobile pinch-to-zoom and double-tap
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1.25);
  const lastTapTimeRef = useRef<number>(0);

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

          // Calculate default fit scale so each page fits screen width automatically with border margin
          try {
            const pageOne = await doc.getPage(1);
            const naturalViewport = pageOne.getViewport({ scale: 1.0 });
            const screenW = typeof window !== "undefined"
              ? (viewportWrapperRef.current?.clientWidth || window.innerWidth) - (window.innerWidth < 640 ? 32 : 48)
              : 540;
            const autoFitScale = Math.min(Math.max(screenW / naturalViewport.width, 0.35), 2.2);
            setScale(parseFloat(autoFitScale.toFixed(2)));
          } catch {
            const screenW = typeof window !== "undefined" ? window.innerWidth - 32 : 540;
            setScale(parseFloat(Math.max(screenW / 600, 0.45).toFixed(2)));
          }

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

  // Page navigation callbacks - with scroll reset to top
  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => {
      const next = prev > 1 ? prev - 1 : prev;
      if (viewportWrapperRef.current) {
        viewportWrapperRef.current.scrollTop = 0;
      }
      return next;
    });
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => {
      const next = prev < numPages ? prev + 1 : prev;
      if (viewportWrapperRef.current) {
        viewportWrapperRef.current.scrollTop = 0;
      }
      return next;
    });
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

  // Fit to screen width for natural column scrolling and complete page fit with border margin
  const fitToWidth = useCallback(async () => {
    if (!viewportWrapperRef.current) return;
    const padding = typeof window !== "undefined" && window.innerWidth < 640 ? 32 : 48;
    const containerWidth = viewportWrapperRef.current.clientWidth - padding;
    if (pdfDoc) {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const naturalViewport = page.getViewport({ scale: 1.0 });
        const autoScale = Math.min(Math.max(containerWidth / naturalViewport.width, 0.35), 2.5);
        setScale(parseFloat(autoScale.toFixed(2)));
        return;
      } catch {
        // fallback
      }
    }
    const calculatedScale = Math.max(containerWidth / 600, 0.45);
    setScale(parseFloat(calculatedScale.toFixed(2)));
  }, [pdfDoc, currentPage]);

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

  // Touch clipping handlers for mobile touchscreens
  const handleClipTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (toolMode !== "clip" || !canvasRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(touch.clientY - rect.top, rect.height));

    setIsDraggingClip(true);
    setClipStart({ x, y });
    setClipCurrent({ x, y });
  };

  const handleClipTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingClip || toolMode !== "clip" || !canvasRef.current || e.touches.length === 0) return;
    if (e.cancelable) {
      e.preventDefault();
    }
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(touch.clientY - rect.top, rect.height));
    setClipCurrent({ x, y });
  };

  const handleClipTouchEnd = () => {
    handleClipMouseUp();
  };

  // Touch handlers for Pinch-to-Zoom and Double-Tap on Mobile Viewport
  const handleViewportTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (toolMode === "clip") return; // Let clipping handle touches in clip mode

    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDistRef.current = dist;
      pinchStartScaleRef.current = scale;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapTimeRef.current < 320) {
        // Double tap: toggle zoom between fit width and 2.2x
        setScale((prev) => (prev > 1.6 ? 1.0 : 2.2));
        lastTapTimeRef.current = 0;
      } else {
        lastTapTimeRef.current = now;
      }
    }
  };

  const handleViewportTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (toolMode === "clip") return;
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / pinchStartDistRef.current;
      const target = Math.min(Math.max(pinchStartScaleRef.current * ratio, 0.6), 3.5);
      setScale(parseFloat(target.toFixed(2)));
    }
  };

  const handleViewportTouchEnd = () => {
    pinchStartDistRef.current = null;
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
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col h-[100dvh] w-screen overflow-hidden text-white select-none"
    >
      {/* 1. Reader Master Top Toolbar */}
      <div className="bg-[#0f2b5c] border-b border-[#1b3d7d] px-2.5 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 shrink-0 shadow-md z-30">
        {/* Left: Close & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-full text-xs sm:text-sm font-medium transition cursor-pointer shrink-0"
            title="హోమ్‌కి తిరిగి వెళ్ళండి (Back to Home)"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline font-telugu">మూసివేయి</span>
          </button>

          <div className="border-l border-white/20 pl-2 sm:pl-3 min-w-0">
            <h2 className="text-xs sm:text-sm font-bold font-telugu truncate max-w-[120px] sm:max-w-xs md:max-w-md">
              {editionTitle}
            </h2>
            {editionSubtitle && (
              <p className="text-[11px] text-blue-200 truncate hidden lg:block">
                {editionSubtitle}
              </p>
            )}
          </div>
        </div>

        {/* Center: Desktop Page Navigation Controls (Hidden on mobile, mobile uses bottom dock) */}
        <div className="hidden md:flex items-center gap-1 sm:gap-2">
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

        {/* Right: Tools (Crop Icon Only, Zoom, Download, Share) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* CROP TOOL TOGGLE BUTTON - ICON ONLY (no text) */}
          <button
            onClick={() => setToolMode(toolMode === "clip" ? "pan" : "clip")}
            className={`w-9 h-9 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 rounded-full flex items-center justify-center transition cursor-pointer ${
              toolMode === "clip"
                ? "bg-[#c9182b] text-white ring-2 ring-yellow-400 shadow-md animate-pulse"
                : "bg-white/10 hover:bg-white/20 text-yellow-300 hover:text-yellow-200"
            }`}
            title="వార్తను కత్తిరించండి (Crop / Clip Tool)"
            aria-label="Crop Tool"
          >
            <Scissors className="w-4 h-4" />
          </button>

          {/* Desktop Zoom Controls */}
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

          {/* Thumbnails Sidebar Toggle (Desktop) */}
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`hidden md:flex p-1.5 sm:px-2.5 sm:py-1.5 rounded text-xs font-medium items-center gap-1 transition cursor-pointer ${
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
            className="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer"
            title="పూర్తి ఈ-పేపర్ పిడిఎఫ్ డౌన్‌లోడ్ చేయండి"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline font-telugu">డౌన్‌లోడ్</span>
          </a>

          {/* Share */}
          <button
            onClick={handleShare}
            className="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer"
            title="షేర్ చేయండి"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden md:inline font-telugu">
              {copiedLink ? "కాపీ అయింది!" : "షేర్"}
            </span>
          </button>

          {/* Full Screen (Desktop) */}
          <button
            onClick={toggleFullScreen}
            className="w-9 h-9 rounded-full hover:bg-white/20 transition cursor-pointer hidden sm:flex items-center justify-center"
            title="ఫుల్‌స్క్రీన్"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Scissors Mode Interactive Help Banner */}
      {toolMode === "clip" && (
        <div className="bg-[#c9182b] text-white py-1.5 px-3 text-xs font-telugu flex items-center justify-between shadow-md shrink-0 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-1.5 min-w-0">
            <Scissors className="w-4 h-4 text-yellow-300 shrink-0" />
            <span className="truncate">బాక్స్‌లా డ్రాగ్ చేసి కత్తిరించండి</span>
          </div>
          <button
            onClick={() => setToolMode("pan")}
            className="px-2.5 py-0.5 bg-black/40 hover:bg-black/60 text-white rounded text-xs transition cursor-pointer font-bold shrink-0 ml-2"
          >
            రద్దు
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

        {/* Floating Quick Page Flip Chevrons (Mobile & Desktop) */}
        {currentPage > 1 && (
          <button
            onClick={goToPrevPage}
            className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-7 h-12 sm:w-12 sm:h-12 rounded-r-2xl sm:rounded-full bg-black/50 hover:bg-[#0f2b5c] text-white shadow-xl transition backdrop-blur-xs flex items-center justify-center cursor-pointer border border-white/10 border-l-0 sm:border-l active:scale-95 opacity-75 hover:opacity-100"
            title="మునుపటి పేజీ (Previous)"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
        )}

        {currentPage < numPages && (
          <button
            onClick={goToNextPage}
            className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-7 h-12 sm:w-12 sm:h-12 rounded-l-2xl sm:rounded-full bg-black/50 hover:bg-[#0f2b5c] text-white shadow-xl transition backdrop-blur-xs flex items-center justify-center cursor-pointer border border-white/10 border-r-0 sm:border-r active:scale-95 opacity-75 hover:opacity-100"
            title="తరువాతి పేజీ (Next)"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Scrollable & Pannable PDF Workspace */}
        <div
          ref={viewportWrapperRef}
          onMouseDown={handleMouseDownPan}
          onMouseMove={handleMouseMovePan}
          onMouseUp={handleMouseUpPan}
          onTouchStart={handleViewportTouchStart}
          onTouchMove={handleViewportTouchMove}
          onTouchEnd={handleViewportTouchEnd}
          className={`flex-1 overflow-auto bg-slate-900 px-3 pt-3 pb-28 md:pb-8 sm:p-8 flex flex-col items-center justify-start overscroll-contain transition-colors ${
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
              className="relative shadow-[0_12px_40px_rgba(0,0,0,0.65)] border-2 sm:border-4 border-slate-300 dark:border-slate-400 rounded-xs bg-white my-auto max-w-full transition-shadow ring-1 ring-black/20"
              onMouseDown={handleClipMouseDown}
              onMouseMove={handleClipMouseMove}
              onMouseUp={handleClipMouseUp}
              onTouchStart={handleClipTouchStart}
              onTouchMove={handleClipTouchMove}
              onTouchEnd={handleClipTouchEnd}
            >
              {/* PDF Canvas */}
              <canvas ref={canvasRef} className="block max-w-none pointer-events-auto" />

              {/* Scissors Drag Overlay Box */}
              {toolMode === "clip" && clipBoxStyle && (
                <div
                  className="absolute border-2 border-dashed border-[#c9182b] bg-[#c9182b]/20 pointer-events-none shadow-sm flex items-start justify-end p-1 z-10"
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

      {/* 3. Mobile Touch Reading & Quick Navigation Bar (Strictly Fixed to Bottom & Safe Area Padding) */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a1c3d]/98 backdrop-blur-md border-t-2 border-[#1b3d7d] px-3.5 pt-3 flex items-center justify-between text-xs z-50 shadow-[0_-10px_35px_rgba(0,0,0,0.85)] min-h-[74px]"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 24px))" }}
      >
        {/* Left: Page Flip Controls with Rounded Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="w-10 h-10 rounded-full bg-white/10 active:bg-white/20 disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer flex items-center justify-center border border-white/15 shadow-xs"
            title="మునుపటి పేజీ (Previous)"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="font-mono font-bold text-blue-100 text-xs px-3 h-10 rounded-full bg-black/40 border border-white/15 flex items-center justify-center shadow-inner min-w-[56px]">
            {currentPage} / {numPages || 1}
          </span>

          <button
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
            className="w-10 h-10 rounded-full bg-white/10 active:bg-white/20 disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer flex items-center justify-center border border-white/15 shadow-xs"
            title="తరువాతి పేజీ (Next)"
            aria-label="Next Page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Zoom Controls & Crop Tool (All Rounded Buttons) */}
        <div className="flex items-center gap-1.5">
          {/* Zoom Out Button */}
          <button
            onClick={zoomOut}
            className="w-10 h-10 rounded-full bg-white/10 active:bg-white/20 transition cursor-pointer flex items-center justify-center border border-white/15 shadow-xs text-slate-200 active:text-white"
            title="జూమ్ తగ్గించు (Zoom Out)"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Fit Button */}
          <button
            onClick={fitToWidth}
            className="px-3.5 h-10 rounded-full bg-white/10 active:bg-white/20 font-bold text-xs text-blue-100 transition cursor-pointer flex items-center justify-center border border-white/15 shadow-xs active:scale-95"
            title="స్క్రీన్‌కు సరిపోల్చు (Fit Width)"
            aria-label="Fit Page"
          >
            Fit
          </button>

          {/* Zoom In Button */}
          <button
            onClick={zoomIn}
            className="w-10 h-10 rounded-full bg-white/10 active:bg-white/20 transition cursor-pointer flex items-center justify-center border border-white/15 shadow-xs text-slate-200 active:text-white"
            title="జూమ్ పెంచు (Zoom In)"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Crop Tool Toggle - Rounded (Icon only!) */}
          <button
            onClick={() => setToolMode(toolMode === "clip" ? "pan" : "clip")}
            className={`w-10 h-10 rounded-full transition cursor-pointer flex items-center justify-center border border-white/15 shadow-xs ${
              toolMode === "clip"
                ? "bg-[#c9182b] text-white ring-2 ring-yellow-400 shadow-md animate-pulse"
                : "bg-white/10 active:bg-white/20 text-yellow-300"
            }`}
            title="కత్తిరించండి (Crop / Clip)"
            aria-label="Crop Tool"
          >
            <Scissors className="w-4 h-4" />
          </button>
        </div>
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
