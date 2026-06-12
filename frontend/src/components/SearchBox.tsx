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
  placeholder = "Ask anything...",
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
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }

  const hasValue = value.trim().length > 0;

  return (
    <div
      className={`relative flex flex-col rounded-xl border border-border bg-card transition-colors focus-within:border-[#3a3c3c] ${className}`}
    >
      <div className="px-4 pt-3.5 pb-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={1}
          className="w-full resize-none bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground outline-none leading-relaxed"
          style={{ maxHeight: "180px" }}
        />
      </div>

      <div className="flex items-center justify-between px-3 pb-2.5">
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer">
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!hasValue || loading}
          className={`flex h-7 w-7 items-center justify-center rounded-full transition-all cursor-pointer ${
            hasValue
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          } disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ArrowUp className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
