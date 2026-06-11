/**
 * Parses the Veridian backend response format:
 *   <ANSWER>...</ANSWER>
 *   <FOLLOW_UPS><question>...</question>...</FOLLOW_UPS>
 *   ------------SOURCES-------------
 *   1. Title\nURL
 *   ...
 */
export interface ParsedResponse {
  answer: string;
  followUps: string[];
  sources: Array<{ index: number; title: string; url: string }>;
}

export function parseResponse(raw: string): ParsedResponse {
  // Extract <ANSWER>
  const answerMatch = raw.match(/<ANSWER>([\s\S]*?)<\/ANSWER>/i);
  const answer = answerMatch ? answerMatch[1].trim() : "";

  // Extract <FOLLOW_UPS>
  const followUps: string[] = [];
  const followUpsMatch = raw.match(/<FOLLOW_UPS>([\s\S]*?)<\/FOLLOW_UPS>/i);
  if (followUpsMatch) {
    const questionRegex = /<question>([\s\S]*?)<\/question>/gi;
    let m;
    while ((m = questionRegex.exec(followUpsMatch[1])) !== null) {
      const q = m[1].trim();
      if (q) followUps.push(q);
    }
  }

  // Extract SOURCES block (after "------------SOURCES-------------")
  const sources: ParsedResponse["sources"] = [];
  const sourcesSplit = raw.split("------------SOURCES-------------");
  if (sourcesSplit.length > 1) {
    const sourcesBlock = sourcesSplit[1].trim();
    const sourceLines = sourcesBlock.split("\n\n");
    for (const block of sourceLines) {
      const lines = block.trim().split("\n");
      if (lines.length >= 2) {
        const titleLine = lines[0].trim();
        const url = lines[1].trim();
        // Strip leading "1. " numbering
        const titleMatch = titleLine.match(/^(\d+)\.\s+(.+)$/);
        if (titleMatch) {
          sources.push({
            index: parseInt(titleMatch[1], 10),
            title: titleMatch[2],
            url,
          });
        }
      }
    }
  }

  return { answer, followUps, sources };
}
