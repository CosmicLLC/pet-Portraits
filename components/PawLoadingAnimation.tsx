"use client";

import { useState, useEffect } from "react";

const MESSAGES = [
  "Analyzing your photo…",
  "Applying artistic style…",
  "Adding fine details…",
  "Almost ready…",
];

export default function PawLoadingAnimation() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setMsgIdx((i) => (i + 1) % MESSAGES.length), 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      {/* ── Branded easel + paw drawing animation ── */}
      <svg
        width="108"
        height="132"
        viewBox="0 0 120 148"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <style>{`
          /* Base stroke classes */
          .pm-c {
            stroke: #2D4A3E;
            stroke-width: 3;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
            stroke-dasharray: 1;
            stroke-dashoffset: 1;
          }
          .pm-p {
            stroke: #2D4A3E;
            stroke-width: 2.5;
            stroke-linecap: round;
            fill: #2D4A3E;
            fill-opacity: 0;
            stroke-dasharray: 1;
            stroke-dashoffset: 1;
          }

          /*
           * 5 s cycle:
           *   0 % – 62 %  draw phase (sequential)
           *  62 % – 76 %  hold (all visible)
           *  76 % – 92 %  fade out (stroke-dashoffset resets)
           *  92 % – 100 % gap (invisible, ready to restart)
           */

          /* Easel structure */
          @keyframes pm-peg {
            0%   { stroke-dashoffset: 1; }
            8%   { stroke-dashoffset: 0; }
            76%  { stroke-dashoffset: 0; }
            90%  { stroke-dashoffset: 1; }
            100% { stroke-dashoffset: 1; }
          }
          @keyframes pm-canvas {
            0%   { stroke-dashoffset: 1; }
            16%  { stroke-dashoffset: 0; }
            76%  { stroke-dashoffset: 0; }
            90%  { stroke-dashoffset: 1; }
            100% { stroke-dashoffset: 1; }
          }
          @keyframes pm-legl {
            0%, 14% { stroke-dashoffset: 1; }
            24%     { stroke-dashoffset: 0; }
            76%     { stroke-dashoffset: 0; }
            90%     { stroke-dashoffset: 1; }
            100%    { stroke-dashoffset: 1; }
          }
          @keyframes pm-legr {
            0%, 17% { stroke-dashoffset: 1; }
            27%     { stroke-dashoffset: 0; }
            76%     { stroke-dashoffset: 0; }
            90%     { stroke-dashoffset: 1; }
            100%    { stroke-dashoffset: 1; }
          }
          @keyframes pm-brace {
            0%, 25% { stroke-dashoffset: 1; }
            33%     { stroke-dashoffset: 0; }
            76%     { stroke-dashoffset: 0; }
            90%     { stroke-dashoffset: 1; }
            100%    { stroke-dashoffset: 1; }
          }

          /* Paw — sequential toe-by-toe */
          @keyframes pm-main {
            0%, 33% { stroke-dashoffset: 1; }
            48%     { stroke-dashoffset: 0; }
            76%     { stroke-dashoffset: 0; }
            90%     { stroke-dashoffset: 1; }
            100%    { stroke-dashoffset: 1; }
          }
          @keyframes pm-toe1 {
            0%, 47% { stroke-dashoffset: 1; }
            54%     { stroke-dashoffset: 0; }
            76%     { stroke-dashoffset: 0; }
            90%     { stroke-dashoffset: 1; }
            100%    { stroke-dashoffset: 1; }
          }
          @keyframes pm-toe2 {
            0%, 50% { stroke-dashoffset: 1; }
            57%     { stroke-dashoffset: 0; }
            76%     { stroke-dashoffset: 0; }
            90%     { stroke-dashoffset: 1; }
            100%    { stroke-dashoffset: 1; }
          }
          @keyframes pm-toe3 {
            0%, 53% { stroke-dashoffset: 1; }
            60%     { stroke-dashoffset: 0; }
            76%     { stroke-dashoffset: 0; }
            90%     { stroke-dashoffset: 1; }
            100%    { stroke-dashoffset: 1; }
          }
          @keyframes pm-toe4 {
            0%, 56% { stroke-dashoffset: 1; }
            63%     { stroke-dashoffset: 0; }
            76%     { stroke-dashoffset: 0; }
            90%     { stroke-dashoffset: 1; }
            100%    { stroke-dashoffset: 1; }
          }

          /* Fill fades in once all pads are drawn, fades out with the reset */
          @keyframes pm-fill {
            0%, 62%  { fill-opacity: 0; }
            74%      { fill-opacity: 0.13; }
            82%      { fill-opacity: 0.13; }
            92%      { fill-opacity: 0; }
            100%     { fill-opacity: 0; }
          }

          /* Timing shorthand */
          .pm-t { animation-duration: 5s; animation-timing-function: cubic-bezier(.4,0,.2,1); animation-iteration-count: infinite; }

          .pm-a-peg    { animation-name: pm-peg;    }
          .pm-a-canvas { animation-name: pm-canvas; }
          .pm-a-legl   { animation-name: pm-legl;   }
          .pm-a-legr   { animation-name: pm-legr;   }
          .pm-a-brace  { animation-name: pm-brace;  }
          .pm-a-main   { animation-name: pm-main,  pm-fill; }
          .pm-a-toe1   { animation-name: pm-toe1,  pm-fill; }
          .pm-a-toe2   { animation-name: pm-toe2,  pm-fill; }
          .pm-a-toe3   { animation-name: pm-toe3,  pm-fill; }
          .pm-a-toe4   { animation-name: pm-toe4,  pm-fill; }

          /* Elements with two simultaneous animations need duration repeated */
          .pm-a-main, .pm-a-toe1, .pm-a-toe2, .pm-a-toe3, .pm-a-toe4 {
            animation-duration: 5s, 5s;
            animation-timing-function: cubic-bezier(.4,0,.2,1), cubic-bezier(.4,0,.2,1);
            animation-iteration-count: infinite, infinite;
          }
        `}</style>

        {/* Top peg */}
        <line className="pm-c pm-t pm-a-peg"    x1="60" y1="3"  x2="60"  y2="14"  pathLength={1} />

        {/* Canvas frame */}
        <rect className="pm-c pm-t pm-a-canvas" x="17"  y="14" width="86" height="66" rx="4" pathLength={1} />

        {/* Legs */}
        <line className="pm-c pm-t pm-a-legl"   x1="24" y1="80" x2="5"   y2="143" pathLength={1} />
        <line className="pm-c pm-t pm-a-legr"   x1="96" y1="80" x2="115" y2="143" pathLength={1} />

        {/* Cross brace */}
        <line className="pm-c pm-t pm-a-brace"  x1="22" y1="120" x2="98" y2="120" pathLength={1} />

        {/* Paw — main pad */}
        <ellipse className="pm-p pm-a-main" cx="60" cy="57" rx="13" ry="14" pathLength={1} />

        {/* Paw — inner toes draw first, then outer */}
        <ellipse className="pm-p pm-a-toe1" cx="49" cy="35" rx="7"   ry="8"   pathLength={1} />
        <ellipse className="pm-p pm-a-toe2" cx="71" cy="35" rx="7"   ry="8"   pathLength={1} />
        <ellipse className="pm-p pm-a-toe3" cx="37" cy="44" rx="6.5" ry="7.5" pathLength={1} />
        <ellipse className="pm-p pm-a-toe4" cx="83" cy="44" rx="6.5" ry="7.5" pathLength={1} />
      </svg>

      {/* Progress messages */}
      <div className="text-center space-y-1.5">
        <p key={msgIdx} className="text-sm font-medium text-brand-green animate-fade-in-up">
          {MESSAGES[msgIdx]}
        </p>
        <p className="text-xs text-gray-400">Usually takes 20–30 seconds</p>
      </div>
    </div>
  );
}
