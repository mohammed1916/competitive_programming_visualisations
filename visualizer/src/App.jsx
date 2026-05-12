import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { TRACKS } from "./data/implementedProblems";
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

  // Keep browser history in sync so the browser back button works
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
