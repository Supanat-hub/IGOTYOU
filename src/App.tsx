import { useEffect, useState, useRef } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import ResultPage from "./pages/ResultPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import TermsPage from "./pages/TermsPage";
import StoryCardModal from "./components/StoryCardModal";
import StoryPlayerModal from "./components/StoryPlayerModal";
import InAppBrowserModal from "./components/InAppBrowserModal";
import { PRESETS, AnalysisResult, analyzeProfile, fetchScrapedProfile, analyzeScrapedProfile } from "./utils/analysisEngine";

type Route = "home" | "result" | "how-it-works" | "terms";

export default function App() {
  const [isTestMode, setIsTestMode] = useState<boolean>(true);
  const [showBetaBanner, setShowBetaBanner] = useState<boolean>(() => {
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return hash.includes("beta") || search.includes("beta");
  });

  const [currentRoute, setCurrentRoute] = useState<Route>(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash === "#wrapped") return "result";
    if (hash === "#how-it-works") return "how-it-works";
    if (hash === "#terms") return "terms";
    return "home";
  });

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScrapingLoading, setIsScrapingLoading] = useState(false);
  const [scraperAlert, setScraperAlert] = useState<{ message: string; allowFallback: boolean } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult>(PRESETS.cafe);
  const [hasResult, setHasResult] = useState(false);

  // Synchronous refs to prevent hashchange closure race conditions during navigation
  const isAnalyzingRef = useRef(false);
  const hasResultRef = useRef(false);

  useEffect(() => {
    isAnalyzingRef.current = isAnalyzing;
  }, [isAnalyzing]);

  useEffect(() => {
    hasResultRef.current = hasResult;
  }, [hasResult]);

  // Modal states
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isStoryPlayerOpen, setIsStoryPlayerOpen] = useState(false);
  const isNavigatingRef = useRef(false);

  // Sync hash routing with browser history and redirect unanalyzed #wrapped to home
  useEffect(() => {
    const handleHashChange = () => {
      if (isNavigatingRef.current) return;

      const updateState = () => {
        const hash = window.location.hash.toLowerCase();
        if (hash.includes("beta")) {
          setShowBetaBanner(true);
        }
        if (hash === "#wrapped") {
          if (!hasResult && !isAnalyzing && !hasResultRef.current && !isAnalyzingRef.current) {
            window.location.hash = "";
            setCurrentRoute("home");
          } else {
            setCurrentRoute("result");
          }
        } else if (hash === "#how-it-works") {
          setCurrentRoute("how-it-works");
        } else if (hash === "#terms") {
          setCurrentRoute("terms");
        } else {
          setCurrentRoute("home");
        }
        window.scrollTo(0, 0);
      };

      if (typeof document !== "undefined" && "startViewTransition" in document) {
        document.startViewTransition(() => updateState());
      } else {
        updateState();
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [hasResult, isAnalyzing]);

  // Initial check on mount
  useEffect(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash === "#wrapped" && !hasResult && !isAnalyzing && !hasResultRef.current && !isAnalyzingRef.current) {
      window.location.hash = "";
      setCurrentRoute("home");
    }
  }, [hasResult, isAnalyzing]);

  const navigateTo = (route: Route) => {
    isNavigatingRef.current = true;
    const updateDOM = () => {
      setCurrentRoute(route);
      if (route === "result") window.location.hash = "wrapped";
      else if (route === "how-it-works") window.location.hash = "how-it-works";
      else if (route === "terms") window.location.hash = "terms";
      else window.location.hash = "";
      window.scrollTo(0, 0);
    };

    if (typeof document !== "undefined" && "startViewTransition" in document) {
      const transition = document.startViewTransition(() => updateDOM());
      transition.finished.finally(() => {
        isNavigatingRef.current = false;
      });
    } else {
      updateDOM();
      isNavigatingRef.current = false;
    }
  };

  const [isScrapingMode, setIsScrapingMode] = useState(false);

  const handleAnalyze = async () => {
    if (!files.length) return;
    setErrorMessage(null);
    setScraperAlert(null);
    setIsScrapingMode(false);
    isAnalyzingRef.current = true;
    setIsAnalyzing(true);
    navigateTo("result");
    try {
      const data = await analyzeProfile(files);
      hasResultRef.current = data.isValidProfile !== false;
      setResult({ ...data, isPresetDemo: false });
      setHasResult(data.isValidProfile !== false);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || "ไม่สามารถวิเคราะห์โปรไฟล์ได้ในขณะนี้ กรุณาตรวจสอบรูปภาพหรือลองใหม่อีกครั้ง"
      );
    } finally {
      isAnalyzingRef.current = false;
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeScraped = async (username: string) => {
    setScraperAlert(null);
    setErrorMessage(null);
    setIsScrapingLoading(true);
    setIsScrapingMode(true);

    try {
      const res = await fetchScrapedProfile(username);
      if (res.status === "NOT_FOUND") {
        setIsScrapingLoading(false);
        setIsScrapingMode(false);
        setScraperAlert({
          message: res.message || `ไม่พบบัญชี @${username} บน Instagram กรุณาตรวจสอบตัวสะกดอีกครั้ง`,
          allowFallback: false,
        });
        return;
      }
      const isPrivate =
        res.status === "PRIVATE_ACCOUNT" ||
        res.isPrivate === true ||
        Boolean(res.data?.isPrivate) ||
        (Boolean(res.data?.stats?.postsCount) &&
          res.data!.stats.postsCount > 0 &&
          (!res.data?.posts || res.data.posts.length === 0));

      if (isPrivate) {
        setIsScrapingLoading(false);
        setIsScrapingMode(false);
        setScraperAlert({
          message:
            res.message ||
            "บัญชีนี้ตั้งค่าเป็นส่วนตัว (Private Account) ไม่สามารถเข้าถึงรูปภาพได้ สลับไปใช้วิธี 'อัปโหลดภาพ' แทน",
          allowFallback: true,
        });
        return;
      }
      if (res.status === "PUBLIC" && res.data) {
        setIsScrapingLoading(false);
        isAnalyzingRef.current = true;
        setIsAnalyzing(true);
        navigateTo("result");

        const analyzed = await analyzeScrapedProfile(res.data);
        hasResultRef.current = analyzed.isValidProfile !== false;
        setResult({ ...analyzed, isPresetDemo: false });
        setHasResult(analyzed.isValidProfile !== false);
      }
    } catch (err: any) {
      console.error("Scraper Error:", err);
      setIsScrapingLoading(false);
      setIsScrapingMode(false);
      setScraperAlert({
        message: err.message || "ระบบไม่สามารถดึงข้อมูลบัญชีได้ในขณะนี้ แนะนำให้แคปภาพหน้าจอโปรไฟล์ของคุณ แล้วสลับไปใช้วิธี 'อัปโหลดภาพ' แทน",
        allowFallback: true,
      });
      if (isAnalyzingRef.current) {
        setErrorMessage(err.message || "เกิดข้อผิดพลาดในการวิเคราะห์โปรไฟล์ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setIsScrapingLoading(false);
      isAnalyzingRef.current = false;
      setIsAnalyzing(false);
    }
  };

  const handleCancelAnalysis = () => {
    isAnalyzingRef.current = false;
    setIsAnalyzing(false);
    setIsScrapingLoading(false);
    setIsScrapingMode(false);
    navigateTo("home");
  };

  return (
    <main>
      {/* Scroll-Driven Top Progress Bar */}
      <div className="scroll-progress-bar" aria-hidden="true" />
      <InAppBrowserModal />

      {/* Beta Test Environment Indicator Bar */}
      {showBetaBanner && (
        <div className="bg-purple text-white px-3 sm:px-4 py-2 text-xs font-bold border-b border-black/20 shadow-sm sticky top-0 z-[100]">
          <div className="shell flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 truncate">
              <span className="animate-pulse">🧪</span>
              <span className="truncate">
                <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] tracking-wide uppercase mr-1">BETA TEST</span>
                โหมดทดสอบระบบดึงข้อมูล Instagram อัตโนมัติ (URL แยกสำหรับการทดสอบ)
              </span>
            </span>
            <button
              onClick={() => {
                setShowBetaBanner(false);
                window.location.hash = "";
              }}
              className="text-[11px] underline hover:text-acid cursor-pointer shrink-0 font-medium transition-colors"
            >
              ซ่อนแถบแจ้งเตือน
            </button>
          </div>
        </div>
      )}

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
          isTestMode={isTestMode}
          onFilesChange={setFiles}
          onDragStateChange={setIsDragging}
          onAnalyze={handleAnalyze}
          onAnalyzeScraped={handleAnalyzeScraped}
          onNavigateToHowItWorks={() => navigateTo("how-it-works")}
          onNavigateToTerms={() => navigateTo("terms")}
          isScrapingLoading={isScrapingLoading}
          scraperAlert={scraperAlert}
          onClearScraperAlert={() => setScraperAlert(null)}
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
          isScraping={isScrapingMode}
        />
      )}

      {currentRoute === "how-it-works" && (
        <HowItWorksPage onBackToHome={() => navigateTo("home")} />
      )}

      {currentRoute === "terms" && (
        <TermsPage
          onBackToHome={() => navigateTo("home")}
          onNavigateToHowItWorks={() => navigateTo("how-it-works")}
        />
      )}

      <Footer onNavigate={navigateTo} />

      {/* 9:16 Instagram Story Export Modal */}
      <StoryCardModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        data={result}
        onUpdateData={setResult}
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
