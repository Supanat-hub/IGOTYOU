import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import ResultPage from "./pages/ResultPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import StoryCardModal from "./components/StoryCardModal";
import StoryPlayerModal from "./components/StoryPlayerModal";
import InAppBrowserModal from "./components/InAppBrowserModal";
import { PRESETS, AnalysisResult, analyzeProfile } from "./utils/analysisEngine";

type Route = "home" | "result" | "how-it-works";

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash === "#wrapped") return "result";
    if (hash === "#how-it-works") return "how-it-works";
    return "home";
  });

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult>(PRESETS.cafe);
  const [hasResult, setHasResult] = useState(false);

  // Modal states
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isStoryPlayerOpen, setIsStoryPlayerOpen] = useState(false);

  // Sync hash routing with browser history and redirect unanalyzed #wrapped to home
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === "#wrapped") {
        if (!hasResult && !isAnalyzing) {
          window.location.hash = "";
          setCurrentRoute("home");
        } else {
          setCurrentRoute("result");
        }
      } else if (hash === "#how-it-works") {
        setCurrentRoute("how-it-works");
      } else {
        setCurrentRoute("home");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [hasResult, isAnalyzing]);

  // Initial check on mount
  useEffect(() => {
    if (window.location.hash.toLowerCase() === "#wrapped" && !hasResult && !isAnalyzing) {
      window.location.hash = "";
      setCurrentRoute("home");
    }
  }, []);

  const navigateTo = (route: Route) => {
    setCurrentRoute(route);
    if (route === "result") window.location.hash = "wrapped";
    else if (route === "how-it-works") window.location.hash = "how-it-works";
    else window.location.hash = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAnalyze = async () => {
    if (!files.length) return;
    setErrorMessage(null);
    setIsAnalyzing(true);
    navigateTo("result");
    try {
      const data = await analyzeProfile(files);
      setResult({ ...data, isPresetDemo: false });
      setHasResult(data.isValidProfile !== false);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || "ไม่สามารถวิเคราะห์โปรไฟล์ได้ในขณะนี้ กรุณาตรวจสอบรูปภาพหรือลองใหม่อีกครั้ง"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCancelAnalysis = () => {
    setIsAnalyzing(false);
    navigateTo("home");
  };

  return (
    <main>
      <InAppBrowserModal />

      <Navbar
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        hasResult={hasResult}
        isAnalyzing={isAnalyzing}
      />

      {/* Global User-Facing Error Toast Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[min(92vw,560px)] bg-[#fff2f0] border-2 border-[#d91414] rounded-2xl p-4 shadow-[6px_6px_0_var(--ink)] flex items-start justify-between gap-3 animate-fadeIn"
        >
          <div className="flex items-start gap-2.5">
            <span className="text-xl leading-none select-none">⚠️</span>
            <div>
              <div className="font-extrabold text-sm text-[#b30000]">เกิดข้อผิดพลาดในการประมวลผล</div>
              <p className="text-xs text-ink/80 mt-0.5 leading-relaxed m-0">{errorMessage}</p>
              <button
                onClick={() => {
                  setErrorMessage(null);
                  if (files.length > 0) handleAnalyze();
                  else navigateTo("home");
                }}
                className="mt-2.5 bg-ink text-acid hover:bg-purple hover:text-white px-3.5 py-1.5 rounded-full text-xs font-extrabold cursor-pointer transition-all inline-flex items-center gap-1.5 border border-ink shadow-[2px_2px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5"
              >
                <span>{files.length > 0 ? "ลองใหม่อีกครั้ง" : "กลับไปหน้าแรก"}</span>
              </button>
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            aria-label="ปิดข้อความแจ้งเตือน"
            className="text-ink/60 hover:text-ink font-bold text-sm p-1 cursor-pointer leading-none"
          >
            ✕
          </button>
        </div>
      )}

      {currentRoute === "home" && (
        <HomePage
          files={files}
          isDragging={isDragging}
          isAnalyzing={isAnalyzing}
          onFilesChange={setFiles}
          onDragStateChange={setIsDragging}
          onAnalyze={handleAnalyze}
          onNavigateToHowItWorks={() => navigateTo("how-it-works")}
        />
      )}

      {currentRoute === "result" && (
        <ResultPage
          result={result}
          onUpdateResult={setResult}
          onBackToHome={() => navigateTo("home")}
          onOpenStoryModal={() => setIsStoryModalOpen(true)}
          onOpenStoryPlayer={() => setIsStoryPlayerOpen(true)}
          onOpenHowItWorks={() => navigateTo("how-it-works")}
          onRetry={handleAnalyze}
          onCancel={handleCancelAnalysis}
          isAnalyzing={isAnalyzing}
        />
      )}

      {currentRoute === "how-it-works" && (
        <HowItWorksPage onBackToHome={() => navigateTo("home")} />
      )}

      <Footer onNavigate={navigateTo} />

      {/* 9:16 Instagram Story Export Modal */}
      <StoryCardModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        data={result}
      />

      {/* Interactive Spotify-Wrapped Style Story Player */}
      <StoryPlayerModal
        isOpen={isStoryPlayerOpen}
        onClose={() => setIsStoryPlayerOpen(false)}
        data={result}
        onOpenStoryCardModal={() => setIsStoryModalOpen(true)}
      />
    </main>
  );
}
