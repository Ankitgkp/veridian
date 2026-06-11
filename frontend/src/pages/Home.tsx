import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { askQuestionStream } from "@/lib/api";
import SearchBox from "@/components/SearchBox";
import { Search, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const supabase = createClient();

const SUGGESTIONS = [
  "What's happening in AI this week?",
  "Explain quantum computing simply",
  "Best practices for TypeScript in 2025",
  "How does the James Webb telescope work?",
];

export default function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [guestCount, setGuestCount] = useState<number>(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const savedCount = parseInt(localStorage.getItem("veridian_guest_prompts") || "0", 10);
    setGuestCount(savedCount);

    return () => listener.subscription.unsubscribe();
  }, []);

  function handleSearch(query: string) {
    setError(null);
    setLoading(true);

    askQuestionStream(query, {
      onMeta: (meta) => {
        if (!user) {
          const newCount = guestCount + 1;
          setGuestCount(newCount);
          localStorage.setItem("veridian_guest_prompts", newCount.toString());
        }
        // Navigate immediately — the conversation page will pick up streaming
        const targetId = meta.conversationId || "guest";
        navigate(`/conversation/${targetId}`, {
          state: { initialQuery: query, streaming: true },
        });
      },
      onSources: () => {},
      onTextDelta: () => {},
      onDone: () => setLoading(false),
      onError: (msg) => {
        setError(msg || "Something went wrong. Are you signed in?");
        setLoading(false);
      },
    });
  }

  const isLimitReached = !user && guestCount >= 2;

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-16 min-h-screen">
      {/* Brand */}
      <div className="flex flex-col items-center gap-3 mb-12 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          veridian
        </h1>
        <p className="text-sm text-muted-foreground">
          AI-powered answers with real-time web search
        </p>
      </div>

      {/* Search box or guest limit card */}
      <div className="w-full max-w-2xl animate-fade-in" style={{ animationDelay: "0.05s" }}>
        {isLimitReached ? (
          <div className="w-full max-w-md mx-auto p-8 rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-md shadow-2xl shadow-primary/5 flex flex-col items-center text-center space-y-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse-subtle" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Unlock Unlimited Searches
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                You've used your 2 free guest searches. Sign in with Google or GitHub to save your search history and unlock unlimited AI queries.
              </p>
            </div>

            <div className="w-full max-w-xs pt-2">
              <button
                onClick={() => navigate("/auth")}
                className="w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/95 transition-all shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Sign In to Continue
              </button>
            </div>
          </div>
        ) : (
          <>
            <SearchBox
              placeholder="Ask anything…"
              onSubmit={handleSearch}
              loading={loading}
              autoFocus
            />

            {error && (
              <p className="mt-3 text-sm text-destructive text-center animate-fade-in">{error}</p>
            )}
          </>
        )}
      </div>

      {/* Suggestion pills */}
      {!isLimitReached && (
        <div
          className="flex flex-wrap justify-center gap-2 mt-8 max-w-2xl animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => !loading && handleSearch(s)}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-accent transition-all cursor-pointer disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5 text-primary/70 shrink-0" />
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Feature cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-14 max-w-2xl w-full animate-fade-in"
        style={{ animationDelay: "0.15s" }}
      >
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Search anything</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Get fast and accurate answers from the most trusted sources on the web.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-foreground">AI-synthesized answers</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Claude reads the web so you don't have to — with follow-up questions to go deeper.
          </p>
        </div>
      </div>
    </div>
  );
}
