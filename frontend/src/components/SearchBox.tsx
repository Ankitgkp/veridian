import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp, Loader2, Search } from "lucide-react";

interface SearchBoxProps {
  placeholder?: string;
  onSubmit: (query: string) => void;
  loading?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export default function SearchBox({
  placeholder = "Ask anything…",
  onSubmit,
  loading = false,
  autoFocus = false,
  className = "",
}: SearchBoxProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }

  return (
    <div
      className={`relative flex flex-col gap-2 rounded-2xl border border-border bg-card px-4 pt-4 pb-3 shadow-lg transition-shadow focus-within:border-primary/40 focus-within:shadow-primary/10 focus-within:shadow-xl ${className}`}
    >
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={1}
        className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none leading-relaxed"
        style={{ maxHeight: "200px" }}
      />

      {/* Bottom bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!value.trim() || loading}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition-all hover:scale-105 hover:shadow-primary/30 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowUp className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
