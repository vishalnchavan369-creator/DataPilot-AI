import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Database,
  FileBarChart,
  FileText,
  Gauge,
  GitBranch,
  Layers3,
  Network,
  Radar,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  WandSparkles,
  Zap,
} from "lucide-react";

/* =========================================================
   DATA
========================================================= */

const stages = [
  {
    id: "profile",
    label: "PROFILE",
    title: "Dataset profiling",
    description:
      "Understand structure, types, distributions and dataset fingerprints automatically.",
    icon: Database,
    accent: "#FF7A59",
  },
  {
    id: "quality",
    label: "QUALITY",
    title: "Data quality",
    description:
      "Detect missing values, duplicates, anomalies and suspicious data patterns.",
    icon: ShieldCheck,
    accent: "#63D6A2",
  },
  {
    id: "explore",
    label: "EXPLORE",
    title: "Pattern discovery",
    description:
      "Reveal relationships, correlations, distributions and hidden structure.",
    icon: Radar,
    accent: "#FFC857",
  },
  {
    id: "model",
    label: "MODEL",
    title: "ML intelligence",
    description:
      "Detect machine-learning opportunities and build suitable model paths.",
    icon: BrainCircuit,
    accent: "#FF8B6A",
  },
  {
    id: "explain",
    label: "EXPLAIN",
    title: "Explainability",
    description:
      "Trace predictions with feature importance and human-readable explanations.",
    icon: GitBranch,
    accent: "#A88BFF",
  },
  {
    id: "decide",
    label: "DECIDE",
    title: "Decision intelligence",
    description:
      "Transform analytical findings into clear, decision-ready intelligence.",
    icon: Target,
    accent: "#63D6A2",
  },
];

const capabilities = [
  {
    number: "01",
    icon: Database,
    title: "Universal data intelligence",
    text: "Upload structured datasets and let the platform understand their structure automatically.",
    tags: ["CSV", "XLSX", "JSON"],
  },
  {
    number: "02",
    icon: WandSparkles,
    title: "Autonomous analysis",
    text: "Move from profiling to quality checks, exploration and ML discovery without rebuilding every workflow manually.",
    tags: ["Profiling", "Quality", "Automation"],
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Exploratory analytics",
    text: "Generate meaningful analytical views around distributions, relationships and important variables.",
    tags: ["EDA", "Patterns", "Relationships"],
  },
  {
    number: "04",
    icon: BrainCircuit,
    title: "Machine learning",
    text: "Identify potential ML problems and move into model experimentation through the Model Lab.",
    tags: ["Classification", "Regression", "Clustering"],
  },
  {
    number: "05",
    icon: Network,
    title: "Explainable intelligence",
    text: "Connect model behavior with feature-level explanations and transparent prediction reasoning.",
    tags: ["XAI", "Feature importance", "What-if"],
  },
  {
    number: "06",
    icon: FileText,
    title: "Decision-ready reports",
    text: "Turn the complete analytical journey into professional reports and reusable insights.",
    tags: ["Reports", "Insights", "History"],
  },
];

const intelligenceLayers = [
  {
    code: "01",
    title: "Dataset fingerprint",
    text: "A structural identity for every dataset entering the engine.",
    icon: ScanLine,
  },
  {
    code: "02",
    title: "Feature intelligence",
    text: "Understand which variables carry signal, risk or potential.",
    icon: Network,
  },
  {
    code: "03",
    title: "Leakage detection",
    text: "Surface suspicious relationships before they contaminate modeling.",
    icon: ShieldCheck,
  },
  {
    code: "04",
    title: "Autonomous DS engine",
    text: "Coordinate profiling, analysis, modeling and explanation.",
    icon: BrainCircuit,
  },
  {
    code: "05",
    title: "What-if intelligence",
    text: "Explore how changes in important variables can affect predictions.",
    icon: GitBranch,
  },
  {
    code: "06",
    title: "Experiment memory",
    text: "Keep analytical decisions connected across the workspace.",
    icon: Layers3,
  },
];

/* =========================================================
   DATA STREAM CANVAS
========================================================= */

