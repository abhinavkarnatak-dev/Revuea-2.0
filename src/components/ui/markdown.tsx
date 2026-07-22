/**
 * Minimal markdown renderer for AI summaries - bold, headings, bullets,
 * paragraphs. Escapes everything else; no dependency, no dangerous HTML.
 */

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyBase}-${i}`} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function Markdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = (key: string) => {
    if (bullets.length === 0) return;
    const items = [...bullets];
    bullets = [];
    blocks.push(
      <ul key={key} className="my-3 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-soft">
            <span className="mt-[9px] size-1 shrink-0 rounded-full bg-ever" />
            <span>{renderInline(item, `${key}-${i}`)}</span>
          </li>
        ))}
      </ul>
    );
  };

  lines.forEach((raw, index) => {
    const line = raw.trim();
    const key = `b${index}`;

    if (/^[-*•]\s+/.test(line)) {
      bullets.push(line.replace(/^[-*•]\s+/, ""));
      return;
    }
    flushBullets(`ul-${index}`);

    if (line === "") return;

    const heading = line.match(/^(#{1,4})\s+(.*)/);
    if (heading) {
      blocks.push(
        <h4 key={key} className="mb-1.5 mt-5 text-sm font-semibold text-ink">
          {renderInline(heading[2], key)}
        </h4>
      );
      return;
    }

    blocks.push(
      <p key={key} className="my-2.5 text-sm leading-relaxed text-ink-soft">
        {renderInline(line, key)}
      </p>
    );
  });
  flushBullets("ul-end");

  return <div>{blocks}</div>;
}
