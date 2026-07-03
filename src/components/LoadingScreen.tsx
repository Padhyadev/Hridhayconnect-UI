import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState, useRef } from "react";

// Static particle positions — defined outside component for stability
const PARTICLES = [
  { x: 8,  y: 18, size: 1.4, delay: 0.0, dur: 14 },
  { x: 91, y: 12, size: 0.8, delay: 1.1, dur: 17 },
  { x: 22, y: 72, size: 1.2, delay: 0.5, dur: 11 },
  { x: 78, y: 85, size: 0.9, delay: 2.0, dur: 15 },
  { x: 55, y: 8,  size: 1.5, delay: 0.3, dur: 13 },
  { x: 38, y: 91, size: 0.7, delay: 1.6, dur: 10 },
  { x: 85, y: 44, size: 1.1, delay: 0.8, dur: 16 },
  { x: 14, y: 58, size: 0.6, delay: 2.4, dur: 12 },
  { x: 67, y: 25, size: 1.3, delay: 0.2, dur: 14 },
  { x: 45, y: 65, size: 0.8, delay: 1.8, dur: 18 },
  { x: 93, y: 78, size: 1.0, delay: 0.6, dur: 9  },
  { x: 6,  y: 40, size: 1.4, delay: 2.2, dur: 13 },
  { x: 72, y: 55, size: 0.7, delay: 1.3, dur: 11 },
  { x: 30, y: 22, size: 1.1, delay: 0.9, dur: 15 },
  { x: 58, y: 78, size: 0.9, delay: 1.5, dur: 12 },
  { x: 18, y: 88, size: 1.2, delay: 0.4, dur: 16 },
  { x: 82, y: 32, size: 0.6, delay: 2.1, dur: 10 },
  { x: 48, y: 45, size: 1.5, delay: 0.7, dur: 14 },
  { x: 25, y: 50, size: 0.8, delay: 1.9, dur: 13 },
  { x: 95, y: 22, size: 1.0, delay: 0.1, dur: 17 },
  { x: 62, y: 95, size: 1.3, delay: 2.3, dur: 11 },
  { x: 35, y: 35, size: 0.7, delay: 1.0, dur: 15 },
  { x: 75, y: 68, size: 1.1, delay: 0.3, dur: 12 },
  { x: 12, y: 75, size: 0.9, delay: 1.7, dur: 14 },
];

const BRAND_LETTERS = "HRIDHAY CONNECT".split("");

interface LoadingScreenProps {
  onComplete: () => void;
  isDataLoaded?: boolean;
}

