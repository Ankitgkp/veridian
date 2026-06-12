import { ExternalLink, CornerDownRight, Globe } from "lucide-react";
import { parseResponse } from "@/lib/parseResponse";
import type { Source } from "@/lib/api";

interface AnswerBlockProps {
  userQuery: string;
  rawAnswer: string;
  sources?: Source[];
  onFollowUp?: (question: string) => void;
  isLatest?: boolean;
  isStreaming?: boolean;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?sz=16&domain=${domain}`;
  } catch {
    return "";
  }
}

function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="bg-muted px-1 py-0.5 rounded text-[13px] font-mono text-foreground/90">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function renderAnswer(answer: string) {
  const paragraphs = answer.split(/\n{2,}/);
  return paragraphs.map((para, i) => {
    const lines = para.split("\n");
    return (
      <p key={i} className="text-[15px] leading-7 text-foreground/85 mb-3.5 last:mb-0">
        {lines.map((line, j) => (
          <span key={j}>
            {renderText(line)}
            {j < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
  });
}

export default function AnswerBlock({
  userQuery,
  rawAnswer,
  sources: sseSources,
  onFollowUp,
  isLatest = false,
  isStreaming = false,
}: AnswerBlockProps) {
  const parsed = parseResponse(rawAnswer);
  const displayText = parsed.answer || rawAnswer;
  const followUps = parsed.followUps;
  const sources = sseSources && sseSources.length > 0 ? sseSources : parsed.sources;

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground leading-snug">{userQuery}</h2>
      </div>

      {sources.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {sources.slice(0, 5).map((src) => {
            const favicon = getFaviconUrl(src.url);
            const domain = getDomain(src.url);
            return (
              <a
                key={src.index}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-lg bg-muted text-[11px] text-muted-foreground hover:text-foreground hover:bg-[#2a2c2c] transition-colors"
              >
                {favicon ? (
                  <img src={favicon} alt="" className="w-3.5 h-3.5 rounded-sm" />
                ) : (
                  <Globe className="w-3 h-3 opacity-50" />
                )}
                <span className="max-w-[120px] truncate">{src.title || domain}</span>
                <span className="text-muted-foreground/40 font-mono text-[10px]">{src.index}</span>
              </a>
            );
          })}
          {sources.length > 5 && (
            <span className="flex items-center px-2.5 py-1.5 rounded-lg bg-muted text-[11px] text-muted-foreground shrink-0">
              +{sources.length - 5}
            </span>
          )}
        </div>
      )}

      <div className="prose-answer">
        {displayText ? renderAnswer(displayText) : (
          isStreaming && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-1">
              <div className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-primary/50 animate-pulse" style={{ animationDelay: "0ms" }} />
                <span className="w-1 h-1 rounded-full bg-primary/50 animate-pulse" style={{ animationDelay: "150ms" }} />
                <span className="w-1 h-1 rounded-full bg-primary/50 animate-pulse" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[13px]">Searching…</span>
            </div>
          )
        )}
        {isStreaming && displayText && (
          <span className="inline-block w-[2px] h-4 bg-primary rounded-full animate-blink ml-0.5 align-middle" />
        )}
      </div>

      {isLatest && !isStreaming && followUps.length > 0 && onFollowUp && (
        <div className="mt-6 space-y-1.5">
          {followUps.map((q, i) => (
            <button
              key={i}
              onClick={() => onFollowUp(q)}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-left text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <CornerDownRight className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-40" />
              <span className="leading-relaxed">{q}</span>
            </button>
          ))}
        </div>
      )}

      {sources.length > 0 && (
        <details className="mt-5 group">
          <summary className="cursor-pointer text-[12px] text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-1.5 py-1">
            <ExternalLink className="w-3 h-3" />
            {sources.length} source{sources.length !== 1 ? "s" : ""}
          </summary>
          <div className="mt-2.5 space-y-1 animate-fade-in">
            {sources.map((src) => {
              const favicon = getFaviconUrl(src.url);
              const domain = getDomain(src.url);
              return (
                <a
                  key={src.index}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <span className="text-muted-foreground/40 tabular-nums w-3 text-right text-[11px]">
                    {src.index}
                  </span>
                  {favicon ? (
                    <img src={favicon} alt="" className="w-3.5 h-3.5 rounded-sm" />
                  ) : (
                    <Globe className="w-3.5 h-3.5 opacity-30" />
                  )}
                  <span className="truncate font-medium text-foreground/70">{src.title}</span>
                  <span className="truncate text-muted-foreground/40 ml-auto">{domain}</span>
                </a>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
