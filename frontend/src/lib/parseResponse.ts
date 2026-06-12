export interface ParsedResponse {
  answer: string;
  followUps: string[];
  sources: Array<{ index: number; title: string; url: string }>;
}

export function parseResponse(raw: string): ParsedResponse {
  const answerMatch = raw.match(/<ANSWER>([\s\S]*?)<\/ANSWER>/i);
  const answer = answerMatch?.[1]?.trim() ?? "";

  const followUps: string[] = [];
  const followUpsMatch = raw.match(/<FOLLOW_UPS>([\s\S]*?)<\/FOLLOW_UPS>/i);
  const followUpsContent = followUpsMatch?.[1];
  if (followUpsContent) {
    const questionRegex = /<question>([\s\S]*?)<\/question>/gi;
    let m;
    while ((m = questionRegex.exec(followUpsContent)) !== null) {
      const q = m[1]?.trim();
      if (q) followUps.push(q);
    }
  }

  const sources: ParsedResponse["sources"] = [];
  const sourcesSplit = raw.split("------------SOURCES-------------");
  const sourcesBlock = sourcesSplit[1]?.trim();
  if (sourcesBlock) {
    const sourceLines = sourcesBlock.split("\n\n");
    for (const block of sourceLines) {
      const lines = block.trim().split("\n");
      const titleLine = lines[0]?.trim();
      const url = lines[1]?.trim();
      if (titleLine && url) {
        const titleMatch = titleLine.match(/^(\d+)\.\s+(.+)$/);
        if (titleMatch && titleMatch[1] && titleMatch[2]) {
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
