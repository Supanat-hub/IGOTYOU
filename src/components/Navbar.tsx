import React from "react";
import { Sparkles, ShieldCheck } from "lucide-react";

interface NavbarProps {
  currentRoute: "home" | "result" | "how-it-works";
  onNavigate: (route: "home" | "result" | "how-it-works") => void;
  hasResult: boolean;
  isAnalyzing?: boolean;
}

export default function Navbar({
  currentRoute,
  onNavigate,
  hasResult,
  isAnalyzing,
}: NavbarProps) {
  return (
    <nav className="nav shell" aria-label="เมนูหลัก">
      <button
        onClick={() => onNavigate("home")}
        className="brand bg-transparent border-0 p-0 cursor-pointer"
        aria-label="IGOTYOU หน้าแรก"
      >
        <span className="brand-mark">
          <Sparkles className="w-4 h-4 fill-acid text-acid" />
        </span>
        <span>IGOTYOU</span>
      </button>

      <div className="nav-actions">
        {(hasResult || isAnalyzing || currentRoute === "result") && (
          <button
            className={`nav-pill-btn transition-colors shrink-0 ${
              currentRoute === "result" ? "bg-acid" : "bg-white"
            }`}
            onClick={() => onNavigate("result")}
          >
            <Sparkles className="w-3.5 h-3.5 text-ink shrink-0" />
            <span className="hidden sm:inline">{isAnalyzing ? "กำลังวิเคราะห์..." : "ผลลัพธ์ Wrapped"}</span>
            <span className="sm:hidden">{isAnalyzing ? "กำลังคิด..." : "ผลลัพธ์"}</span>
          </button>
        )}

        <button
          className={`nav-pill-btn transition-colors ${
            currentRoute === "how-it-works" ? "bg-acid" : "bg-white"
          }`}
          onClick={() => onNavigate("how-it-works")}
        >
          <span>How it works</span>
        </button>

        <div className="nav-note">
          <ShieldCheck className="w-4 h-4 text-muted" />
          <span>รูปของคุณไม่ถูกเก็บไว้</span>
        </div>
      </div>
    </nav>
  );
}
