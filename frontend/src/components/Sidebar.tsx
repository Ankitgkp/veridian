import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createClient } from "@/lib/supabase/client";
import { fetchConversations, deleteConversation, type Conversation } from "@/lib/api";
import type { User } from "@supabase/supabase-js";
import {
  Plus,
  MessageSquare,
  History,
  LogIn,
  LogOut,
  Loader2,
  Sparkles,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Trash2,
  Settings,
} from "lucide-react";

const supabase = createClient();

interface SidebarProps {
  refresh?: number;
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ refresh = 0, collapsed = false, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const activeId = location.pathname.startsWith("/conversation/")
    ? location.pathname.split("/conversation/")[1]
    : null;

  useEffect(() => {
    if (!user) { setConversations([]); return; }
    setLoadingConvs(true);
    fetchConversations()
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setLoadingConvs(false));
  }, [user, refresh, activeId]);

  async function handleDelete(e: React.MouseEvent, convId: string) {
    e.stopPropagation();
    setDeletingId(convId);
    try {
      await deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeId === convId) {
        navigate("/");
      }
    } catch {
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <aside
      className={`flex flex-col h-screen shrink-0 bg-sidebar select-none transition-all duration-200 ease-in-out ${
        collapsed ? "w-[52px]" : "w-[200px]"
      }`}
    >
      <div className={`flex items-center pt-5 pb-4 ${collapsed ? "justify-center px-0" : "justify-between px-4"}`}>
        <div className="flex items-center gap-2">
          {!collapsed && <span className="text-[14px] font-semibold tracking-tight text-foreground">veridian</span>}
        </div>
        {!collapsed && onToggle && (
          <button
            onClick={onToggle}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {collapsed && onToggle && (
        <div className="flex justify-center mb-1">
          <button
            onClick={onToggle}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
            title="Expand sidebar"
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className={collapsed ? "px-1.5" : "px-3"}>
        <button
          onClick={() => navigate("/")}
          className={`w-full flex items-center gap-2 rounded-lg text-[13px] font-medium text-foreground hover:bg-sidebar-accent transition-colors cursor-pointer ${
            collapsed ? "justify-center px-0 py-2" : "px-2.5 py-[7px]"
          }`}
          title="New Search"
        >
          <Plus className="w-4 h-4 text-primary shrink-0" />
          {!collapsed && <span>New</span>}
        </button>
      </div>

      <nav className={`mt-1 space-y-0.5 ${collapsed ? "px-1.5" : "px-3"}`}>
        <button
          onClick={() => navigate("/")}
          className={`w-full flex items-center gap-2 rounded-lg text-[13px] text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer ${
            collapsed ? "justify-center px-0 py-2" : "px-2.5 py-[7px]"
          }`}
          title="History"
        >
          <History className="w-4 h-4 shrink-0" />
          {!collapsed && <span>History</span>}
        </button>
      </nav>

      <div className={`my-3 h-px bg-sidebar-border ${collapsed ? "mx-2" : "mx-3"}`} />

      <div className={`flex-1 overflow-y-auto space-y-px ${collapsed ? "px-1.5" : "px-3"}`}>
        {!user && !collapsed && (
          <p className="px-2.5 py-1.5 text-[11px] text-muted-foreground">No recent sessions</p>
        )}
        {user && loadingConvs && (
          <div className={`flex items-center gap-1.5 py-1.5 text-[11px] text-muted-foreground ${collapsed ? "justify-center" : "px-2.5"}`}>
            <Loader2 className="w-3 h-3 animate-spin" />
            {!collapsed && <span>Loading…</span>}
          </div>
        )}
        {user && !loadingConvs && conversations.length === 0 && !collapsed && (
          <p className="px-2.5 py-1.5 text-[11px] text-muted-foreground">No recent sessions</p>
        )}
        {conversations.map((conv) => {
          const isActive = activeId === conv.id || activeId === conv.slug;
          const isDeleting = deletingId === conv.id;
          return (
            <div
              key={conv.id}
              className={`group relative flex items-center rounded-lg transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <button
                onClick={() => navigate(`/conversation/${conv.id}`)}
                title={conv.title ?? "Untitled"}
                className={`flex-1 flex items-center gap-2 text-[13px] cursor-pointer text-left truncate min-w-0 ${
                  collapsed ? "justify-center px-0 py-2" : "px-2.5 py-[7px]"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
                {!collapsed && <span className="truncate">{conv.title ?? "Untitled"}</span>}
              </button>
              {!collapsed && (
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  disabled={isDeleting}
                  className="opacity-0 group-hover:opacity-100 p-1 mr-1.5 rounded text-muted-foreground hover:text-destructive transition-all cursor-pointer shrink-0"
                  title="Delete conversation"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className={`mt-auto relative ${collapsed ? "p-1.5" : "p-3"}`}>
        {user && menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div
              className={`absolute p-3 bg-card border border-border rounded-xl shadow-xl animate-fade-in z-50 ${
                collapsed
                  ? "bottom-0 left-full ml-2 w-48"
                  : "bottom-full left-3 right-3 mb-2"
              }`}
            >
              <div className="text-[12px] text-muted-foreground break-all mb-2 px-1 font-medium">
                {user.email}
              </div>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  setMenuOpen(false);
                  navigate("/");
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] text-destructive hover:bg-destructive/15 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </>
        )}

        {user ? (
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className={`w-full flex items-center justify-between rounded-lg text-[13px] text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer ${
              collapsed ? "justify-center px-0 py-2" : "px-2.5 py-[7px]"
            } ${menuOpen ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}`}
            title="Account settings"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-[9px] font-semibold text-primary">
                {user.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              {!collapsed && <span className="truncate text-[12px] font-medium">Settings</span>}
            </div>
            {!collapsed && <Settings className="w-3.5 h-3.5 shrink-0 opacity-60" />}
          </button>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            title="Sign In"
            className={`w-full flex items-center justify-between rounded-lg text-[13px] text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer ${
              collapsed ? "justify-center px-0 py-2" : "px-2.5 py-[7px]"
            }`}
          >
            <div className="flex items-center gap-2">
              <LogIn className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Sign In</span>}
            </div>
            {!collapsed && <ChevronRight className="w-3 h-3 opacity-40" />}
          </button>
        )}
      </div>
    </aside>
  );
}
