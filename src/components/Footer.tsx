import React from "react";
import { Sparkles, ShieldCheck } from "lucide-react";

interface FooterProps {
  onNavigate: (route: "home" | "result" | "how-it-works") => void;
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

      <div className="footer-action-group">
        <button
          onClick={() => onNavigate("how-it-works")}
          className="footer-nav-pill"
        >
          <ShieldCheck className="w-4 h-4 text-purple shrink-0" />
          <span>เบื้องหลัง & ความเป็นส่วนตัว</span>
        </button>
      </div>

      <span className="footer-disclaimer">Made for fun, not for judgment.</span>
    </footer>
  );
}
