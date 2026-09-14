import React from 'react';
import './voiceAgent.css';

/**
 * Floating AI Trigger Button in the lower-right corner of the citizen portal
 * Exactly matching the user design:
 * - Top: Dark Indigo Speech Bubble Callout ("JanSetu Voice AI" / "बोलकर रिपोर्ट करें") with downward pointer tail
 * - Bottom: Circular Blue Mic with concentric translucent ripple rings
 */
export default function AIFloatingTrigger({ onOpen }) {
  return (
    <div
      className="voice-floating-widget"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      aria-label="Open JanSetu Voice AI"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      {/* Speech bubble callout badge above the mic */}
      <div className="voice-floating-callout">
        <div className="voice-callout-title">JanSetu AI</div>
        <div className="voice-callout-subtitle">बोलकर रिपोर्ट करें</div>
        <div className="voice-callout-arrow" />
      </div>

      {/* Circular Floating Mic Button with concentric ripple rings */}
      <div className="voice-floating-mic-wrapper">
        {/* Soft Concentric Ripple Rings */}
        <div className="mic-ripple-ring ring-outer" />
        <div className="mic-ripple-ring ring-mid" />
        <div className="mic-ripple-ring ring-inner" />

        {/* Central solid vibrant blue circular button */}
        <button
          type="button"
          className="voice-floating-mic-circle"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          title="JanSetu Voice AI — बोलकर समस्या दर्ज करें"
          aria-label="Open JanSetu Voice AI Agent"
        >
          {/* Crisp White Microphone Icon matching target design */}
          <svg
            className="floating-mic-svg"
            viewBox="0 0 24 24"
            fill="none"
          >
            {/* Solid filled capsule mic body */}
            <rect x="8.5" y="2.5" width="7" height="11" rx="3.5" fill="#FFFFFF" />
            {/* Cradle */}
            <path d="M4.5 10a7.5 7.5 0 0 0 15 0" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            {/* Stem & base */}
            <line x1="12" y1="17.5" x2="12" y2="21.5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="8.5" y1="21.5" x2="15.5" y2="21.5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
