import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createClient } from "@/lib/supabase/client";
import { fetchConversations, type Conversation } from "@/lib/api";
import type { User } from "@supabase/supabase-js";
import {
  Plus,
  MessageSquare,
  History,
  LogIn,
  LogOut,
  ChevronRight,
  Loader2,
  Sparkles,
} from "lucide-react";

const supabase = createClient();

interface SidebarProps {
  refresh?: number; // bump this to force conversation list reload
}

export default function Sidebar({ refresh = 0 }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setConversations([]); return; }
    setLoadingConvs(true);
    fetchConversations()
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setLoadingConvs(false));
  }, [user, refresh]);

  const activeId = location.pathname.startsWith("/conversation/")
    ? location.pathname.split("/conversation/")[1]
    : null;

  return (
    <aside className="flex flex-col h-screen w-[220px] shrink-0 border-r border-border bg-sidebar text-sidebar-foreground select-none">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-foreground font-semibold tracking-tight text-base">veridian</span>
      </div>

      {/* New search button */}
      <div className="px-3 mb-2">
        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-primary" />
          New Search
        </button>
      </div>

      {/* Nav items */}
      <nav className="px-3 space-y-0.5 mb-4">
        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
        >
          <History className="w-4 h-4" />
          History
        </button>
      </nav>

      <div className="px-4 mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Recents
        </p>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {!user && (
          <p className="px-3 text-xs text-muted-foreground">Sign in to see history</p>
        )}
        {user && loadingConvs && (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading…
          </div>
        )}
        {user && !loadingConvs && conversations.length === 0 && (
          <p className="px-3 text-xs text-muted-foreground">No recent sessions</p>
        )}
        {conversations.map((conv) => {
          const isActive = activeId === conv.id || activeId === conv.slug;
          return (
            <button
              key={conv.id}
              onClick={() => navigate(`/conversation/${conv.id}`)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer text-left truncate ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
              <span className="truncate text-xs">{conv.title ?? "Untitled"}</span>
            </button>
          );
        })}
      </div>

      {/* User / sign-in */}
      <div className="border-t border-border p-3">
        {user ? (
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 text-[10px] font-bold text-primary-foreground">
                {user.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <LogOut className="w-3.5 h-3.5 shrink-0 opacity-60" />
          </button>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </button>
        )}
      </div>
    </aside>
  );
}
