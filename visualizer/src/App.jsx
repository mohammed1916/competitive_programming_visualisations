import React, {
  useEffect,
  useMemo,
  useState,
  Component,
  Suspense,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

import ProblemScaffold from "./components/panels/ProblemScaffold";
import "./App.css";
import { TRACKS } from "./data/implementedProblems";

const lazyProblem = (folder) =>
  folder ? React.lazy(() => import(`./problems/${folder}/index.jsx`)) : null;

/* ── Auto-discovery ──────────────────────────────────────────────────── */

const metaModules = import.meta.glob("./problems/*/index.jsx", { eager: true });
const lazyModules = import.meta.glob("./problems/*/index.jsx");

const ALL_PROBLEMS = Object.entries(metaModules)
  .map(([path, mod]) => {
    const meta = mod?.meta;
    if (!meta?.number || !meta?.title) return null;
    const loader = lazyModules[path];
    return {
      id: `prob-${meta.slug || meta.number}`,
      number: meta.number,
      title: meta.title,
      slug: meta.slug || meta.title.toLowerCase().replace(/\s+/g, "-"),
      description: meta.description || "",
      difficulty: meta.difficulty || "Medium",
      tags: meta.tags || [],
      accent: meta.accent || "#64748b",
      component: loader ? React.lazy(() => loader()) : null,
      implemented: !!loader,
    };
  })
  .filter(Boolean);

const IMPLEMENTED_BY_NUMBER = new Map(
  ALL_PROBLEMS.map((p) => [p.number, p]),
);

const BASICS_PROBLEMS = ALL_PROBLEMS.filter((p) =>
  (p.tags || []).includes("Basics"),
);

const CODEFORCES_PROBLEMS = ALL_PROBLEMS.filter((p) =>
  (p.tags || []).includes("Codeforces"),
);

function buildCatalogProblems(catalogProblems) {
  return catalogProblems.map((problem) => {
    const implemented = IMPLEMENTED_BY_NUMBER.get(problem.number);
    if (!implemented) {
      return {
        ...problem,
        accent: "#64748b",
        description:
          "Cataloged in explorer. Visualizer shell is ready; implementation can be plugged into reusable panels.",
        component: null,
        implemented: false,
      };
    }
    return { ...problem, ...implemented, implemented: true };
  });
}

/* ── Error Boundary ──────────────────────────────────────────────────── */

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Visualizer error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: 16,
            padding: 32,
            color: "#94a3b8",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32 }}>⚠️</div>
          <h2 style={{ color: "#f87171", margin: 0 }}>Visualizer Error</h2>
          <p style={{ margin: 0, maxWidth: 480, fontSize: 14 }}>
            {this.state.error.message ||
              "An unexpected error occurred in this visualizer."}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "1px solid #334155",
              background: "#1e293b",
              color: "#f8fafc",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Sub-components ──────────────────────────────────────────────────── */

function LayoutControls({ layoutWidth, onChange, compact = false }) {
  return (
    <div className={`layout-controls ${compact ? "compact" : ""}`}>
      <span className="layout-label">Layout</span>
      <div className="layout-pill">
        <button
          className={`layout-btn ${layoutWidth === "normal" ? "active" : ""}`}
          onClick={() => onChange("normal")}
        >
          Normal
        </button>
        <button
          className={`layout-btn ${layoutWidth === "wide" ? "active" : ""}`}
          onClick={() => onChange("wide")}
        >
          Wide
        </button>
        <button
          className={`layout-btn ${layoutWidth === "full" ? "active" : ""}`}
          onClick={() => onChange("full")}
        >
          Full
        </button>
      </div>
    </div>
  );
}

function SettingsMenu({
  navigationTransitionsEnabled,
  onToggleNavigationTransitions,
}) {
  return (
    <details className="settings-menu">
      <summary className="settings-summary" aria-label="Open settings">
        <span className="settings-summary-icon">⚙</span>
        <span>Settings</span>
      </summary>
      <div className="settings-panel">
        <div className="settings-panel-title">Navigation</div>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={navigationTransitionsEnabled}
            onChange={(event) =>
              onToggleNavigationTransitions(event.target.checked)
            }
          />
          <span>
            <strong>Enable transitions</strong>
            <small>Animate page switches and problem card entrances.</small>
          </span>
        </label>
      </div>
    </details>
  );
}

function ProblemPage({
  problem,
  onBack,
  layoutWidth,
  onLayoutChange,
  enableTransitions,
}) {
  const Component = problem.component;
  const Shell = enableTransitions ? motion.div : "div";
  const shellProps = enableTransitions
    ? {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -50 },
      transition: { type: "spring", stiffness: 320, damping: 35 },
    }
    : {};
  return (
    <Shell className="problem-page" {...shellProps}>
      <header className="problem-header">
        <button className="back-btn" onClick={onBack}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Problems
        </button>
        <div className="problem-title-group">
          <span className="problem-num">#{problem.number}</span>
          <h1 className="problem-title">{problem.title}</h1>
        </div>
        <span
          className={`difficulty badge difficulty-${problem.difficulty.toLowerCase()}`}
        >
          {problem.difficulty}
        </span>
        <LayoutControls
          layoutWidth={layoutWidth}
          onChange={onLayoutChange}
          compact
        />
      </header>
      <div className="problem-content">
        <ErrorBoundary key={problem.id}>
          {Component ? (
            <Suspense
              fallback={
                <div style={{ padding: 20, color: "#94a3b8" }}>
                  Loading visualizer…
                </div>
              }
            >
              <Component problem={problem} />
            </Suspense>
          ) : (
            <ProblemScaffold problem={problem} />
          )}
        </ErrorBoundary>
      </div>
    </Shell>
  );
}

