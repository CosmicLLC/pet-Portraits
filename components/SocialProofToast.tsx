"use client";

import { useState, useEffect } from "react";

const NAMES = ["Sarah", "Emma", "James", "Olivia", "Lucas", "Ava", "Noah", "Mia", "Ethan", "Sophia", "Liam", "Isabella", "Mason", "Charlotte", "Logan"];
const CITIES = ["Texas", "California", "New York", "Florida", "Colorado", "Oregon", "Georgia", "Ohio", "Michigan", "Arizona", "Tennessee", "Washington", "Illinois"];
const STYLES = ["watercolor", "oil painting", "renaissance", "line art"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function SocialProofToast() {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [style, setStyle] = useState("");

  useEffect(() => {
    const show = () => {
      setName(pick(NAMES));
      setCity(pick(CITIES));
      setStyle(pick(STYLES));
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
    };

    // First toast after 10s, then every 45s
    const first = setTimeout(show, 10000);
    const interval = setInterval(show, 45000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-[280px] animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-brand-green/10 flex items-center justify-center flex-shrink-0 text-base">
          🐾
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800 truncate">
            {name} from {city}
          </p>
          <p className="text-xs text-gray-500">
            just ordered a {style} portrait
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-gray-300 hover:text-gray-400 flex-shrink-0 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