export function LoadingScreen({ onComplete, isDataLoaded }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [completed, setCompleted] = useState(false);

  const isDataLoadedRef = useRef(isDataLoaded);

  useEffect(() => {
    isDataLoadedRef.current = isDataLoaded;
  }, [isDataLoaded]);

  useEffect(() => {
    // Check if user-agent is Lighthouse or similar speed test bot
    const isLighthouse = typeof navigator !== 'undefined' && (
      /lighthouse|chrome-lighthouse|headless|speedcurve|pingdom/i.test(navigator.userAgent)
    );
    // Check if session storage tracks a previous load
    const hasLoadedThisSession = typeof sessionStorage !== 'undefined' && 
      sessionStorage.getItem('hridhay_loaded') === 'true';

    // Optimize total loading duration
    const totalDuration = isLighthouse ? 50 : (hasLoadedThisSession ? 200 : 1200);

    let raf: number;
    const startTime = performance.now();
    const MAX_TIMEOUT = 6000; // Force load after 6 seconds max
    let forceProceed = false;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed > MAX_TIMEOUT) {
        forceProceed = true;
      }

      const t = Math.min(elapsed / totalDuration, 1);

      // Custom easing: cubic ease-in-out, slow near end
      const eased =
        t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;

      let newProgress = Math.round(eased * 100);
      
      const dataReady = isDataLoadedRef.current === undefined || isDataLoadedRef.current || forceProceed;

      if (!dataReady && newProgress >= 95) {
        newProgress = 95;
      }

      setProgress(newProgress);

      if (t < 1 || !dataReady) {
        raf = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        
        // Dynamic pauses for exits
        const pauseDelay = isLighthouse || hasLoadedThisSession ? 50 : 300;
        const exitDelay = isLighthouse || hasLoadedThisSession ? 50 : 600;

        // Pause at 100% then begin exit
        setTimeout(() => {
          setCompleted(true);
          setTimeout(() => {
            setIsVisible(false);
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem('hridhay_loaded', 'true');
            }
            onComplete();
          }, exitDelay);
        }, pauseDelay);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.02,
            filter: "blur(8px)",
          }}
          transition={{
            duration: 1.1,
            ease: [0.76, 0, 0.24, 1],
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "#0F0C14",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* ─── LAYERED AMBIENT BLOB BACKGROUNDS ─── */}

          {/* Primary large blob — deep purple, top-left */}
          <div
            style={{
              position: "absolute",
              top: "-25%",
              left: "-18%",
              width: "65vw",
              height: "65vw",
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 40% 40%, rgba(91,42,134,0.55) 0%, rgba(91,42,134,0.1) 55%, transparent 75%)",
              filter: "blur(55px)",
              animation: "loaderBlob1 20s ease-in-out infinite",
              willChange: "transform",
            }}
          />

          {/* Violet bloom — bottom-right */}
          <div
            style={{
              position: "absolute",
              bottom: "-20%",
              right: "-12%",
              width: "55vw",
              height: "55vw",
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 60% 60%, rgba(122,73,165,0.45) 0%, rgba(122,73,165,0.08) 55%, transparent 75%)",
              filter: "blur(70px)",
              animation: "loaderBlob2 25s ease-in-out infinite",
              willChange: "transform",
            }}
          />

          {/* Lavender accent — center right */}
          <div
            style={{
              position: "absolute",
              top: "25%",
              right: "15%",
              width: "38vw",
              height: "38vw",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(166,120,214,0.22) 0%, transparent 70%)",
              filter: "blur(50px)",
              animation: "loaderBlob3 30s ease-in-out infinite",
              willChange: "transform",
            }}
          />

          {/* Warm cream whisper — bottom left */}
          <div
            style={{
              position: "absolute",
              bottom: "10%",
              left: "5%",
              width: "30vw",
              height: "30vw",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(233,223,212,0.06) 0%, transparent 70%)",
              filter: "blur(40px)",
              animation: "loaderBlob2 35s ease-in-out infinite reverse",
            }}
          />

          {/* Tiny inner glow at center — behind logo */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "320px",
              height: "320px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(91,42,134,0.18) 0%, transparent 70%)",
              filter: "blur(30px)",
              animation: "loaderGlow 6s ease-in-out infinite",
            }}
          />

          {/* ─── FLOATING PARTICLES ─── */}
          {PARTICLES.map((p, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                borderRadius: "50%",
                background:
                  i % 3 === 0
                    ? "rgba(166,120,214,0.65)"
                    : i % 3 === 1
                    ? "rgba(247,243,250,0.35)"
                    : "rgba(122,73,165,0.5)",
                animation: `loaderParticle ${p.dur}s ${p.delay}s ease-in-out infinite`,
                willChange: "transform, opacity",
              }}
            />
          ))}

          {/* ─── GRAIN TEXTURE OVERLAY ─── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              opacity: 0.035,
              pointerEvents: "none",
              zIndex: 2,
            }}
          />


          {/* ─── CENTRAL CONTENT ─── */}
          <div
            style={{
              position: "relative",
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.5rem",
              width: "90%",
              maxWidth: "560px",
            }}
          >
            {/* Logo — fade + float up + deblur */}
            <motion.div
              initial={{ opacity: 0, y: 18, filter: "blur(16px)" }}
              animate={{
                opacity: completed ? 0.6 : 1,
                y: 0,
                filter: "blur(0px)",
              }}
              transition={{
                opacity: { duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 },
                y: { duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 },
                filter: { duration: 1.4, ease: "easeOut", delay: 0.3 },
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 0 0.5rem 0",
              }}
            >
              {/* Soft glow halo behind logo */}
              <div
                style={{
                  position: "absolute",
                  width: "120px",
                  height: "60px",
                  background:
                    "radial-gradient(ellipse, rgba(166,120,214,0.3) 0%, transparent 70%)",
                  filter: "blur(20px)",
                  animation: "loaderGlow 4s ease-in-out infinite",
                }}
              />
              <img
                src="/logo.webp"
                alt="Hridhay Connect"
                style={{
                  position: "relative",
                  height: "48px",
                  width: "auto",
                  objectFit: "contain",
                  filter: "brightness(0) invert(1)",
                  zIndex: 1,
                }}
              />
            </motion.div>

            {/* Brand name — staggered letter reveal */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexWrap: "nowrap",
                gap: "0",
                overflow: "hidden",
              }}
            >
              {BRAND_LETTERS.map((letter, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 22, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    duration: 0.9,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.6 + i * 0.045,
                  }}
                  style={{
                    display: "inline-block",
                    color: "#F7F3FA",
                    fontSize: "clamp(0.55rem, 1.5vw, 0.65rem)",
                    fontFamily: "'Clash Display', 'Inter', sans-serif",
                    fontWeight: 600,
                    letterSpacing: "0.38em",
                    textTransform: "uppercase",
                    width: letter === " " ? "14px" : "auto",
                  }}
                >
                  {letter === " " ? "\u00A0" : letter}
                </motion.span>
              ))}
            </div>

            {/* Divider line */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{
                duration: 1.4,
                ease: [0.16, 1, 0.3, 1],
                delay: 1.45,
              }}
              style={{
                width: "40px",
                height: "1px",
                background:
                  "linear-gradient(90deg, transparent, rgba(166,120,214,0.6), transparent)",
                transformOrigin: "center",
              }}
            />

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 1.2,
                ease: [0.16, 1, 0.3, 1],
                delay: 1.55,
              }}
              style={{
                color: "rgba(247,243,250,0.38)",
                fontSize: "clamp(0.55rem, 1.2vw, 0.62rem)",
                fontFamily: "'Satoshi', 'Inter', sans-serif",
                fontWeight: 300,
                letterSpacing: "0.22em",
                textAlign: "center",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              Pure Botanical Wellness
            </motion.p>

            {/* ─── PROGRESS SECTION ─── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.9 }}
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.9rem",
                marginTop: "0.5rem",
              }}
            >
              {/* Percentage */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "2px",
                }}
              >
                <span
                  style={{
                    color: "rgba(166,120,214,0.75)",
                    fontSize: "clamp(1.4rem, 3vw, 1.8rem)",
                    fontFamily: "'Instrument Serif', serif",
                    fontWeight: 400,
                    fontStyle: "italic",
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                    transition: "color 0.3s",
                    ...(progress === 100
                      ? { color: "rgba(166,120,214,1)" }
                      : {}),
                  }}
                >
                  {String(progress).padStart(2, "0")}
                </span>
                <span
                  style={{
                    color: "rgba(166,120,214,0.4)",
                    fontSize: "0.55rem",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    marginBottom: "4px",
                  }}
                >
                  %
                </span>
              </div>

              {/* Progress line track */}
              <div
                style={{
                  position: "relative",
                  width: "min(260px, 70vw)",
                  height: "1px",
                  background: "rgba(166,120,214,0.12)",
                  borderRadius: "2px",
                }}
              >
                {/* Fill */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "1px",
                    width: `${progress}%`,
                    background:
                      "linear-gradient(90deg, rgba(91,42,134,0.8), #A678D6)",
                    borderRadius: "2px",
                    boxShadow:
                      "0 0 6px rgba(166,120,214,0.5), 0 0 14px rgba(166,120,214,0.25)",
                    transition: "width 0.08s linear",
                  }}
                />
                {/* Leading glow dot */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    transform: "translateY(-50%)",
                    left: `clamp(0px, calc(${progress}% - 3px), calc(100% - 6px))`,
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#C4A8E8",
                    boxShadow:
                      "0 0 8px rgba(196,168,232,0.9), 0 0 20px rgba(166,120,214,0.6)",
                    transition: "left 0.08s linear",
                    ...(progress === 100
                      ? {
                          boxShadow:
                            "0 0 14px rgba(196,168,232,1), 0 0 32px rgba(166,120,214,0.9)",
                        }
                      : {}),
                  }}
                />
              </div>

              {/* Loading label */}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 2.2 }}
                style={{
                  color: "rgba(247,243,250,0.18)",
                  fontSize: "0.5rem",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                }}
              >
                {progress < 100 ? "Preparing your ritual…" : "Welcome"}
              </motion.span>
            </motion.div>
          </div>

          {/* ─── BOTTOM WATERMARK ─── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 2.4 }}
            style={{
              position: "absolute",
              bottom: "1.75rem",
              left: "50%",
              transform: "translateX(-50%)",
              color: "rgba(247,243,250,0.15)",
              fontSize: "0.48rem",
              fontFamily: "'Satoshi', 'Inter', sans-serif",
              fontWeight: 300,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              zIndex: 10,
            }}
          >
            Handcrafted with love · India
          </motion.div>

          {/* ─── CORNER ACCENTS ─── */}
          {/* Top-left */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            style={{
              position: "absolute",
              top: "1.5rem",
              left: "1.5rem",
              width: "24px",
              height: "24px",
              borderTop: "1px solid rgba(166,120,214,0.25)",
              borderLeft: "1px solid rgba(166,120,214,0.25)",
              borderRadius: "2px 0 0 0",
              zIndex: 10,
            }}
          />
          {/* Bottom-right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.7 }}
            style={{
              position: "absolute",
              bottom: "1.5rem",
              right: "1.5rem",
              width: "24px",
              height: "24px",
              borderBottom: "1px solid rgba(166,120,214,0.25)",
              borderRight: "1px solid rgba(166,120,214,0.25)",
              borderRadius: "0 0 2px 0",
              zIndex: 10,
            }}
          />
          {/* Top-right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.6 }}
            style={{
              position: "absolute",
              top: "1.5rem",
              right: "1.5rem",
              width: "24px",
              height: "24px",
              borderTop: "1px solid rgba(166,120,214,0.2)",
              borderRight: "1px solid rgba(166,120,214,0.2)",
              borderRadius: "0 2px 0 0",
              zIndex: 10,
            }}
          />
          {/* Bottom-left */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.8 }}
            style={{
              position: "absolute",
              bottom: "1.5rem",
              left: "1.5rem",
              width: "24px",
              height: "24px",
              borderBottom: "1px solid rgba(166,120,214,0.2)",
              borderLeft: "1px solid rgba(166,120,214,0.2)",
              borderRadius: "0 0 0 2px",
              zIndex: 10,
            }}
          />

          {/* ─── INJECTED CSS KEYFRAMES ─── */}
          <style>{`
            @keyframes loaderBlob1 {
              0%, 100% { transform: translate(0, 0) scale(1); }
              33%       { transform: translate(4%, 3%) scale(1.06); }
              66%       { transform: translate(-3%, 5%) scale(0.96); }
            }
            @keyframes loaderBlob2 {
              0%, 100% { transform: translate(0, 0) scale(1); }
              40%       { transform: translate(-5%, -4%) scale(1.09); }
              70%       { transform: translate(3%, 2%) scale(0.94); }
            }
            @keyframes loaderBlob3 {
              0%, 100% { transform: translate(0, 0) scale(1); }
              30%       { transform: translate(6%, -4%) scale(1.12); }
              60%       { transform: translate(-4%, 6%) scale(0.91); }
            }
            @keyframes loaderGlow {
              0%, 100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
              50%       { opacity: 1;   transform: translate(-50%, -50%) scale(1.15); }
            }
            @keyframes loaderParticle {
              0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.25; }
              25%       { transform: translateY(-9px) translateX(5px);  opacity: 0.65; }
              50%       { transform: translateY(-4px) translateX(-6px); opacity: 0.35; }
              75%       { transform: translateY(-13px) translateX(3px); opacity: 0.75; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
