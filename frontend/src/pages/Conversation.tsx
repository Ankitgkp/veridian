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

  const currentSessionRef = useRef(0);
  const getNewSession = useCallback(() => {
    currentSessionRef.current += 1;
    return currentSessionRef.current;
  }, []);

  useEffect(() => {
    const session = getNewSession();

    setExchanges([]);
    setError(null);
    setLoading(false);

    if (!conversationId) return;

    if (conversationId === "guest") {
      if (state?.streaming && state?.initialQuery) {
        startNewStream(state.initialQuery, session);
      } else {
        setError("Guest sessions are temporary and cannot be saved or loaded. Please start a new search.");
      }
      return;
    }

    if (state?.streaming && state?.initialQuery) {
      startNewStream(state.initialQuery, session);
      return;
    }

    if (state?.initialAnswer && state?.initialQuery) {
      setExchanges([{ query: state.initialQuery, answer: state.initialAnswer }]);
      return;
    }

    setHydrating(true);
    fetchConversation(conversationId)
      .then((conv: Conversation) => {
        if (currentSessionRef.current !== session) return;
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
      .catch(() => {
        if (currentSessionRef.current !== session) return;
        setError("Failed to load conversation.");
      })
      .finally(() => {
        if (currentSessionRef.current !== session) return;
        setHydrating(false);
      });
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [exchanges, loading]);

  function startNewStream(query: string, existingSession?: number) {
    const session = existingSession ?? getNewSession();
    setError(null);
    setLoading(true);
    setExchanges((prev) => {
      if (currentSessionRef.current !== session) return prev;
      return [...prev, { query, answer: "", streaming: true }];
    });

    askQuestionStream(query, {
      onMeta: () => {},
      onSources: (sources) => {
        if (currentSessionRef.current !== session) return;
        setExchanges((prev) => {
          if (currentSessionRef.current !== session) return prev;
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) updated[updated.length - 1] = { ...last, sources };
          return updated;
        });
      },
      onTextDelta: (delta) => {
        if (currentSessionRef.current !== session) return;
        setExchanges((prev) => {
          if (currentSessionRef.current !== session) return prev;
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) updated[updated.length - 1] = { ...last, answer: last.answer + delta };
          return updated;
        });
      },
      onDone: () => {
        if (currentSessionRef.current !== session) return;
        setExchanges((prev) => {
          if (currentSessionRef.current !== session) return prev;
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) updated[updated.length - 1] = { ...last, streaming: false };
          return updated;
        });
        setLoading(false);
      },
      onError: (msg) => {
        if (currentSessionRef.current !== session) return;
        setError(msg);
        setLoading(false);
      },
    });
  }

  const handleFollowUp = useCallback(
    (query: string) => {
      if (!conversationId || loading) return;
      const session = getNewSession();
      setError(null);
      setLoading(true);
      setExchanges((prev) => {
        if (currentSessionRef.current !== session) return prev;
        return [...prev, { query, answer: "", streaming: true }];
      });

      askFollowUpStream(query, conversationId, {
        onMeta: () => {},
        onSources: (sources) => {
          if (currentSessionRef.current !== session) return;
          setExchanges((prev) => {
            if (currentSessionRef.current !== session) return prev;
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last) updated[updated.length - 1] = { ...last, sources };
            return updated;
          });
        },
        onTextDelta: (delta) => {
          if (currentSessionRef.current !== session) return;
          setExchanges((prev) => {
            if (currentSessionRef.current !== session) return prev;
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last) updated[updated.length - 1] = { ...last, answer: last.answer + delta };
            return updated;
          });
        },
        onDone: () => {
          if (currentSessionRef.current !== session) return;
          setExchanges((prev) => {
            if (currentSessionRef.current !== session) return prev;
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last) updated[updated.length - 1] = { ...last, streaming: false };
            return updated;
          });
          setLoading(false);
        },
        onError: (msg) => {
          if (currentSessionRef.current !== session) return;
          setError(msg);
          setLoading(false);
        },
      });
    },
    [conversationId, loading, getNewSession]
  );

  if (hydrating) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-[13px]">Loading conversation…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[640px] mx-auto px-6 py-8">
          {exchanges.length === 0 && !hydrating && (
            <p className="text-center text-muted-foreground text-[13px] py-16">
              No messages yet.
            </p>
          )}

          {exchanges.map((ex, i) => (
            <div key={i}>
              {i > 0 && <div className="my-8 h-px bg-border" />}
              <AnswerBlock
                userQuery={ex.query}
                rawAnswer={ex.answer}
                sources={ex.sources}
                isLatest={i === exchanges.length - 1 && !ex.streaming}
                onFollowUp={handleFollowUp}
                isStreaming={ex.streaming}
              />
            </div>
          ))}

          {error && (
            <p className="text-center text-[13px] text-destructive mt-4 animate-fade-in">{error}</p>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border bg-background px-6 py-3">
        <div className="max-w-[640px] mx-auto">
          {conversationId === "guest" ? (
            <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-card animate-fade-in">
              <div className="space-y-0.5">
                <h4 className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Want to ask follow-up questions?
                </h4>
                <p className="text-[12px] text-muted-foreground">
                  Sign in to keep the conversation going.
                </p>
              </div>
              <button
                onClick={() => navigate("/auth")}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-[12px] hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
              >
                Sign In
              </button>
            </div>
          ) : (
            <SearchBox
              placeholder="Ask a follow-up..."
              onSubmit={handleFollowUp}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