function HomePage({
  track,
  onTrackChange,
  onSelect,
  layoutWidth,
  onLayoutChange,
  enableTransitions,
}) {
  const [catalogProblems, setCatalogProblems] = useState([]);
  const [catalogError, setCatalogError] = useState("");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [status, setStatus] = useState("All");
  const [activeTag, setActiveTag] = useState("All");
  const [visibleCount, setVisibleCount] = useState(60);

  const isLeetCodeTrack = track === TRACKS.LEETCODE;
  const isCodeforcesTrack = track === TRACKS.CODEFORCES;

  useEffect(() => {
    if (!isLeetCodeTrack) return;

    let cancelled = false;

    fetch("/data/leetcodeCatalog.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Catalog load failed: ${response.status}`);
        }
        return response.json();
      })
      .then((payload) => {
        if (cancelled) return;
        const nextCatalogProblems = Array.isArray(payload?.problems)
          ? payload.problems
          : [];
        setCatalogProblems(nextCatalogProblems);
        setCatalogError("");
      })
      .catch((error) => {
        if (cancelled) return;
        setCatalogError(error.message || "Failed to load LeetCode catalog");
      });

    return () => {
      cancelled = true;
    };
  }, [isLeetCodeTrack]);

  const allProblems = useMemo(() => {
    if (isLeetCodeTrack) return buildCatalogProblems(catalogProblems);
    if (isCodeforcesTrack) return CODEFORCES_PROBLEMS;
    return BASICS_PROBLEMS;
  }, [catalogProblems, isCodeforcesTrack, isLeetCodeTrack]);

  const allTags = useMemo(() => {
    return Array.from(
      new Set(allProblems.flatMap((problem) => problem.tags || [])),
    ).sort();
  }, [allProblems]);

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = allProblems.filter((problem) => {
    if (difficulty !== "All" && problem.difficulty !== difficulty) return false;
    if (status === "Implemented" && !problem.implemented) return false;
    if (status === "Catalog Only" && problem.implemented) return false;
    if (activeTag !== "All" && !(problem.tags || []).includes(activeTag))
      return false;
    if (!normalizedSearch) return true;

    const haystack =
      `${problem.number} ${problem.title} ${problem.slug} ${(problem.tags || []).join(" ")}`.toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  const visible = filtered.slice(0, visibleCount);
  const Shell = enableTransitions ? motion.div : "div";
  const shellProps = enableTransitions
    ? {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    }
    : {};
  const Brand = enableTransitions ? motion.div : "div";

  return (
    <Shell className="home-page" {...shellProps}>
      <header className="home-header">
        <div className="home-header-row">
          <Brand
            className="brand"
            {...(enableTransitions
              ? {
                initial: { y: -18, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                transition: { delay: 0.08, type: "spring", stiffness: 280 },
              }
              : {})}
          >
            <div className="brand-icon">⟨/⟩</div>
            <div>
              <h1>CP Visualizer</h1>
              <p>
                {isLeetCodeTrack
                  ? "LeetCode and interview patterns"
                  : isCodeforcesTrack
                    ? "Codeforces competitive programming problems"
                    : "Core programming basics and loop patterns"}
              </p>
            </div>
          </Brand>

          <div
            className="track-switcher"
            role="tablist"
            aria-label="Problem tracks"
          >
            <button
              className={`track-btn ${track === TRACKS.LEETCODE ? "active" : ""}`}
              onClick={() => onTrackChange(TRACKS.LEETCODE)}
            >
              LeetCode Track
            </button>
            <button
              className={`track-btn ${track === TRACKS.BASICS ? "active" : ""}`}
              onClick={() => onTrackChange(TRACKS.BASICS)}
            >
              Basics Track
            </button>
            <button
              className={`track-btn ${track === TRACKS.CODEFORCES ? "active" : ""}`}
              onClick={() => onTrackChange(TRACKS.CODEFORCES)}
            >
              Codeforces Track
            </button>
          </div>

          <LayoutControls layoutWidth={layoutWidth} onChange={onLayoutChange} />
        </div>

        <div className="catalog-meta">
          <span>
            {isLeetCodeTrack
              ? `Total catalog: ${allProblems.length}`
              : isCodeforcesTrack
                ? `Codeforces problems: ${allProblems.length}`
                : `Basics topics: ${allProblems.length}`}
          </span>
          <span>
            Implemented:{" "}
            {allProblems.filter((problem) => problem.implemented).length}
          </span>
          <span>Visible: {filtered.length}</span>
          {isLeetCodeTrack && catalogError ? (
            <span>Catalog error: {catalogError}</span>
          ) : null}
        </div>

        <div className="filters-row">
          <input
            className="search-input"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setVisibleCount(60);
            }}
            placeholder="Search by number, title, slug, or tag"
          />

          <select
            className="filter-select"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
          >
            <option>All</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>

          {isLeetCodeTrack ? (
            <select
              className="filter-select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option>All</option>
              <option>Implemented</option>
              <option>Catalog Only</option>
            </select>
          ) : (
            <div className="track-note">
              {isCodeforcesTrack
                ? "Codeforces track focuses on advanced contest strategies and data structures."
                : "Basics track includes foundational loop visualizations."}
            </div>
          )}
        </div>

        <div className="tag-row">
          <button
            className={`tag-filter ${activeTag === "All" ? "active" : ""}`}
            onClick={() => setActiveTag("All")}
          >
            All
          </button>
          {allTags.slice(0, 24).map((tag) => (
            <button
              key={tag}
              className={`tag-filter ${activeTag === tag ? "active" : ""}`}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </header>

      <main className="cards-grid">
        {visible.map((p, i) =>
          enableTransitions ? (
            <motion.button
              key={p.id}
              className="problem-card"
              style={{ "--accent": p.accent }}
              onClick={() => onSelect(p)}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.14 + i * 0.07,
                type: "spring",
                stiffness: 260,
              }}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="card-top">
                <span
                  className={`badge difficulty-${p.difficulty.toLowerCase()}`}
                >
                  {p.difficulty}
                </span>
                <span className="card-num">#{p.number}</span>
              </div>
              <h2 className="card-title">{p.title}</h2>
              <p className="card-desc">{p.description}</p>
              <div className="card-footer">
                <div className="card-tags">
                  {p.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
                <span className="card-arrow">{p.implemented ? "→" : "⋯"}</span>
              </div>
            </motion.button>
          ) : (
            <button
              key={p.id}
              className="problem-card"
              style={{ "--accent": p.accent }}
              onClick={() => onSelect(p)}
            >
              <div className="card-top">
                <span
                  className={`badge difficulty-${p.difficulty.toLowerCase()}`}
                >
                  {p.difficulty}
                </span>
                <span className="card-num">#{p.number}</span>
              </div>
              <h2 className="card-title">{p.title}</h2>
              <p className="card-desc">{p.description}</p>
              <div className="card-footer">
                <div className="card-tags">
                  {p.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
                <span className="card-arrow">{p.implemented ? "→" : "⋯"}</span>
              </div>
            </button>
          ),
        )}
      </main>

      {visibleCount < filtered.length && (
        <div className="load-more-wrap">
          <button
            className="load-more-btn"
            onClick={() => setVisibleCount((count) => count + 60)}
          >
            Load 60 more problems
          </button>
        </div>
      )}
    </Shell>
  );
}

/* ── Root App ────────────────────────────────────────────────────────── */
export default function App() {
  const [active, setActive] = useState(null);
  const [track, setTrack] = useState(TRACKS.LEETCODE);
  const [layoutWidth, setLayoutWidth] = useState("full");
  const [navigationTransitionsEnabled, setNavigationTransitionsEnabled] =
    useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("cpviz.navigationTransitions");
      if (stored !== null) {
        setNavigationTransitionsEnabled(stored !== "0");
      }
    } catch (error) {
      void error;
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "cpviz.navigationTransitions",
        navigationTransitionsEnabled ? "1" : "0",
      );
    } catch (error) {
      void error;
    }
  }, [navigationTransitionsEnabled]);

  useEffect(() => {
    if (active) {
      window.history.pushState({ slug: active.slug }, "", `#${active.slug}`);
    } else {
      window.history.pushState({}, "", window.location.pathname);
    }
  }, [active]);

  useEffect(() => {
    const onPop = () => setActive(null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goBack = () => setActive(null);

  const handleTrackChange = (nextTrack) => {
    setTrack(nextTrack);
    setActive(null);
  };

  const pageContent = active ? (
    <ProblemPage
      key={active.id}
      problem={active}
      onBack={goBack}
      layoutWidth={layoutWidth}
      onLayoutChange={setLayoutWidth}
      enableTransitions={navigationTransitionsEnabled}
    />
  ) : (
    <HomePage
      key={`home-${track}`}
      track={track}
      onTrackChange={handleTrackChange}
      onSelect={setActive}
      layoutWidth={layoutWidth}
      onLayoutChange={setLayoutWidth}
      enableTransitions={navigationTransitionsEnabled}
    />
  );

  return (
    <div className={`app layout-${layoutWidth}`}>
      <div className="app-toolbar">
        <SettingsMenu
          navigationTransitionsEnabled={navigationTransitionsEnabled}
          onToggleNavigationTransitions={setNavigationTransitionsEnabled}
        />
      </div>
      {navigationTransitionsEnabled ? (
        <AnimatePresence mode="wait">{pageContent}</AnimatePresence>
      ) : (
        pageContent
      )}
    </div>
  );
}
