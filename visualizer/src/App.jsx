import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { TRACKS, IMPLEMENTED_PROBLEMS } from "./data/implementedProblems";
import ProblemPage from "./components/ProblemPage";
import HomePage from "./components/HomePage";
import { ChatDrawer } from "./components/Chatbot";
import { ChatProvider, useChatContext } from "./context/ChatContext";
import { VisualizationProvider } from "./context/VisualizationContext";
import "./App.css";
import "./components/Chatbot/chatbot.css";

function ChatFab() {
  const { toggleChat, isOpen } = useChatContext();
  return (
    <button
      className="chat-fab"
      onClick={toggleChat}
      title={isOpen ? "Close chat" : "Open Gemma chat"}
      aria-label="Toggle AI chat"
    >
      {isOpen ? "✕" : "💬"}
    </button>
  );
}

/* ── Root App ──────────────────────────────────────────────────────────── */
export default function App() {
  const [active, setActive] = useState(null);
  const [track, setTrack] = useState(TRACKS.LEETCODE);
  const [layoutWidth, setLayoutWidth] = useState("full");
  const [problemDescriptions, setProblemDescriptions] = useState(null);

  // Load problem descriptions (fetched by scripts/fetch-problem-descriptions.mjs)
  useEffect(() => {
    fetch("/data/problemDescriptions.json")
      .then((r) => r.ok ? r.json() : {})
      .then((data) => setProblemDescriptions(data))
      .catch(() => setProblemDescriptions({}));
  }, []);

  // Keep browser history in sync so the browser back button works
  useEffect(() => {
    if (active) {
      window.history.pushState({ slug: active.slug }, "", `#${active.slug}`);
    } else {
      window.history.pushState({}, "", window.location.pathname);
    }
  }, [active]);

  // On initial load, check for a hash and open that problem if implemented
  useEffect(() => {
    const raw = window.location.hash || "";
    const slug = raw.replace(/^#\/?/, "");
    if (slug) {
      const found = IMPLEMENTED_PROBLEMS.find(
        (p) => p.slug === slug || p.id === slug || p.slug === slug.replace(/\//g, "-")
      );
      if (found) setActive(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <VisualizationProvider>
      <ChatProvider>
        <div className={`app layout-${layoutWidth}`}>
          <AnimatePresence mode="wait">
            {active ? (
              <ProblemPage
                key={active.id}
                problem={active}
                onBack={goBack}
                layoutWidth={layoutWidth}
                onLayoutChange={setLayoutWidth}
                problemDescriptions={problemDescriptions}
              />
            ) : (
              <HomePage
                key={`home-${track}`}
                track={track}
                onTrackChange={handleTrackChange}
                onSelect={setActive}
                layoutWidth={layoutWidth}
                onLayoutChange={setLayoutWidth}
              />
            )}
          </AnimatePresence>
          <ChatFab />
          <ChatDrawer />
        </div>
      </ChatProvider>
    </VisualizationProvider>
  );
}
