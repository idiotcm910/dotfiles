/**
 * Scrollable overlay pager for /acc commands.
 * Renders all /acc output in a clean floating overlay outside the AI context.
 */

export type PagerTheme = {
  fg: (color: string, text: string) => string;
  bold?: (text: string) => string;
};

const ESC = "\x1b";

/** Threshold for deciding default view height (max lines shown before scrolling). */
export const PAGER_MAX_VIEW_ROWS = 18;

function isUp(data: string): boolean {
  return data === "k" || data === `${ESC}[A` || data === `${ESC}OA`;
}
function isDown(data: string): boolean {
  return data === "j" || data === `${ESC}[B` || data === `${ESC}OB`;
}
function isPageUp(data: string): boolean {
  return data === `${ESC}[5~` || data === "b";
}
function isPageDown(data: string): boolean {
  return data === " " || data === `${ESC}[6~` || data === "f";
}
function isHome(data: string): boolean {
  return data === "g" || data === `${ESC}[H` || data === `${ESC}[1~`;
}
function isEnd(data: string): boolean {
  return data === "G" || data === `${ESC}[F` || data === `${ESC}[4~`;
}
function isQuit(data: string): boolean {
  return (
    data === "q" ||
    data === "Q" ||
    data === ESC ||
    data === `${ESC}${ESC}` ||
    data === "\x03" || // Ctrl+C
    data === "\r" || // Enter
    data === "\n" // Enter
  );
}

export function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
}

export function visibleWidth(str: string): number {
  const plain = stripAnsi(str);
  let width = 0;
  for (const char of plain) {
    const code = char.codePointAt(0) || 0;
    if (
      (code >= 0x1100 && code <= 0x115f) ||
      (code >= 0x2e80 && code <= 0xa4cf) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe10 && code <= 0xfe19) ||
      (code >= 0xfe30 && code <= 0xfe6f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6) ||
      (code >= 0x20000 && code <= 0x3fffd)
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

export function padToWidth(text: string, targetWidth: number): string {
  const vis = visibleWidth(text);
  if (vis >= targetWidth) {
    let current = "";
    let w = 0;
    for (const ch of text) {
      const cw = visibleWidth(ch);
      if (w + cw > targetWidth - 1) {
        return current + "…";
      }
      current += ch;
      w += cw;
    }
    return current + " ".repeat(Math.max(0, targetWidth - w));
  }
  return text + " ".repeat(targetWidth - vis);
}

export function clampOffset(offset: number, total: number, viewRows: number): number {
  const maxOff = Math.max(0, total - viewRows);
  if (!Number.isFinite(offset) || offset < 0) return 0;
  if (offset > maxOff) return maxOff;
  return Math.floor(offset);
}

export function pageSlice(lines: string[], offset: number, viewRows: number): string[] {
  const off = clampOffset(offset, lines.length, viewRows);
  return lines.slice(off, off + viewRows);
}

export type AccPagerOptions = {
  title?: string;
  viewRows?: number;
};

/**
 * Focusable scrollable pager for ctx.ui.custom({ overlay: true }).
 */
export class AccPager {
  /** Focusable — set by TUI when focused. */
  focused = false;

  private offset = 0;
  private readonly lines: string[];
  private readonly theme: PagerTheme;
  private readonly done: () => void;
  private readonly title: string;
  private readonly viewRows: number;
  private tui: { requestRender?: () => void } | null = null;

  constructor(
    lines: string[],
    theme: PagerTheme,
    done: () => void,
    opts: AccPagerOptions = {},
  ) {
    this.lines = lines.length > 0 ? [...lines] : [""];
    this.theme = theme;
    this.done = done;
    this.title = opts.title || "/acc";
    // Adaptive viewport: shrink box for short output (e.g. 1-3 lines), cap at max for long output
    const contentCount = this.lines.length;
    const maxCap = Math.max(1, opts.viewRows ?? PAGER_MAX_VIEW_ROWS);
    this.viewRows = Math.max(1, Math.min(contentCount, maxCap));
  }

  bindTui(tui: { requestRender?: () => void }): void {
    this.tui = tui;
  }

  private bump(delta: number): void {
    this.offset = clampOffset(this.offset + delta, this.lines.length, this.viewRows);
    this.tui?.requestRender?.();
  }

  handleInput(data: string): void {
    if (isQuit(data)) {
      this.done();
      return;
    }
    if (isUp(data)) {
      this.bump(-1);
      return;
    }
    if (isDown(data)) {
      this.bump(1);
      return;
    }
    if (isPageUp(data)) {
      this.bump(-(this.viewRows - 1));
      return;
    }
    if (isPageDown(data)) {
      this.bump(this.viewRows - 1);
      return;
    }
    if (isHome(data)) {
      this.offset = 0;
      this.tui?.requestRender?.();
      return;
    }
    if (isEnd(data)) {
      this.offset = clampOffset(1e9, this.lines.length, this.viewRows);
      this.tui?.requestRender?.();
    }
  }

  render(width: number): string[] {
    const th = this.theme;
    const w = Math.max(50, Math.min(width || 80, 96));
    const inner = w - 2;
    const bar = "─".repeat(inner);

    const total = this.lines.length;
    const off = clampOffset(this.offset, total, this.viewRows);
    const slice = pageSlice(this.lines, off, this.viewRows);
    const from = total === 0 ? 0 : off + 1;
    const to = Math.min(total, off + slice.length);
    const moreAbove = off > 0;
    const moreBelow = off + this.viewRows < total;

    const row = (content: string, color?: string): string => {
      const padded = padToWidth(content, inner);
      const colored = color ? th.fg(color, padded) : padded;
      return th.fg("border", "│") + colored + th.fg("border", "│");
    };

    const out: string[] = [];
    out.push(th.fg("border", `╭${bar}╮`));
    out.push(row(` ${this.title}  ·  not in AI context`, "accent"));
    out.push(th.fg("border", `├${bar}┤`));

    if (moreAbove) {
      out.push(row(" ↑ more above (k / ↑)", "dim"));
    }

    for (const line of slice) {
      let color = "text";
      if (/^\*\s/.test(line)) {
        color = "accent";
      } else if (/\berror\b/i.test(line)) {
        color = "warning";
      } else if (/^ {4}plan\b/.test(line) || line.startsWith("────")) {
        color = "toolTitle";
      } else if (/^ {4}age\b/.test(line)) {
        color = "dim";
      } else if (/^(added|switched|renamed|removed|adopted)\b/i.test(line.trim())) {
        color = "accent";
      }
      out.push(row(` ${line}`, color));
    }

    if (moreBelow) {
      out.push(row(" ↓ more below (j / ↓ / space)", "dim"));
    }

    const isScrollable = total > this.viewRows;
    const status = isScrollable
      ? ` ${from}-${to}/${total} · j/k line · space page · g/G · Enter/Esc/q close`
      : ` ${total} line${total === 1 ? "" : "s"} · Enter / Esc / q close`;

    out.push(th.fg("border", `├${bar}┤`));
    out.push(row(status, "dim"));
    out.push(th.fg("border", `╰${bar}╯`));
    return out;
  }

  invalidate(): void {}
}