function DataStreamCanvas({ activeStage }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  const stageIndex = stages.findIndex((item) => item.id === activeStage);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const particles = [];
    const count = 85;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();

      width = rect.width;
      height = rect.height;

      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const seeded = (index) => {
      const x = ((index * 37) % 1000) / 1000;
      const y = ((index * 71 + 17) % 1000) / 1000;
      const z = ((index * 113 + 91) % 1000) / 1000;

      return { x, y, z };
    };

    for (let i = 0; i < count; i += 1) {
      const p = seeded(i);

      particles.push({
        x: p.x,
        y: p.y,
        z: p.z,
        speed: 0.0004 + ((i * 13) % 10) * 0.00005,
        size: 0.7 + ((i * 17) % 8) * 0.13,
        phase: (i * 0.73) % 6.28,
      });
    }

    const draw = (time) => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      const active = stages[stageIndex] || stages[0];

      /* subtle coordinate grid */
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.035)";
      ctx.lineWidth = 1;

      const grid = 42;

      for (let x = 0; x < width; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y < height; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.restore();

      /* flowing data particles */
      particles.forEach((particle) => {
        particle.y -= particle.speed * 0.35;

        if (particle.y < 0) particle.y = 1;

        const px =
          particle.x * width +
          Math.sin(time * 0.0005 + particle.phase) * 12;

        const py =
          particle.y * height +
          Math.cos(time * 0.00035 + particle.phase) * 9;

        const alpha = 0.08 + particle.z * 0.25;

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 190, 120, ${alpha})`;
        ctx.arc(px, py, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      /* data lines converging toward cube */
      const ports = [
        { x: cx - 220, y: cy - 150 },
        { x: cx - 260, y: cy + 5 },
        { x: cx - 205, y: cy + 170 },
        { x: cx + 220, y: cy - 150 },
        { x: cx + 260, y: cy + 5 },
        { x: cx + 205, y: cy + 170 },
      ];

      ports.forEach((port, index) => {
        const phase = time * 0.0014 + index;

        const endX = cx + Math.sin(phase) * 22;
        const endY = cy + Math.cos(phase) * 22;

        ctx.beginPath();
        ctx.moveTo(port.x, port.y);
        ctx.quadraticCurveTo(cx, port.y, endX, endY);

        ctx.strokeStyle =
          index === stageIndex
            ? `${active.accent}AA`
            : "rgba(255,255,255,0.10)";

        ctx.lineWidth = index === stageIndex ? 1.6 : 1;
        ctx.stroke();

        const progress = (time * 0.00018 + index * 0.14) % 1;

        const px =
          port.x +
          (endX - port.x) * progress +
          Math.sin(progress * Math.PI) * 30;

        const py =
          port.y +
          (endY - port.y) * progress;

        ctx.beginPath();
        ctx.fillStyle =
          index === stageIndex
            ? active.accent
            : "rgba(255,255,255,0.45)";

        ctx.shadowBlur = index === stageIndex ? 12 : 0;
        ctx.shadowColor = active.accent;
        ctx.arc(px, py, index === stageIndex ? 2.5 : 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      /* horizontal scanner */
      const scanProgress = (time * 0.00022) % 1;
      const scanY = cy - 170 + scanProgress * 340;

      const gradient = ctx.createLinearGradient(
        cx - 190,
        scanY,
        cx + 190,
        scanY
      );

      gradient.addColorStop(0, "rgba(255,122,89,0)");
      gradient.addColorStop(0.5, "rgba(255,122,89,0.42)");
      gradient.addColorStop(1, "rgba(255,122,89,0)");

      ctx.beginPath();
      ctx.moveTo(cx - 205, scanY);
      ctx.lineTo(cx + 205, scanY);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.stroke();

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [activeStage, stageIndex]);

  return <canvas ref={canvasRef} className="diu-canvas" aria-hidden="true" />;
}

/* =========================================================
   DATA INTELLIGENCE UNIVERSE
========================================================= */

function DataIntelligenceUniverse({ activeStage, setActiveStage }) {
  const sceneRef = useRef(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const smoothX = useSpring(rotateX, {
    stiffness: 70,
    damping: 18,
  });

  const smoothY = useSpring(rotateY, {
    stiffness: 70,
    damping: 18,
  });

  const activeIndex = stages.findIndex((item) => item.id === activeStage);
  const active = stages[activeIndex] || stages[0];

  const handlePointerMove = (event) => {
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    rotateY.set(x * 9);
    rotateX.set(y * -9);
  };

  const handlePointerLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <div
      ref={sceneRef}
      className="diu"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <DataStreamCanvas activeStage={activeStage} />

      <div className="diu-coordinate coordinate-x">X / 001</div>
      <div className="diu-coordinate coordinate-y">Y / 002</div>
      <div className="diu-coordinate coordinate-z">Z / 003</div>

      {/* outer fingerprint */}
      <motion.div
        className="fingerprint fingerprint-one"
        style={{
          rotateX: smoothX,
          rotateY: smoothY,
        }}
      >
        <div className="fingerprint-ring ring-a" />
        <div className="fingerprint-ring ring-b" />
        <div className="fingerprint-ring ring-c" />
        <div className="fingerprint-ring ring-d" />
        <div className="fingerprint-marker marker-one" />
        <div className="fingerprint-marker marker-two" />
        <div className="fingerprint-marker marker-three" />
      </motion.div>

      {/* main 3D scene */}
      <motion.div
        className="diu-scene"
        style={{
          rotateX: smoothX,
          rotateY: smoothY,
        }}
      >
        {/* horizontal data sheets */}
        <div className="data-sheet sheet-1">
          <span>001</span>
          <span>001</span>
          <span>010</span>
          <span>101</span>
          <span>011</span>
        </div>

        <div className="data-sheet sheet-2">
          <span>DATA</span>
          <span>FEATURE</span>
          <span>SIGNAL</span>
        </div>

        <div className="data-sheet sheet-3">
          <span>ROW</span>
          <span>ROW</span>
          <span>ROW</span>
          <span>ROW</span>
        </div>

        {/* 3D cube */}
        <div className="dataset-cube">
          <div className="cube-face cube-front">
            <div className="cube-header">
              <span>DATASET</span>
              <span>LIVE</span>
            </div>

            <div className="cube-grid">
              {Array.from({ length: 35 }).map((_, index) => (
                <span
                  key={index}
                  className={
                    index % 7 === activeIndex + 1
                      ? "cell active"
                      : "cell"
                  }
                />
              ))}
            </div>

            <div className="cube-footer">
              <span>ROWS</span>
              <span>FEATURES</span>
              <span>SIGNAL</span>
            </div>
          </div>

          <div className="cube-face cube-back" />
          <div className="cube-face cube-left" />
          <div className="cube-face cube-right" />
          <div className="cube-face cube-top" />
          <div className="cube-face cube-bottom" />

          {/* internal intelligence */}
          <div className="ai-kernel">
            <div className="kernel-ring kernel-ring-a" />
            <div className="kernel-ring kernel-ring-b" />
            <div className="kernel-core">
              <BrainCircuit size={30} strokeWidth={1.4} />
            </div>
          </div>
        </div>

        {/* scanning frame */}
        <div className="scan-frame">
          <span />
          <span />
          <span />
          <span />
        </div>
      </motion.div>

      {/* ports */}
      <div className="diu-ports">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = stage.id === activeStage;

          return (
            <button
              type="button"
              key={stage.id}
              className={`diu-port port-${index + 1} ${
                isActive ? "active" : ""
              }`}
              onClick={() => setActiveStage(stage.id)}
              style={{
                "--stage-accent": stage.accent,
              }}
            >
              <span className="port-line" />
              <span className="port-node">
                <Icon size={13} />
              </span>
              <span className="port-label">
                <small>0{index + 1}</small>
                {stage.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* HUD cards */}
      <motion.div
        className="hud-card hud-top"
        animate={{ y: [0, -5, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="hud-card-icon">
          <ScanLine size={15} />
        </div>
        <div>
          <span>DATASET FINGERPRINT</span>
          <strong>ACTIVE</strong>
        </div>
      </motion.div>

      <motion.div
        className="hud-card hud-left"
        animate={{ y: [0, 5, 0] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <span>FEATURE GRAPH</span>
        <div className="mini-graph">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </motion.div>

      <motion.div
        className="hud-card hud-right"
        animate={{ y: [0, -4, 0] }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <span>ENGINE STAGE</span>
        <strong>{active.label}</strong>
        <small>DAIE / AUTONOMOUS</small>
      </motion.div>

      <div className="diu-engine-status">
        <span className="status-dot" />
        <span>DAIE</span>
        <span className="status-divider" />
        <span>AUTONOMOUS INTELLIGENCE ENGINE</span>
      </div>

      <div className="diu-stage-indicator">
        <span>STAGE</span>
        <strong>
          {String(activeIndex + 1).padStart(2, "0")} / 06
        </strong>
      </div>
    </div>
  );
}


/* =========================================================
   3D AUTONOMOUS PIPELINE
========================================================= */

function AutonomousPipeline3D({ activeStage, setActiveStage }) {
  const sceneRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const activeIndex = stages.findIndex((stage) => stage.id === activeStage);
  const active = stages[activeIndex] || stages[0];

  const handlePointerMove = (event) => {
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    setTilt({ x: y * -8, y: x * 10 });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

  const nodePositions = [
    "node-1",
    "node-2",
    "node-3",
    "node-4",
    "node-5",
    "node-6",
  ];

  return (
    <div
      ref={sceneRef}
      className="ap3d"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
    >
      <div className="ap3d-topline">
        <span>DAIE / LIVE ROUTING</span>
        <span>DATA → EVIDENCE → ACTION</span>
      </div>

      <div className="ap3d-coordinate ap3d-x">X / 001</div>
      <div className="ap3d-coordinate ap3d-y">Y / 002</div>
      <div className="ap3d-coordinate ap3d-z">Z / 003</div>

      <div className="ap3d-grid-floor" />
      <div className="ap3d-grid-radar" />

      <svg className="ap3d-links" viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true">
        {stages.map((stage, index) => {
          const paths = [
            "M 205 132 C 310 132 365 245 500 280",
            "M 165 280 C 280 280 365 280 500 280",
            "M 205 428 C 310 428 365 315 500 280",
            "M 795 132 C 690 132 635 245 500 280",
            "M 835 280 C 720 280 635 280 500 280",
            "M 795 428 C 690 428 635 315 500 280",
          ];

          const isActive = stage.id === activeStage;

          return (
            <g key={stage.id}>
              <path
                d={paths[index]}
                className={`ap3d-link ${isActive ? "active" : ""}`}
                style={{ "--link-accent": stage.accent }}
              />
              <circle
                cx={index < 3 ? 205 : index === 3 ? 795 : index === 4 ? 835 : 795}
                cy={index % 3 === 0 ? 132 : index % 3 === 1 ? 280 : 428}
                r={isActive ? 5 : 3}
                className={`ap3d-link-dot ${isActive ? "active" : ""}`}
                style={{ "--link-accent": stage.accent }}
              />
            </g>
          );
        })}
      </svg>

      <div
        className="ap3d-world"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        <div className="ap3d-orbit orbit-a" />
        <div className="ap3d-orbit orbit-b" />
        <div className="ap3d-orbit orbit-c" />

        <div className="ap3d-data-ring ring-one">
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} style={{ "--i": i }} />
          ))}
        </div>

        <div className="ap3d-data-ring ring-two">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} style={{ "--i": i }} />
          ))}
        </div>

        <div className="ap3d-core-shadow" />

        <div className="ap3d-core">
          <div className="ap3d-cube-face face-front">
            <div className="ap3d-cube-grid">
              {Array.from({ length: 36 }).map((_, i) => (
                <span key={i} className={i % 7 === activeIndex + 1 ? "lit" : ""} />
              ))}
            </div>
            <div className="ap3d-cube-code">DATASET / 001</div>
          </div>
          <div className="ap3d-cube-face face-right" />
          <div className="ap3d-cube-face face-top" />

          <div className="ap3d-core-inner">
            <div className="ap3d-inner-ring inner-a" />
            <div className="ap3d-inner-ring inner-b" />
            <div className="ap3d-inner-node">
              <BrainCircuit size={30} strokeWidth={1.25} />
            </div>
          </div>
        </div>

        <div className="ap3d-scanner" />

        {Array.from({ length: 16 }).map((_, i) => (
          <motion.span
            key={i}
            className="ap3d-particle"
            style={{ "--particle-i": i }}
            animate={{
              opacity: [0.15, 0.9, 0.15],
              scale: [0.7, 1.25, 0.7],
              x: [0, ((i * 37) % 70) - 35, 0],
              y: [0, ((i * 61) % 90) - 45, 0],
            }}
            transition={{
              duration: 2.8 + (i % 5) * 0.5,
              repeat: Infinity,
              delay: i * 0.17,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="ap3d-node-layer">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = stage.id === activeStage;

          return (
            <motion.button
              type="button"
              key={stage.id}
              className={`ap3d-node ${nodePositions[index]} ${isActive ? "active" : ""}`}
              style={{ "--node-accent": stage.accent }}
              onClick={() => setActiveStage(stage.id)}
              whileHover={{ scale: 1.035 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="ap3d-node-number">0{index + 1}</span>
              <span className="ap3d-node-box">
                <Icon size={15} />
                <i />
              </span>
              <span className="ap3d-node-copy">
                <strong>{stage.label}</strong>
                <small>{stage.title}</small>
              </span>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        className="ap3d-hud hud-a"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <span>DATASET FINGERPRINT</span>
        <strong>ACTIVE</strong>
      </motion.div>

      <motion.div
        className="ap3d-hud hud-b"
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 4.7, repeat: Infinity, ease: "easeInOut" }}
      >
        <span>ENGINE SIGNAL</span>
        <strong>{active.label}</strong>
        <small>ROUTED THROUGH DAIE</small>
      </motion.div>

      <div className="ap3d-bottom-status">
        <span className="ap3d-live-dot" />
        <span>ENGINE ONLINE</span>
        <i />
        <span>STAGE {String(activeIndex + 1).padStart(2, "0")} / 06</span>
        <i />
        <span>AUTONOMOUS</span>
      </div>
    </div>
  );
}

/* =========================================================
   PIPELINE NODE
========================================================= */

function PipelineNode({ stage, index, active, onClick }) {
  const Icon = stage.icon;

  return (
    <button
      type="button"
      className={`pipeline-node ${active ? "active" : ""}`}
      onClick={onClick}
      style={{
        "--stage-accent": stage.accent,
      }}
    >
      <span className="pipeline-index">
        0{index + 1}
      </span>

      <span className="pipeline-icon">
        <Icon size={17} />
      </span>

      <span className="pipeline-copy">
        <strong>{stage.label}</strong>
        <small>{stage.title}</small>
      </span>
    </button>
  );
}

/* =========================================================
   PRODUCT PREVIEW
========================================================= */

function ProductPreview() {
  return (
    <div className="workspace-preview">
      <div className="workspace-topbar">
        <div className="workspace-brand">
          <div className="brand-mark">
            <span />
            <span />
            <span />
          </div>

          <span>DataPilot AI</span>
        </div>

        <div className="workspace-status">
          <span className="status-dot" />
          Autonomous engine active
        </div>
      </div>

      <div className="workspace-body">
        <aside className="workspace-sidebar">
          <span className="sidebar-label">ENGINE</span>

          {[
            Database,
            ShieldCheck,
            BarChart3,
            BrainCircuit,
            GitBranch,
            FileBarChart,
          ].map((Icon, index) => (
            <div
              className={`sidebar-icon ${index === 0 ? "selected" : ""}`}
              key={index}
            >
              <Icon size={15} />
            </div>
          ))}
        </aside>

        <main className="workspace-main">
          <div className="workspace-heading">
            <div>
              <span>DATASET INTELLIGENCE</span>
              <h3>Autonomous workspace</h3>
            </div>

            <div className="workspace-chip">
              <Activity size={13} />
              ANALYZING
            </div>
          </div>

          <div className="workspace-grid">
            <div className="preview-panel preview-large">
              <div className="panel-title">
                <span>DATA HEALTH</span>
                <small>LIVE SIGNAL</small>
              </div>

              <div className="health-visual">
                <div className="health-circle">
                  <div>
                    <strong>AI</strong>
                    <small>ENGINE</small>
                  </div>
                </div>

                <div className="health-lines">
                  <span style={{ width: "88%" }} />
                  <span style={{ width: "64%" }} />
                  <span style={{ width: "77%" }} />
                  <span style={{ width: "53%" }} />
                </div>
              </div>
            </div>

            <div className="preview-panel">
              <div className="panel-title">
                <span>FEATURE SIGNAL</span>
                <small>GRAPH</small>
              </div>

              <div className="bars">
                <i style={{ height: "44%" }} />
                <i style={{ height: "70%" }} />
                <i style={{ height: "52%" }} />
                <i style={{ height: "91%" }} />
                <i style={{ height: "61%" }} />
                <i style={{ height: "80%" }} />
                <i style={{ height: "47%" }} />
                <i style={{ height: "68%" }} />
              </div>
            </div>

            <div className="preview-panel">
              <div className="panel-title">
                <span>ML OPPORTUNITY</span>
                <small>DETECTED</small>
              </div>

              <div className="model-detection">
                <BrainCircuit size={19} />
                <strong>MODEL PATH</strong>
                <small>Classification candidate</small>
              </div>
            </div>

            <div className="preview-panel">
              <div className="panel-title">
                <span>EXPLANATION TRACE</span>
                <small>XAI</small>
              </div>

              <div className="trace-lines">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN LANDING
========================================================= */

export default function Landing() {
  const [activeStage, setActiveStage] = useState("profile");
  const [isPaused, setIsPaused] = useState(false);

  const activeStageData = useMemo(
    () => stages.find((stage) => stage.id === activeStage) || stages[0],
    [activeStage]
  );

  useEffect(() => {
    if (isPaused) return undefined;

    const timer = window.setInterval(() => {
      setActiveStage((current) => {
        const currentIndex = stages.findIndex(
          (stage) => stage.id === current
        );

        return stages[(currentIndex + 1) % stages.length].id;
      });
    }, 2600);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  return (
    <div className="landing-page">
      <style>{`
        :root {
          --bg: #080808;
          --surface: #101010;
          --surface-2: #151515;
          --border: rgba(255,255,255,.085);
          --border-strong: rgba(255,255,255,.14);
          --text: #f5f2ec;
          --muted: #96928b;
          --muted-2: #6f6c67;
          --orange: #ff7a59;
          --amber: #ffc857;
          --green: #63d6a2;
          --purple: #a88bff;
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: var(--bg);
          color: var(--text);
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        button,
        a {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .landing-page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 70% 10%,
              rgba(255,122,89,.055),
              transparent 27%
            ),
            radial-gradient(
              circle at 20% 55%,
              rgba(99,214,162,.025),
              transparent 25%
            ),
            #080808;
          overflow: hidden;
        }

        /* =====================================================
           HEADER
        ===================================================== */

        .site-header {
          width: min(1380px, calc(100% - 48px));
          margin: auto;
          height: 82px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 30;
          border-bottom: 1px solid rgba(255,255,255,.055);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 11px;
          text-decoration: none;
          color: var(--text);
          font-weight: 700;
          letter-spacing: -.02em;
        }

        .logo-mark {
          width: 31px;
          height: 31px;
          position: relative;
          border: 1px solid rgba(255,122,89,.55);
          transform: rotate(45deg);
          display: grid;
          place-items: center;
        }

        .logo-mark::before {
          content: "";
          width: 13px;
          height: 13px;
          background: var(--orange);
          box-shadow: 0 0 22px rgba(255,122,89,.45);
        }

        .logo-mark span {
          position: absolute;
          width: 6px;
          height: 6px;
          border: 1px solid var(--amber);
        }

        .logo-mark span:nth-child(1) {
          top: 3px;
          left: 3px;
        }

        .logo-mark span:nth-child(2) {
          bottom: 3px;
          right: 3px;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }

        .logo-text strong {
          font-size: 15px;
        }

        .logo-text small {
          margin-top: 4px;
          color: var(--muted-2);
          font-size: 8px;
          letter-spacing: .18em;
        }

        .header-nav {
          display: flex;
          align-items: center;
          gap: 30px;
        }

        .header-nav a {
          color: var(--muted);
          text-decoration: none;
          font-size: 12px;
          transition: color .2s ease;
        }

        .header-nav a:hover {
          color: var(--text);
        }

        .header-cta {
          padding: 10px 15px;
          border: 1px solid rgba(255,122,89,.35);
          color: var(--text) !important;
          background: rgba(255,122,89,.055);
        }

        /* =====================================================
           HERO
        ===================================================== */

        .hero {
          width: min(1380px, calc(100% - 48px));
          margin: auto;
          min-height: 740px;
          display: grid;
          grid-template-columns: .86fr 1.14fr;
          align-items: center;
          gap: 20px;
          position: relative;
        }

        .hero-copy {
          position: relative;
          z-index: 5;
          padding: 60px 0 80px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 10px;
          letter-spacing: .19em;
          color: var(--muted);
          margin-bottom: 25px;
        }

        .eyebrow-line {
          width: 34px;
          height: 1px;
          background: var(--orange);
        }

        .hero-title {
          margin: 0;
          max-width: 650px;
          font-size: clamp(56px, 6.2vw, 94px);
          line-height: .91;
          letter-spacing: -.065em;
          font-weight: 680;
        }

        .hero-title .accent {
          color: var(--orange);
        }

        .hero-description {
          max-width: 565px;
          margin: 29px 0 0;
          color: var(--muted);
          font-size: 15px;
          line-height: 1.75;
        }

        .hero-actions {
          display: flex;
          gap: 12px;
          margin-top: 34px;
          flex-wrap: wrap;
        }

        .primary-button,
        .secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 47px;
          padding: 0 18px;
          text-decoration: none;
          transition:
            transform .2s ease,
            border-color .2s ease,
            background .2s ease;
        }

        .primary-button {
          background: var(--text);
          color: #090909;
          border: 1px solid var(--text);
          font-size: 12px;
          font-weight: 700;
        }

        .secondary-button {
          color: var(--text);
          border: 1px solid var(--border-strong);
          background: rgba(255,255,255,.02);
          font-size: 12px;
        }

        .primary-button:hover,
        .secondary-button:hover {
          transform: translateY(-2px);
        }

        .secondary-button:hover {
          border-color: rgba(255,122,89,.4);
        }

        .hero-meta {
          display: flex;
          gap: 26px;
          margin-top: 50px;
          flex-wrap: wrap;
        }

        .hero-meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--muted-2);
          font-size: 10px;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .hero-meta-item svg {
          color: var(--green);
        }

        /* =====================================================
           DATA INTELLIGENCE UNIVERSE
        ===================================================== */

        .diu {
          width: min(690px, 100%);
          height: 690px;
          position: relative;
          perspective: 1400px;
          isolation: isolate;
        }

        .diu-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: .78;
          z-index: -1;
        }

        .diu-coordinate {
          position: absolute;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 8px;
          letter-spacing: .12em;
          color: rgba(255,255,255,.19);
        }

        .coordinate-x {
          top: 16%;
          left: 6%;
        }

        .coordinate-y {
          top: 47%;
          left: 3%;
          writing-mode: vertical-rl;
        }

        .coordinate-z {
          right: 7%;
          bottom: 17%;
        }

        .fingerprint {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 520px;
          height: 520px;
          margin: -260px 0 0 -260px;
          transform-style: preserve-3d;
          z-index: 1;
        }

        .fingerprint-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          border: 1px solid rgba(255,255,255,.065);
          border-radius: 50%;
          transform: translate(-50%, -50%) rotateX(68deg);
        }

        .ring-a {
          width: 490px;
          height: 490px;
          animation: fingerprintRotate 22s linear infinite;
        }

        .ring-b {
          width: 430px;
          height: 430px;
          border-color: rgba(255,122,89,.13);
          animation: fingerprintRotateReverse 17s linear infinite;
        }

        .ring-c {
          width: 355px;
          height: 355px;
          border-style: dashed;
          border-color: rgba(255,255,255,.08);
          animation: fingerprintRotate 13s linear infinite;
        }

        .ring-d {
          width: 275px;
          height: 275px;
          border-color: rgba(99,214,162,.1);
          animation: fingerprintRotateReverse 11s linear infinite;
        }

        .fingerprint-marker {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 7px;
          height: 7px;
          border: 1px solid var(--orange);
          background: var(--bg);
          box-shadow: 0 0 12px rgba(255,122,89,.4);
        }

        .marker-one {
          transform: translate(-50%, -50%) translateX(245px);
        }

        .marker-two {
          transform: translate(-50%, -50%) translateX(-215px);
          border-color: var(--green);
        }

        .marker-three {
          transform: translate(-50%, -50%) translateY(-177px);
          border-color: var(--amber);
        }

        .diu-scene {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 390px;
          height: 390px;
          margin: -195px 0 0 -195px;
          transform-style: preserve-3d;
          z-index: 5;
        }

        .dataset-cube {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 245px;
          height: 245px;
          margin: -122.5px 0 0 -122.5px;
          transform-style: preserve-3d;
          transform: rotateX(-17deg) rotateY(-29deg) rotateZ(1deg);
          animation: cubeFloat 7s ease-in-out infinite;
        }

        .cube-face {
          position: absolute;
          width: 245px;
          height: 245px;
          border: 1px solid rgba(255,255,255,.14);
          background:
            linear-gradient(
              135deg,
              rgba(255,255,255,.075),
              rgba(255,255,255,.015)
            );
          backdrop-filter: blur(5px);
          overflow: hidden;
        }

        .cube-front {
          transform: translateZ(122.5px);
          padding: 17px;
          background:
            linear-gradient(
              145deg,
              rgba(255,122,89,.07),
              rgba(255,255,255,.02)
            );
        }

        .cube-back {
          transform: rotateY(180deg) translateZ(122.5px);
        }

        .cube-left {
          transform: rotateY(-90deg) translateZ(122.5px);
        }

        .cube-right {
          transform: rotateY(90deg) translateZ(122.5px);
        }

        .cube-top {
          transform: rotateX(90deg) translateZ(122.5px);
        }

        .cube-bottom {
          transform: rotateX(-90deg) translateZ(122.5px);
        }

        .cube-front::before,
        .cube-front::after {
          content: "";
          position: absolute;
          background: rgba(255,255,255,.06);
        }

        .cube-front::before {
          width: 1px;
          height: 100%;
          left: 25%;
          top: 0;
        }

        .cube-front::after {
          width: 100%;
          height: 1px;
          left: 0;
          top: 25%;
        }

        .cube-header,
        .cube-footer {
          display: flex;
          justify-content: space-between;
          color: rgba(255,255,255,.47);
          font-size: 7px;
          letter-spacing: .14em;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          position: relative;
          z-index: 2;
        }

        .cube-header span:last-child {
          color: var(--green);
        }

        .cube-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
          margin: 27px 0;
        }

        .cell {
          height: 13px;
          border: 1px solid rgba(255,255,255,.085);
          background: rgba(255,255,255,.018);
          transition: .3s ease;
        }

        .cell:nth-child(3n) {
          background: rgba(255,122,89,.055);
        }

        .cell.active {
          border-color: rgba(255,122,89,.6);
          background: rgba(255,122,89,.2);
          box-shadow: 0 0 12px rgba(255,122,89,.18);
        }

        .cube-footer {
          margin-top: auto;
        }

        .ai-kernel {
          position: absolute;
          width: 100px;
          height: 100px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) translateZ(145px);
          transform-style: preserve-3d;
        }

        .kernel-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(255,122,89,.25);
        }

        .kernel-ring-a {
          animation: kernelSpin 8s linear infinite;
          border-left-color: var(--orange);
        }

        .kernel-ring-b {
          transform: rotateX(67deg);
          border-top-color: var(--green);
          animation: kernelSpinReverse 6s linear infinite;
        }

        .kernel-core {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 48px;
          height: 48px;
          transform: translate(-50%, -50%);
          display: grid;
          place-items: center;
          color: var(--orange);
          border: 1px solid rgba(255,122,89,.42);
          background: rgba(12,12,12,.88);
          box-shadow:
            0 0 24px rgba(255,122,89,.13),
            inset 0 0 18px rgba(255,122,89,.08);
        }

        .data-sheet {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 300px;
          height: 190px;
          margin: -95px 0 0 -150px;
          border: 1px solid rgba(255,255,255,.055);
          background: rgba(255,255,255,.012);
          transform-style: preserve-3d;
          display: flex;
          align-items: center;
          justify-content: space-evenly;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          color: rgba(255,255,255,.17);
          font-size: 8px;
          letter-spacing: .1em;
        }

        .sheet-1 {
          transform: translateZ(-70px) rotateX(76deg) rotateZ(3deg);
        }

        .sheet-2 {
          transform: translateZ(-120px) rotateX(76deg) rotateZ(-7deg);
          border-color: rgba(255,122,89,.07);
        }

        .sheet-3 {
          transform: translateZ(-165px) rotateX(76deg) rotateZ(9deg);
        }

        .scan-frame {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 275px;
          height: 275px;
          margin: -137.5px 0 0 -137.5px;
          border: 1px solid rgba(255,122,89,.12);
          transform: translateZ(180px);
          pointer-events: none;
        }

        .scan-frame span {
          position: absolute;
          width: 12px;
          height: 12px;
          border-color: rgba(255,122,89,.7);
        }

        .scan-frame span:nth-child(1) {
          left: -1px;
          top: -1px;
          border-left: 1px solid;
          border-top: 1px solid;
        }

        .scan-frame span:nth-child(2) {
          right: -1px;
          top: -1px;
          border-right: 1px solid;
          border-top: 1px solid;
        }

        .scan-frame span:nth-child(3) {
          left: -1px;
          bottom: -1px;
          border-left: 1px solid;
          border-bottom: 1px solid;
        }

        .scan-frame span:nth-child(4) {
          right: -1px;
          bottom: -1px;
          border-right: 1px solid;
          border-bottom: 1px solid;
        }

        /* =====================================================
           PORTS
        ===================================================== */

        .diu-ports {
          position: absolute;
          inset: 0;
          z-index: 10;
        }

        .diu-port {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: 0;
          color: var(--muted);
          padding: 4px;
          text-align: left;
          transition: .25s ease;
        }

        .port-1 {
          left: 1%;
          top: 27%;
        }

        .port-2 {
          left: 0;
          top: 48%;
        }

        .port-3 {
          left: 6%;
          top: 69%;
        }

        .port-4 {
          right: 1%;
          top: 27%;
          flex-direction: row-reverse;
          text-align: right;
        }

        .port-5 {
          right: 0;
          top: 48%;
          flex-direction: row-reverse;
          text-align: right;
        }

        .port-6 {
          right: 6%;
          top: 69%;
          flex-direction: row-reverse;
          text-align: right;
        }

        .port-node {
          width: 27px;
          height: 27px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(8,8,8,.72);
          color: var(--muted);
          transition: .25s ease;
        }

        .port-label {
          display: flex;
          flex-direction: column;
          gap: 3px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 8px;
          letter-spacing: .12em;
          white-space: nowrap;
        }

        .port-label small {
          color: var(--muted-2);
          font-size: 7px;
        }

        .diu-port:hover,
        .diu-port.active {
          color: var(--text);
        }

        .diu-port.active .port-node {
          border-color: var(--stage-accent);
          color: var(--stage-accent);
          box-shadow:
            0 0 18px color-mix(
              in srgb,
              var(--stage-accent) 25%,
              transparent
            );
        }

        .port-line {
          position: absolute;
          width: 55px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.14)
          );
        }

        .port-1 .port-line,
        .port-2 .port-line,
        .port-3 .port-line {
          right: -58px;
        }

        .port-4 .port-line,
        .port-5 .port-line,
        .port-6 .port-line {
          left: -58px;
          transform: rotate(180deg);
        }

        .diu-port.active .port-line {
          background: linear-gradient(
            90deg,
            transparent,
            var(--stage-accent)
          );
        }

        /* =====================================================
           HUD
        ===================================================== */

        .hud-card {
          position: absolute;
          z-index: 15;
          min-width: 145px;
          padding: 11px 13px;
          display: flex;
          gap: 9px;
          align-items: center;
          border: 1px solid rgba(255,255,255,.09);
          background: rgba(10,10,10,.68);
          backdrop-filter: blur(15px);
          box-shadow: 0 20px 50px rgba(0,0,0,.22);
        }

        .hud-top {
          left: 50%;
          top: 7%;
          transform: translateX(-50%);
        }

        .hud-left {
          left: 4%;
          bottom: 13%;
        }

        .hud-right {
          right: 3%;
          bottom: 15%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 3px;
        }

        .hud-card-icon {
          width: 27px;
          height: 27px;
          display: grid;
          place-items: center;
          color: var(--orange);
          border: 1px solid rgba(255,122,89,.2);
          background: rgba(255,122,89,.045);
        }

        .hud-card span,
        .hud-right span {
          font-size: 7px;
          color: var(--muted-2);
          letter-spacing: .13em;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }

        .hud-card strong {
          display: block;
          color: var(--green);
          margin-top: 3px;
          font-size: 9px;
          letter-spacing: .08em;
        }

        .hud-right strong {
          font-size: 10px;
          color: var(--text);
          letter-spacing: .1em;
        }

        .hud-right small {
          color: var(--muted-2);
          font-size: 7px;
          letter-spacing: .12em;
        }

        .mini-graph {
          height: 30px;
          display: flex;
          align-items: flex-end;
          gap: 3px;
          margin-top: 6px;
        }

        .mini-graph i {
          display: block;
          width: 5px;
          background: var(--orange);
          opacity: .45;
        }

        .mini-graph i:nth-child(1) { height: 40%; }
        .mini-graph i:nth-child(2) { height: 65%; }
        .mini-graph i:nth-child(3) { height: 45%; }
        .mini-graph i:nth-child(4) { height: 90%; }
        .mini-graph i:nth-child(5) { height: 60%; }
        .mini-graph i:nth-child(6) { height: 76%; }
        .mini-graph i:nth-child(7) { height: 54%; }

        .diu-engine-status {
          position: absolute;
          left: 50%;
          bottom: 5%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          color: var(--muted-2);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 7px;
          letter-spacing: .12em;
          z-index: 20;
        }

        .status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 10px rgba(99,214,162,.7);
        }

        .status-divider {
          width: 18px;
          height: 1px;
          background: rgba(255,255,255,.15);
        }

        .diu-stage-indicator {
          position: absolute;
          right: 5%;
          top: 10%;
          display: flex;
          flex-direction: column;
          gap: 4px;
          z-index: 20;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }

        .diu-stage-indicator span {
          color: var(--muted-2);
          font-size: 7px;
          letter-spacing: .15em;
        }

        .diu-stage-indicator strong {
          color: var(--text);
          font-size: 13px;
          letter-spacing: .08em;
        }

        /* =====================================================
           WORKFLOW
        ===================================================== */

        .section {
          width: min(1380px, calc(100% - 48px));
          margin: auto;
          padding: 125px 0;
        }

        .section-header {
          max-width: 730px;
          margin-bottom: 55px;
        }

        .section-kicker {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--orange);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 9px;
          letter-spacing: .16em;
          margin-bottom: 15px;
        }

        .section-kicker::before {
          content: "";
          width: 22px;
          height: 1px;
          background: currentColor;
        }

        .section-title {
          margin: 0;
          font-size: clamp(38px, 5vw, 68px);
          line-height: .98;
          letter-spacing: -.055em;
        }

        .section-description {
          color: var(--muted);
          font-size: 14px;
          line-height: 1.7;
          margin-top: 18px;
          max-width: 600px;
        }

        .workflow-shell {
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 38px 0;
        }

        .workflow-line {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0;
          position: relative;
        }

        .workflow-line::before {
          content: "";
          position: absolute;
          left: 30px;
          right: 30px;
          top: 28px;
          height: 1px;
          background: linear-gradient(
            90deg,
            rgba(255,122,89,.25),
            rgba(255,255,255,.08),
            rgba(99,214,162,.22)
          );
        }

        .pipeline-node {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 13px;
          background: transparent;
          border: 0;
          padding: 0 12px;
          color: var(--muted);
          text-align: left;
        }

        .pipeline-index {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 7px;
          color: var(--muted-2);
          letter-spacing: .1em;
        }

        .pipeline-icon {
          width: 57px;
          height: 57px;
          display: grid;
          place-items: center;
          background: #0c0c0c;
          border: 1px solid var(--border);
          color: var(--muted);
          transition: .25s ease;
        }

        .pipeline-copy {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pipeline-copy strong {
          color: var(--text);
          font-size: 10px;
          letter-spacing: .12em;
        }

        .pipeline-copy small {
          color: var(--muted-2);
          font-size: 9px;
        }

        .pipeline-node.active .pipeline-icon {
          border-color: var(--stage-accent);
          color: var(--stage-accent);
          box-shadow: 0 0 25px rgba(255,122,89,.08);
        }

        .pipeline-node:hover .pipeline-icon {
          transform: translateY(-3px);
        }


        /* =====================================================
           3D AUTONOMOUS PIPELINE
        ===================================================== */

        .workflow-shell-3d {
          position: relative;
          padding: 0;
          border-top: 1px solid rgba(255,255,255,.09);
          border-bottom: 1px solid rgba(255,255,255,.09);
          background:
            radial-gradient(circle at 50% 48%, rgba(255,122,89,.065), transparent 27%),
            radial-gradient(circle at 50% 50%, rgba(255,255,255,.025), transparent 54%),
            #090909;
          overflow: hidden;
        }

        .ap3d {
          height: 620px;
          min-height: 620px;
          position: relative;
          perspective: 1200px;
          overflow: hidden;
          isolation: isolate;
        }

        .ap3d::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: radial-gradient(circle at center, black 0%, rgba(0,0,0,.7) 42%, transparent 78%);
          pointer-events: none;
          z-index: 0;
        }

        .ap3d::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent 34%, rgba(0,0,0,.62) 100%);
          pointer-events: none;
          z-index: 9;
        }

        .ap3d-topline {
          position: absolute;
          top: 20px;
          left: 22px;
          right: 22px;
          display: flex;
          justify-content: space-between;
          color: #6f6c67;
          font: 7px ui-monospace, SFMono-Regular, Menlo, monospace;
          letter-spacing: .16em;
          z-index: 12;
        }

        .ap3d-topline span:first-child { color: var(--orange); }

        .ap3d-coordinate {
          position: absolute;
          color: rgba(255,255,255,.16);
          font: 7px ui-monospace, SFMono-Regular, Menlo, monospace;
          letter-spacing: .14em;
          z-index: 2;
        }

        .ap3d-x { left: 48%; top: 72px; }
        .ap3d-y { left: 24px; top: 50%; }
        .ap3d-z { right: 24px; top: 50%; }

        .ap3d-grid-floor {
          position: absolute;
          width: 78%;
          height: 290px;
          left: 11%;
          bottom: -95px;
          transform: perspective(650px) rotateX(65deg);
          transform-origin: center;
          background:
            linear-gradient(rgba(255,122,89,.09) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,122,89,.09) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: linear-gradient(to top, black, transparent);
          opacity: .42;
          z-index: 1;
        }

        .ap3d-grid-radar {
          position: absolute;
          width: 440px;
          height: 440px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) rotateX(68deg);
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 50%;
          box-shadow:
            0 0 0 40px rgba(255,255,255,.012),
            0 0 0 80px rgba(255,255,255,.008);
          z-index: 1;
        }

        .ap3d-links {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 3;
          overflow: visible;
          pointer-events: none;
        }

        .ap3d-link {
          fill: none;
          stroke: rgba(255,255,255,.10);
          stroke-width: 1;
          stroke-dasharray: 5 10;
          animation: ap3dDash 4.5s linear infinite;
          transition: stroke .35s ease, stroke-width .35s ease, filter .35s ease;
        }

        .ap3d-link.active {
          stroke: var(--link-accent);
          stroke-width: 1.7;
          filter: drop-shadow(0 0 6px var(--link-accent));
        }

        .ap3d-link-dot {
          fill: rgba(255,255,255,.25);
          transition: fill .35s ease, r .35s ease;
        }

        .ap3d-link-dot.active {
          fill: var(--link-accent);
          filter: drop-shadow(0 0 7px var(--link-accent));
        }

        .ap3d-world {
          position: absolute;
          width: 360px;
          height: 360px;
          left: 50%;
          top: 50%;
          margin: -180px 0 0 -180px;
          transform-style: preserve-3d;
          transition: transform .16s ease-out;
          z-index: 5;
        }

        .ap3d-orbit {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 340px;
          height: 140px;
          margin: -70px 0 0 -170px;
          border: 1px solid rgba(255,122,89,.16);
          border-radius: 50%;
          transform-style: preserve-3d;
          pointer-events: none;
        }

        .orbit-a {
          transform: rotateX(68deg) rotateZ(8deg);
          animation: ap3dOrbit 14s linear infinite;
        }

        .orbit-b {
          width: 300px;
          height: 120px;
          margin: -60px 0 0 -150px;
          border-color: rgba(255,200,87,.13);
          transform: rotateX(68deg) rotateZ(-42deg);
          animation: ap3dOrbitReverse 11s linear infinite;
        }

        .orbit-c {
          width: 390px;
          height: 170px;
          margin: -85px 0 0 -195px;
          border-color: rgba(99,214,162,.09);
          transform: rotateX(68deg) rotateZ(55deg);
          animation: ap3dOrbit 18s linear infinite;
        }

        .ap3d-data-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          transform-style: preserve-3d;
          border-radius: 50%;
          pointer-events: none;
        }

        .ring-one {
          width: 310px;
          height: 310px;
          margin: -155px 0 0 -155px;
          transform: rotateX(67deg) rotateY(12deg);
          animation: ap3dRing 22s linear infinite;
        }

        .ring-two {
          width: 250px;
          height: 250px;
          margin: -125px 0 0 -125px;
          transform: rotateY(68deg) rotateZ(22deg);
          animation: ap3dRingReverse 16s linear infinite;
        }

        .ap3d-data-ring span {
          position: absolute;
          width: 3px;
          height: 3px;
          left: 50%;
          top: 0;
          margin-left: -1.5px;
          border-radius: 50%;
          background: rgba(255,255,255,.38);
          transform: rotate(calc(var(--i) * 20deg)) translateY(-50%);
          transform-origin: 1.5px 155px;
        }

        .ring-two span {
          background: rgba(255,122,89,.65);
          transform-origin: 1.5px 125px;
        }

        .ap3d-core-shadow {
          position: absolute;
          width: 260px;
          height: 110px;
          left: 50%;
          bottom: 27px;
          margin-left: -130px;
          background: radial-gradient(ellipse, rgba(255,122,89,.24), transparent 68%);
          filter: blur(18px);
          transform: rotateX(68deg);
        }

        .ap3d-core {
          position: absolute;
          width: 150px;
          height: 150px;
          left: 50%;
          top: 50%;
          margin: -75px 0 0 -75px;
          transform-style: preserve-3d;
          transform: rotateX(-17deg) rotateY(-25deg) rotateZ(2deg);
          animation: ap3dCubeFloat 5.2s ease-in-out infinite;
        }

        .ap3d-cube-face {
          position: absolute;
          inset: 0;
          border: 1px solid rgba(255,255,255,.16);
          background: rgba(13,13,13,.86);
          backface-visibility: visible;
        }

        .face-front {
          transform: translateZ(75px);
          background:
            linear-gradient(135deg, rgba(255,122,89,.09), transparent 48%),
            rgba(12,12,12,.9);
        }

        .face-right {
          transform: rotateY(90deg) translateZ(75px);
          background: linear-gradient(180deg, rgba(255,200,87,.07), rgba(8,8,8,.9));
        }

        .face-top {
          transform: rotateX(90deg) translateZ(75px);
          background: linear-gradient(135deg, rgba(255,255,255,.07), rgba(255,122,89,.025));
        }

        .ap3d-cube-grid {
          position: absolute;
          inset: 23px 18px 34px;
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          grid-template-rows: repeat(6, 1fr);
          gap: 5px;
          transform: translateZ(1px);
        }

        .ap3d-cube-grid span {
          border: 1px solid rgba(255,255,255,.065);
          background: rgba(255,255,255,.018);
          animation: ap3dCell 3.6s ease-in-out infinite;
          animation-delay: calc(var(--i, 0) * 70ms);
        }

        .ap3d-cube-grid span.lit {
          border-color: rgba(255,122,89,.55);
          background: rgba(255,122,89,.13);
          box-shadow: inset 0 0 8px rgba(255,122,89,.08);
        }

        .ap3d-cube-code {
          position: absolute;
          left: 17px;
          bottom: 13px;
          color: rgba(255,255,255,.42);
          font: 6px ui-monospace, SFMono-Regular, Menlo, monospace;
          letter-spacing: .13em;
        }

        .ap3d-core-inner {
          position: absolute;
          width: 78px;
          height: 78px;
          left: 36px;
          top: 36px;
          transform: translateZ(77px);
          transform-style: preserve-3d;
        }

        .ap3d-inner-ring {
          position: absolute;
          inset: 0;
          border: 1px solid rgba(255,122,89,.28);
          border-radius: 50%;
        }

        .inner-a {
          transform: rotateX(68deg);
          animation: ap3dInnerSpin 7s linear infinite;
        }

        .inner-b {
          transform: rotateY(68deg);
          border-color: rgba(255,200,87,.22);
          animation: ap3dInnerSpinReverse 5.5s linear infinite;
        }

        .ap3d-inner-node {
          position: absolute;
          inset: 18px;
          display: grid;
          place-items: center;
          color: var(--orange);
          border: 1px solid rgba(255,122,89,.32);
          background: rgba(255,122,89,.055);
          box-shadow: 0 0 35px rgba(255,122,89,.12);
        }

        .ap3d-scanner {
          position: absolute;
          width: 205px;
          height: 1px;
          left: 50%;
          margin-left: -102.5px;
          top: 54px;
          background: linear-gradient(90deg, transparent, rgba(255,122,89,.75), transparent);
          box-shadow: 0 0 14px rgba(255,122,89,.3);
          transform: translateZ(105px);
          animation: ap3dScan 3.6s ease-in-out infinite;
        }

        .ap3d-particle {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 4px;
          height: 4px;
          margin: -2px;
          border-radius: 50%;
          background: var(--orange);
          box-shadow: 0 0 10px rgba(255,122,89,.65);
          transform: translateZ(calc(var(--particle-i) * 12px));
        }

        .ap3d-node-layer {
          position: absolute;
          inset: 0;
          z-index: 11;
        }

        .ap3d-node {
          position: absolute;
          width: 170px;
          min-height: 72px;
          padding: 0;
          border: 0;
          background: transparent;
          color: var(--muted);
          text-align: left;
          display: grid;
          grid-template-columns: 28px 48px 1fr;
          align-items: center;
          column-gap: 10px;
          transition: filter .3s ease;
        }

        .ap3d-node:hover { filter: brightness(1.22); }

        .node-1 { left: 7%; top: 18%; }
        .node-2 { left: 4%; top: 45%; }
        .node-3 { left: 7%; top: 71%; }
        .node-4 { right: 7%; top: 18%; }
        .node-5 { right: 4%; top: 45%; }
        .node-6 { right: 7%; top: 71%; }

        .ap3d-node-number {
          align-self: start;
          padding-top: 6px;
          color: #5f5c58;
          font: 7px ui-monospace, SFMono-Regular, Menlo, monospace;
          letter-spacing: .1em;
        }

        .ap3d-node-box {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          position: relative;
          border: 1px solid rgba(255,255,255,.11);
          background: rgba(10,10,10,.82);
          color: #77736d;
          transition: all .3s ease;
          box-shadow: 0 15px 35px rgba(0,0,0,.25);
        }

        .ap3d-node-box i {
          position: absolute;
          width: 5px;
          height: 5px;
          right: 5px;
          top: 5px;
          border: 1px solid currentColor;
          opacity: .45;
        }

        .ap3d-node-copy {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ap3d-node-copy strong {
          color: #a8a39b;
          font-size: 9px;
          letter-spacing: .12em;
        }

        .ap3d-node-copy small {
          color: #5e5a55;
          font-size: 8px;
          line-height: 1.25;
        }

        .ap3d-node.active .ap3d-node-box {
          color: var(--node-accent);
          border-color: var(--node-accent);
          background: color-mix(in srgb, var(--node-accent) 7%, #0b0b0b);
          box-shadow:
            0 0 0 1px color-mix(in srgb, var(--node-accent) 12%, transparent),
            0 0 28px color-mix(in srgb, var(--node-accent) 16%, transparent);
        }

        .ap3d-node.active .ap3d-node-copy strong {
          color: var(--text);
        }

        .ap3d-node.active .ap3d-node-copy small {
          color: #858078;
        }

        .ap3d-node.active .ap3d-node-box::after {
          content: "";
          position: absolute;
          inset: -5px;
          border: 1px solid var(--node-accent);
          opacity: .16;
          animation: ap3dNodePulse 1.8s ease-out infinite;
        }

        .ap3d-hud {
          position: absolute;
          z-index: 12;
          min-width: 170px;
          padding: 12px 13px;
          border: 1px solid rgba(255,255,255,.09);
          background: rgba(9,9,9,.78);
          backdrop-filter: blur(10px);
          box-shadow: 0 20px 50px rgba(0,0,0,.28);
        }

        .hud-a { right: 22%; top: 8%; }
        .hud-b { right: 22%; bottom: 9%; min-width: 185px; }

        .ap3d-hud span,
        .ap3d-hud small {
          display: block;
          color: #69655f;
          font: 7px ui-monospace, SFMono-Regular, Menlo, monospace;
          letter-spacing: .13em;
        }

        .ap3d-hud strong {
          display: block;
          margin-top: 6px;
          color: var(--green);
          font-size: 11px;
          letter-spacing: .08em;
        }

        .ap3d-hud small {
          margin-top: 5px;
          color: #5d5954;
          letter-spacing: .08em;
        }

        .ap3d-bottom-status {
          position: absolute;
          left: 50%;
          bottom: 22px;
          transform: translateX(-50%);
          z-index: 12;
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
          color: #65615c;
          font: 7px ui-monospace, SFMono-Regular, Menlo, monospace;
          letter-spacing: .12em;
        }

        .ap3d-bottom-status i {
          width: 22px;
          height: 1px;
          background: rgba(255,255,255,.13);
        }

        .ap3d-live-dot,
        .ap3d-signal-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 9px rgba(99,214,162,.65);
        }

        .ap3d-active-panel {
          position: relative;
          margin: 0 28px 28px;
          padding: 22px 24px 20px;
          border: 1px solid rgba(255,255,255,.07);
          border-left: 2px solid var(--active-accent);
          background:
            linear-gradient(90deg, color-mix(in srgb, var(--active-accent) 5%, transparent), transparent 42%),
            rgba(255,255,255,.018);
          box-shadow: inset 0 1px rgba(255,255,255,.025);
          z-index: 20;
        }

        .ap3d-active-kicker {
          color: var(--active-accent);
          font: 8px ui-monospace, SFMono-Regular, Menlo, monospace;
          letter-spacing: .15em;
        }

        .ap3d-active-title {
          margin-top: 7px;
          font-size: 18px;
          font-weight: 650;
          letter-spacing: -.025em;
        }

        .ap3d-active-description {
          margin-top: 6px;
          max-width: 720px;
          color: var(--muted);
          font-size: 12px;
          line-height: 1.6;
        }

        .ap3d-active-signal {
          position: absolute;
          right: 24px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          color: #68635e;
          font: 7px ui-monospace, SFMono-Regular, Menlo, monospace;
          letter-spacing: .1em;
        }

        .ap3d-signal-line {
          width: 46px;
          height: 1px;
          background: linear-gradient(90deg, var(--active-accent), transparent);
        }

        @keyframes ap3dDash {
          to { stroke-dashoffset: -80; }
        }

        @keyframes ap3dOrbit {
          from { transform: rotateX(68deg) rotateZ(8deg) rotateZ(0deg); }
          to { transform: rotateX(68deg) rotateZ(8deg) rotateZ(360deg); }
        }

        @keyframes ap3dOrbitReverse {
          from { transform: rotateX(68deg) rotateZ(-42deg) rotateZ(360deg); }
          to { transform: rotateX(68deg) rotateZ(-42deg) rotateZ(0deg); }
        }

        @keyframes ap3dRing {
          from { transform: rotateX(67deg) rotateY(12deg) rotateZ(0deg); }
          to { transform: rotateX(67deg) rotateY(12deg) rotateZ(360deg); }
        }

        @keyframes ap3dRingReverse {
          from { transform: rotateY(68deg) rotateZ(22deg) rotateX(0deg); }
          to { transform: rotateY(68deg) rotateZ(22deg) rotateX(360deg); }
        }

        @keyframes ap3dCubeFloat {
          0%, 100% { transform: translateY(0) rotateX(-17deg) rotateY(-25deg) rotateZ(2deg); }
          50% { transform: translateY(-8px) rotateX(-19deg) rotateY(-31deg) rotateZ(3deg); }
        }

        @keyframes ap3dCell {
          0%, 100% { opacity: .45; }
          50% { opacity: .9; }
        }

        @keyframes ap3dScan {
          0% { top: 38px; opacity: 0; }
          15% { opacity: .85; }
          50% { top: 112px; opacity: .9; }
          85% { opacity: .4; }
          100% { top: 190px; opacity: 0; }
        }

        @keyframes ap3dInnerSpin {
          to { transform: rotateX(68deg) rotateZ(360deg); }
        }

        @keyframes ap3dInnerSpinReverse {
          to { transform: rotateY(68deg) rotateZ(-360deg); }
        }

        @keyframes ap3dNodePulse {
          0% { transform: scale(.86); opacity: .45; }
          100% { transform: scale(1.35); opacity: 0; }
        }

        @media (max-width: 900px) {
          .ap3d {
            height: 570px;
            min-height: 570px;
          }

          .ap3d-world { transform: scale(.86); }
          .ap3d-node { width: 145px; grid-template-columns: 23px 42px 1fr; column-gap: 7px; }
          .ap3d-node-box { width: 42px; height: 42px; }
          .node-1 { left: 2%; }
          .node-2 { left: 1%; }
          .node-3 { left: 2%; }
          .node-4 { right: 2%; }
          .node-5 { right: 1%; }
          .node-6 { right: 2%; }
          .hud-a { right: 17%; }
          .hud-b { right: 17%; }
          .ap3d-active-signal { display: none; }
        }

        @media (max-width: 650px) {
          .ap3d {
            height: 690px;
            min-height: 690px;
          }

          .ap3d-world {
            width: 310px;
            height: 310px;
            margin: -155px 0 0 -155px;
            transform: scale(.7);
          }

          .ap3d-links { opacity: .55; }
          .ap3d-node { width: 125px; grid-template-columns: 18px 36px 1fr; }
          .ap3d-node-box { width: 36px; height: 36px; }
          .ap3d-node-copy strong { font-size: 8px; }
          .ap3d-node-copy small { font-size: 7px; }
          .node-1 { left: 4%; top: 16%; }
          .node-2 { left: 1%; top: 43%; }
          .node-3 { left: 4%; top: 70%; }
          .node-4 { right: 4%; top: 16%; }
          .node-5 { right: 1%; top: 43%; }
          .node-6 { right: 4%; top: 70%; }
          .hud-a { top: 4%; right: 50%; transform: translateX(50%); }
          .hud-b { right: 50%; bottom: 3%; transform: translateX(50%); }
          .ap3d-topline span:last-child { display: none; }
          .ap3d-bottom-status { bottom: 83px; }
          .ap3d-active-panel { margin: 0 14px 14px; padding: 18px; }
        }

        /* =====================================================
           INTELLIGENCE LAYERS
        ===================================================== */

        .intelligence-section {
          background:
            linear-gradient(
              180deg,
              transparent,
              rgba(255,255,255,.018),
              transparent
            );
        }

        .intelligence-layout {
          display: grid;
          grid-template-columns: .7fr 1.3fr;
          gap: 80px;
        }

        .intelligence-intro {
          position: sticky;
          top: 100px;
          height: fit-content;
        }

        .engine-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          border: 1px solid var(--border);
          color: var(--muted);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 8px;
          letter-spacing: .12em;
        }

        .engine-label span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--orange);
          box-shadow: 0 0 10px var(--orange);
        }

        .intelligence-intro h2 {
          margin: 25px 0 0;
          font-size: clamp(38px, 4.5vw, 64px);
          line-height: .98;
          letter-spacing: -.055em;
        }

        .intelligence-intro p {
          color: var(--muted);
          line-height: 1.7;
          font-size: 13px;
          max-width: 390px;
          margin-top: 22px;
        }

        .engine-spec {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          margin-top: 38px;
          border-top: 1px solid var(--border);
          border-left: 1px solid var(--border);
        }

        .engine-spec div {
          padding: 15px;
          border-right: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }

        .engine-spec small {
          display: block;
          color: var(--muted-2);
          font-size: 8px;
          letter-spacing: .1em;
        }

        .engine-spec strong {
          display: block;
          margin-top: 6px;
          font-size: 11px;
        }

        .intelligence-list {
          border-top: 1px solid var(--border);
        }

        .intelligence-row {
          display: grid;
          grid-template-columns: 60px 55px 1fr;
          gap: 20px;
          align-items: center;
          padding: 25px 0;
          border-bottom: 1px solid var(--border);
          transition: padding .25s ease;
        }

        .intelligence-row:hover {
          padding-left: 10px;
          padding-right: 10px;
          background: rgba(255,255,255,.012);
        }

        .intelligence-code {
          color: var(--muted-2);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 9px;
        }

        .intelligence-icon {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border: 1px solid var(--border);
          color: var(--orange);
        }

        .intelligence-row h3 {
          margin: 0;
          font-size: 15px;
          letter-spacing: -.02em;
        }

        .intelligence-row p {
          margin: 6px 0 0;
          color: var(--muted);
          font-size: 12px;
          line-height: 1.6;
        }

        /* =====================================================
           CAPABILITIES
        ===================================================== */

        .capabilities-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid var(--border);
          border-left: 1px solid var(--border);
        }

        .capability-card {
          min-height: 300px;
          padding: 27px;
          border-right: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          position: relative;
          transition:
            background .25s ease,
            transform .25s ease;
        }

        .capability-card:hover {
          background: rgba(255,255,255,.022);
          transform: translateY(-3px);
        }

        .capability-number {
          color: var(--muted-2);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 9px;
        }

        .capability-icon {
          width: 43px;
          height: 43px;
          margin-top: 50px;
          display: grid;
          place-items: center;
          color: var(--orange);
          border: 1px solid rgba(255,122,89,.16);
          background: rgba(255,122,89,.035);
        }

        .capability-card h3 {
          margin: 18px 0 0;
          font-size: 16px;
          letter-spacing: -.025em;
        }

        .capability-card p {
          color: var(--muted);
          font-size: 12px;
          line-height: 1.65;
          margin: 10px 0 0;
          max-width: 320px;
        }

        .capability-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 20px;
        }

        .capability-tags span {
          border: 1px solid var(--border);
          padding: 5px 7px;
          color: var(--muted-2);
          font-size: 7px;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        /* =====================================================
           PRODUCT PREVIEW
        ===================================================== */

        .preview-section {
          padding-top: 70px;
        }

        .workspace-preview {
          border: 1px solid var(--border-strong);
          background: #0b0b0b;
          box-shadow:
            0 50px 100px rgba(0,0,0,.4),
            inset 0 1px rgba(255,255,255,.035);
          overflow: hidden;
        }

        .workspace-topbar {
          height: 58px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 18px;
        }

        .workspace-brand {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 11px;
          font-weight: 600;
        }

        .brand-mark {
          width: 20px;
          height: 20px;
          border: 1px solid var(--orange);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
        }

        .brand-mark span {
          width: 2px;
          background: var(--orange);
        }

        .brand-mark span:nth-child(1) { height: 6px; }
        .brand-mark span:nth-child(2) { height: 11px; }
        .brand-mark span:nth-child(3) { height: 8px; }

        .workspace-status {
          display: flex;
          align-items: center;
          gap: 7px;
          color: var(--muted-2);
          font-size: 8px;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .workspace-body {
          display: grid;
          grid-template-columns: 62px 1fr;
          min-height: 390px;
        }

        .workspace-sidebar {
          border-right: 1px solid var(--border);
          padding: 16px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 9px;
        }

        .sidebar-label {
          color: var(--muted-2);
          font-size: 6px;
          letter-spacing: .13em;
          margin-bottom: 5px;
        }

        .sidebar-icon {
          width: 33px;
          height: 33px;
          display: grid;
          place-items: center;
          color: var(--muted-2);
          border: 1px solid transparent;
        }

        .sidebar-icon.selected {
          color: var(--orange);
          border-color: rgba(255,122,89,.2);
          background: rgba(255,122,89,.04);
        }

        .workspace-main {
          padding: 22px;
        }

        .workspace-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 18px;
        }

        .workspace-heading span {
          color: var(--muted-2);
          font-size: 7px;
          letter-spacing: .15em;
        }

        .workspace-heading h3 {
          margin: 5px 0 0;
          font-size: 17px;
          letter-spacing: -.02em;
        }

        .workspace-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 9px;
          border: 1px solid rgba(99,214,162,.18);
          color: var(--green);
          font-size: 7px;
          letter-spacing: .1em;
        }

        .workspace-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 10px;
        }

        .preview-panel {
          min-height: 145px;
          padding: 14px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,.012);
        }

        .preview-large {
          grid-row: span 2;
          min-height: 300px;
        }

        .panel-title {
          display: flex;
          justify-content: space-between;
          color: var(--muted);
          font-size: 7px;
          letter-spacing: .11em;
        }

        .panel-title small {
          color: var(--muted-2);
        }

        .health-visual {
          height: 245px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 30px;
        }

        .health-circle {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          border: 1px solid rgba(255,122,89,.25);
          display: grid;
          place-items: center;
          position: relative;
          background:
            radial-gradient(
              circle,
              rgba(255,122,89,.1),
              transparent 63%
            );
        }

        .health-circle::before {
          content: "";
          position: absolute;
          inset: 12px;
          border: 1px dashed rgba(255,255,255,.12);
          border-radius: 50%;
          animation: fingerprintRotate 14s linear infinite;
        }

        .health-circle strong {
          display: block;
          text-align: center;
          font-size: 23px;
          letter-spacing: -.04em;
        }

        .health-circle small {
          display: block;
          text-align: center;
          color: var(--muted-2);
          font-size: 6px;
          letter-spacing: .15em;
          margin-top: 4px;
        }

        .health-lines {
          width: 130px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .health-lines span {
          height: 3px;
          background: linear-gradient(
            90deg,
            var(--orange),
            rgba(255,122,89,.1)
          );
        }

        .bars {
          height: 90px;
          display: flex;
          align-items: flex-end;
          gap: 6px;
          margin-top: 22px;
        }

        .bars i {
          flex: 1;
          background: linear-gradient(
            180deg,
            var(--orange),
            rgba(255,122,89,.08)
          );
          opacity: .65;
        }

        .model-detection {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
          color: var(--orange);
        }

        .model-detection strong {
          color: var(--text);
          font-size: 10px;
          letter-spacing: .1em;
        }

        .model-detection small {
          color: var(--muted-2);
          font-size: 8px;
        }

        .trace-lines {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 20px;
        }

        .trace-lines span {
          height: 2px;
          background: linear-gradient(
            90deg,
            rgba(168,139,255,.7),
            rgba(168,139,255,.04)
          );
        }

        .trace-lines span:nth-child(1) { width: 90%; }
        .trace-lines span:nth-child(2) { width: 72%; }
        .trace-lines span:nth-child(3) { width: 84%; }
        .trace-lines span:nth-child(4) { width: 56%; }
        .trace-lines span:nth-child(5) { width: 68%; }

        /* =====================================================
           CTA
        ===================================================== */

        .cta-section {
          padding: 150px 0 100px;
          text-align: center;
        }

        .cta-box {
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 85px 20px;
          position: relative;
          overflow: hidden;
        }

        .cta-box::before {
          content: "";
          position: absolute;
          width: 400px;
          height: 400px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(
            circle,
            rgba(255,122,89,.07),
            transparent 67%
          );
          pointer-events: none;
        }

        .cta-label {
          color: var(--orange);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 8px;
          letter-spacing: .17em;
        }

        .cta-title {
          position: relative;
          margin: 18px auto 0;
          max-width: 780px;
          font-size: clamp(42px, 6vw, 78px);
          line-height: .95;
          letter-spacing: -.06em;
        }

        .cta-description {
          position: relative;
          max-width: 510px;
          margin: 22px auto 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.7;
        }

        .cta-button {
          position: relative;
          margin-top: 31px;
        }

        /* =====================================================
           FOOTER
        ===================================================== */

        .site-footer {
          width: min(1380px, calc(100% - 48px));
          margin: auto;
          padding: 30px 0 35px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          color: var(--muted-2);
          font-size: 9px;
        }

        .footer-right {
          display: flex;
          gap: 18px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }

        /* =====================================================
           ANIMATIONS
        ===================================================== */

        @keyframes fingerprintRotate {
          from {
            transform: translate(-50%, -50%) rotateX(68deg) rotateZ(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotateX(68deg) rotateZ(360deg);
          }
        }

        @keyframes fingerprintRotateReverse {
          from {
            transform: translate(-50%, -50%) rotateX(68deg) rotateZ(360deg);
          }
          to {
            transform: translate(-50%, -50%) rotateX(68deg) rotateZ(0deg);
          }
        }

        @keyframes cubeFloat {
          0%, 100% {
            margin-top: -122.5px;
          }

          50% {
            margin-top: -130px;
          }
        }

        @keyframes kernelSpin {
          from {
            transform: rotateZ(0deg) rotateX(65deg);
          }

          to {
            transform: rotateZ(360deg) rotateX(65deg);
          }
        }

        @keyframes kernelSpinReverse {
          from {
            transform: rotateZ(360deg) rotateX(65deg);
          }

          to {
            transform: rotateZ(0deg) rotateX(65deg);
          }
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 1180px) {
          .hero {
            grid-template-columns: 1fr;
            padding-top: 35px;
          }

          .hero-copy {
            padding-bottom: 20px;
          }

          .hero-description {
            max-width: 650px;
          }

          .diu {
            margin: auto;
          }

          .intelligence-layout {
            grid-template-columns: 1fr;
            gap: 50px;
          }

          .intelligence-intro {
            position: static;
          }
        }

        @media (max-width: 900px) {
          .header-nav a:not(.header-cta) {
            display: none;
          }

          .workflow-line {
            grid-template-columns: repeat(3, 1fr);
            gap: 32px 0;
          }

          .workflow-line::before {
            display: none;
          }

          .capabilities-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .diu {
            height: 600px;
            transform: scale(.9);
            transform-origin: center;
            margin-left: -5%;
            margin-right: -5%;
            width: 110%;
          }
        }

        @media (max-width: 650px) {
          .site-header,
          .hero,
          .section,
          .site-footer {
            width: min(100% - 28px, 1380px);
          }

          .site-header {
            height: 70px;
          }

          .header-nav {
            gap: 10px;
          }

          .header-cta {
            padding: 8px 10px;
          }

          .hero {
            min-height: auto;
          }

          .hero-title {
            font-size: clamp(48px, 15vw, 70px);
          }

          .hero-description {
            font-size: 13px;
          }

          .hero-meta {
            gap: 13px;
          }

          .diu {
            height: 500px;
            width: 125%;
            margin-left: -12.5%;
            transform: scale(.78);
            transform-origin: center;
          }

          .section {
            padding: 90px 0;
          }

          .workflow-line {
            grid-template-columns: repeat(2, 1fr);
          }

          .capabilities-grid {
            grid-template-columns: 1fr;
          }

          .intelligence-row {
            grid-template-columns: 38px 45px 1fr;
            gap: 10px;
          }

          .engine-spec {
            grid-template-columns: 1fr 1fr;
          }

          .workspace-body {
            grid-template-columns: 45px 1fr;
          }

          .workspace-main {
            padding: 12px;
          }

          .workspace-grid {
            grid-template-columns: 1fr;
          }

          .preview-large {
            grid-row: auto;
            min-height: 240px;
          }

          .health-visual {
            height: 190px;
          }

          .health-circle {
            width: 110px;
            height: 110px;
          }

          .health-lines {
            width: 80px;
          }

          .cta-section {
            padding-top: 100px;
          }

          .site-footer {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: .001ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="site-header">
        <Link to="/" className="logo">
          <div className="logo-mark">
            <span />
            <span />
          </div>

          <div className="logo-text">
            <strong>DataPilot AI</strong>
            <small>AUTONOMOUS DATA SCIENCE</small>
          </div>
        </Link>

        <nav className="header-nav">
          <a href="#intelligence">Engine</a>
          <a href="#workflow">Workflow</a>
          <a href="#capabilities">Capabilities</a>

          <Link to="/app/overview" className="header-cta">
            Open workspace
          </Link>
        </nav>
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              DATASET → INTELLIGENCE → DECISIONS
            </div>

            <h1 className="hero-title">
              From raw data
              <br />
              to <span className="accent">decisions.</span>
            </h1>

            <p className="hero-description">
              DataPilot AI is an autonomous data-science workspace that
              transforms datasets into structured intelligence — profiling
              data, detecting quality issues, discovering patterns,
              identifying ML opportunities and explaining the resulting
              decisions.
            </p>

            <div className="hero-actions">
              <Link to="/app/overview" className="primary-button">
                Start analyzing
                <ArrowRight size={15} />
              </Link>

              <a href="#intelligence" className="secondary-button">
                Explore the engine
                <ArrowUpRight size={14} />
              </a>
            </div>

            <div className="hero-meta">
              <div className="hero-meta-item">
                <CheckCircle2 size={12} />
                Autonomous workflow
              </div>

              <div className="hero-meta-item">
                <CheckCircle2 size={12} />
                Explainable AI
              </div>

              <div className="hero-meta-item">
                <CheckCircle2 size={12} />
                Decision intelligence
              </div>
            </div>
          </div>

          <DataIntelligenceUniverse
            activeStage={activeStage}
            setActiveStage={setActiveStage}
          />
        </section>

        {/* =====================================================
            WORKFLOW — 3D AUTONOMOUS PIPELINE
        ===================================================== */}

        <section className="section" id="workflow">
          <div className="section-header">
            <div className="section-kicker">AUTONOMOUS PIPELINE</div>

            <h2 className="section-title">
              One dataset.
              <br />
              Six intelligence stages.
            </h2>

            <p className="section-description">
              The engine moves through a connected analytical pipeline,
              allowing each stage to inform the next instead of treating
              data science as isolated tasks.
            </p>
          </div>

          <div
            className="workflow-shell workflow-shell-3d"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <AutonomousPipeline3D
              activeStage={activeStage}
              setActiveStage={setActiveStage}
            />

            <motion.div
              key={activeStage}
              className="ap3d-active-panel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              style={{ "--active-accent": activeStageData.accent }}
            >
              <div className="ap3d-active-kicker">
                ACTIVE STAGE / {activeStageData.label}
              </div>
              <div className="ap3d-active-title">
                {activeStageData.title}
              </div>
              <div className="ap3d-active-description">
                {activeStageData.description}
              </div>
              <div className="ap3d-active-signal">
                <span className="ap3d-signal-dot" />
                <span>DAIE SIGNAL ROUTED</span>
                <span className="ap3d-signal-line" />
                <span>{String(stages.findIndex((s) => s.id === activeStage) + 1).padStart(2, "0")} / 06</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* =====================================================
            INTELLIGENCE ENGINE
        ===================================================== */}

        <section className="section intelligence-section" id="intelligence">
          <div className="intelligence-layout">
            <div className="intelligence-intro">
              <div className="engine-label">
                <span />
                DAIE / ENGINE CORE
              </div>

              <h2>
                Built around
                <br />
                <span style={{ color: "var(--orange)" }}>
                  intelligence.
                </span>
              </h2>

              <p>
                DataPilot's core is designed as an autonomous intelligence
                layer connecting dataset understanding, feature reasoning,
                machine learning and explainability.
              </p>

              <div className="engine-spec">
                <div>
                  <small>ENGINE</small>
                  <strong>DAIE</strong>
                </div>

                <div>
                  <small>MODE</small>
                  <strong>AUTONOMOUS</strong>
                </div>

                <div>
                  <small>REASONING</small>
                  <strong>DATA + AI</strong>
                </div>

                <div>
                  <small>OUTPUT</small>
                  <strong>DECISIONS</strong>
                </div>
              </div>
            </div>

            <div className="intelligence-list">
              {intelligenceLayers.map((layer, index) => {
                const Icon = layer.icon;

                return (
                  <motion.div
                    className="intelligence-row"
                    key={layer.code}
                    initial={{ opacity: 0, x: 15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{
                      duration: 0.35,
                      delay: index * 0.05,
                    }}
                  >
                    <span className="intelligence-code">
                      {layer.code}
                    </span>

                    <div className="intelligence-icon">
                      <Icon size={17} />
                    </div>

                    <div>
                      <h3>{layer.title}</h3>
                      <p>{layer.text}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================
            CAPABILITIES
        ===================================================== */}

        <section className="section" id="capabilities">
          <div className="section-header">
            <div className="section-kicker">CAPABILITIES</div>

            <h2 className="section-title">
              Everything between
              <br />
              upload and insight.
            </h2>

            <p className="section-description">
              A unified environment for data profiling, quality analysis,
              exploration, machine learning, explainability and reporting.
            </p>
          </div>

          <div className="capabilities-grid">
            {capabilities.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.article
                  className="capability-card"
                  key={item.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.05,
                  }}
                >
                  <span className="capability-number">
                    {item.number}
                  </span>

                  <div className="capability-icon">
                    <Icon size={18} />
                  </div>

                  <h3>{item.title}</h3>

                  <p>{item.text}</p>

                  <div className="capability-tags">
                    {item.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            PRODUCT PREVIEW
        ===================================================== */}

        <section className="section preview-section">
          <div className="section-header">
            <div className="section-kicker">THE WORKSPACE</div>

            <h2 className="section-title">
              The intelligence
              <br />
              workspace.
            </h2>

            <p className="section-description">
              One connected environment where the analytical journey,
              model discovery and explanation remain visible together.
            </p>
          </div>

          <ProductPreview />
        </section>

        {/* =====================================================
            CTA
        ===================================================== */}

        <section className="cta-section">
          <div className="cta-box">
            <div className="cta-label">
              READY FOR THE DATASET
            </div>

            <h2 className="cta-title">
              Let the data
              <br />
              reveal itself.
            </h2>

            <p className="cta-description">
              Upload a dataset and move from raw structure to analytical
              intelligence through the DataPilot autonomous workflow.
            </p>

            <Link
              to="/app/overview"
              className="primary-button cta-button"
            >
              Open DataPilot
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="site-footer">
        <div>
          © {new Date().getFullYear()} DataPilot AI
        </div>

        <div className="footer-right">
          <span>DAIE</span>
          <span>AI DATA SCIENCE</span>
          <span>MIT WPU</span>
        </div>
      </footer>
    </div>
  );
}