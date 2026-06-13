import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    const trimmed = query.trim();
    if (!trimmed) return;
    setError(null);

    const targetId = user ? "new" : "guest";
    if (!user) {
      const newCount = guestCount + 1;
      setGuestCount(newCount);
      localStorage.setItem("veridian_guest_prompts", newCount.toString());
    }

    navigate(`/conversation/${targetId}`, {
      state: { initialQuery: trimmed, streaming: true },
    });
  }

  const isLimitReached = !user && guestCount >= 2;

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 min-h-screen">
      <h1
        className="text-[42px] font-light tracking-tight text-foreground/70 mb-10 animate-fade-in"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        veridian
      </h1>

      <div className="w-full max-w-[580px] animate-fade-in" style={{ animationDelay: "0.05s" }}>
        {isLimitReached ? (
          <div className="w-full max-w-sm mx-auto p-7 rounded-xl bg-card text-center space-y-5">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5 text-primary animate-pulse-subtle" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-foreground">
                Unlock Unlimited Searches
              </h2>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                You've used your 2 free guest searches. Sign in to continue.
              </p>
            </div>
            <button
              onClick={() => navigate("/auth")}
              className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-[13px] hover:opacity-90 transition-opacity cursor-pointer"
            >
              Sign In to Continue
            </button>
          </div>
        ) : (
          <>
            <SearchBox
              placeholder="Ask anything..."
              onSubmit={handleSearch}
              loading={loading}
              autoFocus
            />

            {error && (
              <p className="mt-3 text-[13px] text-destructive text-center animate-fade-in">{error}</p>
            )}
          </>
        )}
      </div>

      {!isLimitReached && (
        <div
          className="flex flex-wrap justify-center gap-3 mt-6 max-w-[580px] w-full animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <button
            onClick={() => !loading && handleSearch(SUGGESTIONS[0]!)}
            disabled={loading}
            className="flex-1 min-w-[240px] rounded-xl p-4 text-left cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #1a4a47 0%, #1c3533 100%)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Search className="w-3.5 h-3.5 text-primary" />
              <span className="text-[13px] font-medium text-foreground">Search anything</span>
            </div>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Get fast and accurate answers from the most trusted sources.
            </p>
          </button>

          <button
            onClick={() => !loading && handleSearch(SUGGESTIONS[1]!)}
            disabled={loading}
            className="flex-1 min-w-[240px] rounded-xl bg-card p-4 text-left cursor-pointer hover:bg-[#252727] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[13px] font-medium text-foreground">AI-powered answers</span>
            </div>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Get synthesized, cited answers — no tab-switching needed.
            </p>
          </button>
        </div>
      )}
    </div>
  );
}
