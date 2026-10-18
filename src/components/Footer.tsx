import React from "react";
import { Sparkles, ShieldCheck } from "lucide-react";

interface FooterProps {
  onNavigate: (route: "home" | "result" | "how-it-works" | "terms") => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="footer shell">
      <div className="footer-brand-group">
        <button
          onClick={() => onNavigate("home")}
          className="brand bg-transparent border-0 p-0 cursor-pointer"
          aria-label="กลับหน้าหลัก IGOTYOU"
        >
          <span className="brand-mark">
            <Sparkles className="w-4 h-4 fill-acid text-acid" />
          </span>
          <span>IGOTYOU</span>
        </button>
        <p className="footer-slogan">See yourself, a little differently.</p>
      </div>

      <div className="footer-action-group flex items-center gap-3.5 flex-wrap">
        <button
          onClick={() => onNavigate("how-it-works")}
          className="cursor-pointer"
        >
          <span>เบื้องหลัง & ความโปร่งใส</span>
        </button>
        <span className="text-muted/40 text-xs hidden sm:inline">•</span>
        <button
          onClick={() => onNavigate("terms")}
          className="cursor-pointer"
        >
          <span>ข้อกำหนดการใช้งาน (Terms of Use)</span>
        </button>
      </div>

      <span className="footer-disclaimer">Made for fun, not for judgment.</span>
    </footer>
  );
}
