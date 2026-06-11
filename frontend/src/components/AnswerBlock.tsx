import { ExternalLink, CornerDownRight } from "lucide-react";
import { parseResponse } from "@/lib/parseResponse";

interface AnswerBlockProps {
  userQuery: string;
  rawAnswer: string;
  onFollowUp?: (question: string) => void;
  isLatest?: boolean;
  isStreaming?: boolean;
}

/** Very minimal markdown-ish renderer (bold, inline code, line breaks) */
function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-primary">{part.slice(1, -1)}</code>;
    }
    return <span key={i}>{part}</span>;
  });
}

function renderAnswer(answer: string) {
  const paragraphs = answer.split(/\n{2,}/);
  return paragraphs.map((para, i) => {
    const lines = para.split("\n");
    return (
      <p key={i} className="text-[15px] leading-7 text-foreground/90 mb-3 last:mb-0">
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
  onFollowUp,
  isLatest = false,
  isStreaming = false,
}: AnswerBlockProps) {
  const { answer, followUps, sources } = parseResponse(rawAnswer);
  const displayText = answer || rawAnswer;

  return (
    <div className="animate-fade-in space-y-6">
      {/* User bubble */}
      <div className="flex justify-end">
        <div className="max-w-[70%] bg-secondary rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-foreground">
          {userQuery}
        </div>
      </div>

      {/* Answer */}
      <div className="space-y-4">
        {/* Sources chips */}
        {sources.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sources.slice(0, 6).map((src) => (
              <a
                key={src.index}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors truncate max-w-[180px]"
              >
                <span className="w-3.5 h-3.5 shrink-0 rounded-sm bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                  {src.index}
                </span>
                <span className="truncate">{src.title}</span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
              </a>
            ))}
          </div>
        )}

        {/* Answer text */}
        <div className="prose-custom">
          {displayText ? renderAnswer(displayText) : (
            isStreaming && (
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <span className="animate-pulse-subtle">Searching the web…</span>
              </div>
            )
          )}
          {isStreaming && displayText && (
            <span className="inline-block w-1.5 h-4 bg-primary rounded-sm animate-pulse ml-0.5 align-middle" />
          )}
        </div>

        {/* Follow-ups — only show on the latest exchange, never while streaming */}
        {isLatest && !isStreaming && followUps.length > 0 && onFollowUp && (
          <div className="pt-2 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Follow-ups
            </p>
            <div className="space-y-2">
              {followUps.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onFollowUp(q)}
                  className="w-full flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border border-border bg-card text-sm text-left text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-accent transition-all cursor-pointer"
                >
                  <CornerDownRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary/70" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sources list */}
        {sources.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-1.5 mt-1">
              <ExternalLink className="w-3 h-3" />
              {sources.length} source{sources.length !== 1 ? "s" : ""}
            </summary>
            <div className="mt-3 space-y-2 pl-1">
              {sources.map((src) => (
                <a
                  key={src.index}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group/link"
                >
                  <span className="shrink-0 text-muted-foreground/60">{src.index}.</span>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground/80 group-hover/link:text-primary transition-colors truncate">
                      {src.title}
                    </p>
                    <p className="truncate text-muted-foreground/70">{src.url}</p>
                  </div>
                </a>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
