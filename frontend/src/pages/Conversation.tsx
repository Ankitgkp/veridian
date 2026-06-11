import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  fetchConversation,
  askQuestionStream,
  askFollowUpStream,
  type Conversation,
  type Source,
} from "@/lib/api";
import AnswerBlock from "@/components/AnswerBlock";
import SearchBox from "@/components/SearchBox";
import { Loader2, Sparkles } from "lucide-react";

interface Exchange {
  query: string;
  answer: string;
  sources?: Source[];
  streaming?: boolean;
}

interface LocationState {
  initialAnswer?: string;
  initialQuery?: string;
  streaming?: boolean;
}

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // Track whether we've already kicked off the initial stream from Home
  const streamingFromHome = useRef(false);

  // --- initial load ---
  useEffect(() => {
    if (!conversationId || hasInitialized.current) return;
    hasInitialized.current = true;

    if (conversationId === "guest") {
      if (state?.streaming && state?.initialQuery) {
        streamingFromHome.current = true;
        startNewStream(state.initialQuery);
      } else {
        setError("Guest sessions are temporary and cannot be saved or loaded. Please start a new search.");
      }
      return;
    }

    // Case 1: Navigated from Home with a pending stream
    if (state?.streaming && state?.initialQuery) {
      streamingFromHome.current = true;
      startNewStream(state.initialQuery);
      return;
    }

    // Case 2: Pre-computed answer from navigation state (legacy / non-streaming)
    if (state?.initialAnswer && state?.initialQuery) {
      setExchanges([{ query: state.initialQuery, answer: state.initialAnswer }]);
      return;
    }

    // Case 3: Cold load — hydrate from backend
    setHydrating(true);
    fetchConversation(conversationId)
      .then((conv: Conversation) => {
        const msgs = conv.messages;
        const rebuilt: Exchange[] = [];
        for (let i = 0; i < msgs.length - 1; i += 2) {
          const user = msgs[i];
          const assistant = msgs[i + 1];
          if (user?.role === "User" && assistant?.role === "Assistant") {
            rebuilt.push({ query: user.content, answer: assistant.content });
          }
        }
        setExchanges(rebuilt);
      })
      .catch(() => setError("Failed to load conversation."))
      .finally(() => setHydrating(false));
  }, [conversationId]);

  // Auto-scroll on content change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [exchanges, loading]);

  // --- Stream a brand-new question (first ask) ---
  function startNewStream(query: string) {
    setError(null);
    setLoading(true);

    // Add a placeholder exchange that will be filled progressively
    setExchanges((prev) => [...prev, { query, answer: "", streaming: true }]);

    askQuestionStream(query, {
      onMeta: () => {
        // Already navigated — conversationId is in the URL
      },
      onSources: (sources) => {
        setExchanges((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) updated[updated.length - 1] = { ...last, sources };
          return updated;
        });
      },
      onTextDelta: (delta) => {
        setExchanges((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) updated[updated.length - 1] = { ...last, answer: last.answer + delta };
          return updated;
        });
      },
      onDone: () => {
        setExchanges((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) updated[updated.length - 1] = { ...last, streaming: false };
          return updated;
        });
        setLoading(false);
      },
      onError: (msg) => {
        setError(msg);
        setLoading(false);
      },
    });
  }

  // --- Stream a follow-up ---
  const handleFollowUp = useCallback(
    (query: string) => {
      if (!conversationId || loading) return;
      setError(null);
      setLoading(true);

      // Add placeholder
      setExchanges((prev) => [...prev, { query, answer: "", streaming: true }]);

      askFollowUpStream(query, conversationId, {
        onMeta: () => {},
        onSources: (sources) => {
          setExchanges((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last) updated[updated.length - 1] = { ...last, sources };
            return updated;
          });
        },
        onTextDelta: (delta) => {
          setExchanges((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last) updated[updated.length - 1] = { ...last, answer: last.answer + delta };
            return updated;
          });
        },
        onDone: () => {
          setExchanges((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last) updated[updated.length - 1] = { ...last, streaming: false };
            return updated;
          });
          setLoading(false);
        },
        onError: (msg) => {
          setError(msg);
          setLoading(false);
        },
      });
    },
    [conversationId, loading]
  );

  if (hydrating) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading conversation…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-10 space-y-12">
          {exchanges.length === 0 && !hydrating && (
            <p className="text-center text-muted-foreground text-sm">
              No messages yet.
            </p>
          )}

          {exchanges.map((ex, i) => (
            <AnswerBlock
              key={i}
              userQuery={ex.query}
              rawAnswer={ex.answer}
              isLatest={i === exchanges.length - 1 && !ex.streaming}
              onFollowUp={handleFollowUp}
              isStreaming={ex.streaming}
            />
          ))}

          {error && (
            <p className="text-center text-sm text-destructive animate-fade-in">{error}</p>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Sticky follow-up input */}
      <div className="sticky bottom-0 border-t border-border bg-background/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-2xl mx-auto">
          {conversationId === "guest" ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5 shadow-lg shadow-primary/5 animate-fade-in">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5 justify-center sm:justify-start">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Want to ask follow-up questions?
                </h4>
                <p className="text-xs text-muted-foreground">
                  Sign in to keep the conversation going and save your search history.
                </p>
              </div>
              <button
                onClick={() => navigate("/auth")}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/95 transition-all shadow-md shadow-primary/25 whitespace-nowrap cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                Sign In to Continue
              </button>
            </div>
          ) : (
            <SearchBox
              placeholder="Ask a follow-up…"
              onSubmit={handleFollowUp}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
