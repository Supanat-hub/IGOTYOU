import React from "react";
import { Sparkles } from "lucide-react";

interface FooterProps {
  onNavigate: (route: "home" | "result" | "how-it-works") => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="footer shell">
      <button
        onClick={() => onNavigate("home")}
        className="brand bg-transparent border-0 p-0 cursor-pointer"
      >
        <span className="brand-mark">
          <Sparkles className="w-4 h-4 fill-acid text-acid" />
        </span>
        <span>IGOTYOU</span>
      </button>

      <div className="flex gap-5 items-center">
        <button
          onClick={() => onNavigate("how-it-works")}
          className="bg-transparent border-0 cursor-pointer text-muted text-xs font-semibold hover:text-ink transition-colors"
        >
          เบื้องหลัง & ความเป็นส่วนตัว
        </button>
        <p className="m-0 font-bold font-['Manrope'] text-ink">See yourself, a little differently.</p>
      </div>

      <span className="text-muted">Made for fun, not for judgment.</span>
    </footer>
  );
}
