/**
 * Compact tool-call headers for Pi TUI.
 *
 * Shows tool name + a short target only (no full bash command / long args).
 * Results stay hidden unless the user expands with Ctrl+O.
 *
 * Loads from ~/.pi/agent/extensions so it outranks npm packages (first-wins).
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
	createBashTool,
	createEditTool,
	createFindTool,
	createGrepTool,
	createLsTool,
	createReadTool,
	createWriteTool,
} from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { basename } from "node:path";

const CALL_TARGET_MAX = 48;
const EXPANDED_PREVIEW_LINES = 24;

type Theme = {
	fg(color: string, text: string): string;
	bold(text: string): string;
};

type TextResult = {
	content?: Array<{ type?: string; text?: string }>;
	details?: unknown;
	isError?: boolean;
};

function asRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string {
	return typeof value === "string" ? value : "";
}

function shorten(text: string, max = CALL_TARGET_MAX): string {
	const oneLine = text.replace(/\s+/g, " ").trim();
	if (!oneLine) return "";
	if (oneLine.length <= max) return oneLine;
	return `${oneLine.slice(0, Math.max(1, max - 1))}…`;
}

function shortPath(pathValue: unknown): string {
	const raw = asString(pathValue).trim();
	if (!raw) return "";
	try {
		return shorten(basename(raw) || raw, 40);
	} catch {
		return shorten(raw, 40);
	}
}

function callLine(theme: Theme, name: string, target = ""): Text {
	let text = theme.fg("toolTitle", theme.bold(name));
	if (target) {
		text += ` ${theme.fg("accent", target)}`;
	}
	return new Text(text, 0, 0);
}

function resultText(result: TextResult): string {
	const block = result.content?.find((part) => part?.type === "text");
	return typeof block?.text === "string" ? block.text : "";
}

function hiddenResult(
	theme: Theme,
	options: { expanded?: boolean; isPartial?: boolean },
	result: TextResult,
	partialLabel: string,
): Text {
	if (options.isPartial) {
		return new Text(theme.fg("muted", partialLabel), 0, 0);
	}

	const output = resultText(result);
	const isError =
		result.isError === true ||
		(output.startsWith("Error") && output.length > 0);

	if (isError) {
		const first = output.split("\n").find((line) => line.trim()) || "error";
		return new Text(theme.fg("error", shorten(first, 80)), 0, 0);
	}

	if (!options.expanded) {
		// Intentionally empty: user only wants the call header.
		return new Text("", 0, 0);
	}

	if (!output.trim()) {
		return new Text(theme.fg("muted", "↳ (no output)"), 0, 0);
	}

	const lines = output.split("\n");
	const preview = lines.slice(0, EXPANDED_PREVIEW_LINES);
	let text = preview.map((line) => theme.fg("muted", line)).join("\n");
	if (lines.length > EXPANDED_PREVIEW_LINES) {
		text += `\n${theme.fg("muted", `… ${lines.length - EXPANDED_PREVIEW_LINES} more lines`)}`;
	}
	return new Text(text, 0, 0);
}

function bashCallTarget(command: unknown): string {
	const cmd = asString(command).trim();
	if (!cmd) return "";
	// First shell token only (e.g. python3, rg, git) — never the full script.
	const token = cmd.split(/\s+/)[0] || "";
	return shorten(token.replace(/^.*\//, ""), 32);
}

export default function (pi: ExtensionAPI): void {
	const cwd = process.cwd();

	const originalRead = createReadTool(cwd);
	pi.registerTool({
		name: "read",
		label: "read",
		description: originalRead.description,
		parameters: originalRead.parameters,
		async execute(toolCallId, params, signal, onUpdate) {
			return originalRead.execute(toolCallId, params, signal, onUpdate);
		},
		renderCall(args, theme) {
			const a = asRecord(args);
			return callLine(theme, "read", shortPath(a.path));
		},
		renderResult(result, options, theme) {
			return hiddenResult(theme, options, result as TextResult, "reading…");
		},
	});

	const originalBash = createBashTool(cwd);
	pi.registerTool({
		name: "bash",
		label: "bash",
		description: originalBash.description,
		parameters: originalBash.parameters,
		async execute(toolCallId, params, signal, onUpdate) {
			return originalBash.execute(toolCallId, params, signal, onUpdate);
		},
		renderCall(args, theme) {
			const a = asRecord(args);
			const target = bashCallTarget(a.command);
			return callLine(theme, "$", target || "bash");
		},
		renderResult(result, options, theme) {
			return hiddenResult(theme, options, result as TextResult, "running…");
		},
	});

	const originalEdit = createEditTool(cwd);
	pi.registerTool({
		name: "edit",
		label: "edit",
		description: originalEdit.description,
		parameters: originalEdit.parameters,
		renderShell: "self",
		async execute(toolCallId, params, signal, onUpdate) {
			return originalEdit.execute(toolCallId, params, signal, onUpdate);
		},
		renderCall(args, theme) {
			const a = asRecord(args);
			return callLine(theme, "edit", shortPath(a.path));
		},
		renderResult(result, options, theme) {
			return hiddenResult(theme, options, result as TextResult, "editing…");
		},
	});

	const originalWrite = createWriteTool(cwd);
	pi.registerTool({
		name: "write",
		label: "write",
		description: originalWrite.description,
		parameters: originalWrite.parameters,
		async execute(toolCallId, params, signal, onUpdate) {
			return originalWrite.execute(toolCallId, params, signal, onUpdate);
		},
		renderCall(args, theme) {
			const a = asRecord(args);
			return callLine(theme, "write", shortPath(a.path));
		},
		renderResult(result, options, theme) {
			return hiddenResult(theme, options, result as TextResult, "writing…");
		},
	});

	const originalGrep = createGrepTool(cwd);
	pi.registerTool({
		name: "grep",
		label: "grep",
		description: originalGrep.description,
		parameters: originalGrep.parameters,
		async execute(toolCallId, params, signal, onUpdate) {
			return originalGrep.execute(toolCallId, params, signal, onUpdate);
		},
		renderCall(args, theme) {
			const a = asRecord(args);
			const pattern = shorten(asString(a.pattern), 32);
			const pathPart = shortPath(a.path || a.glob);
			const target = [pattern, pathPart].filter(Boolean).join(" · ");
			return callLine(theme, "grep", target);
		},
		renderResult(result, options, theme) {
			return hiddenResult(theme, options, result as TextResult, "searching…");
		},
	});

	const originalFind = createFindTool(cwd);
	pi.registerTool({
		name: "find",
		label: "find",
		description: originalFind.description,
		parameters: originalFind.parameters,
		async execute(toolCallId, params, signal, onUpdate) {
			return originalFind.execute(toolCallId, params, signal, onUpdate);
		},
		renderCall(args, theme) {
			const a = asRecord(args);
			const pattern = shorten(asString(a.pattern || a.glob || a.name), 32);
			const pathPart = shortPath(a.path);
			const target = [pattern, pathPart].filter(Boolean).join(" · ");
			return callLine(theme, "find", target);
		},
		renderResult(result, options, theme) {
			return hiddenResult(theme, options, result as TextResult, "finding…");
		},
	});

	const originalLs = createLsTool(cwd);
	pi.registerTool({
		name: "ls",
		label: "ls",
		description: originalLs.description,
		parameters: originalLs.parameters,
		async execute(toolCallId, params, signal, onUpdate) {
			return originalLs.execute(toolCallId, params, signal, onUpdate);
		},
		renderCall(args, theme) {
			const a = asRecord(args);
			return callLine(theme, "ls", shortPath(a.path) || ".");
		},
		renderResult(result, options, theme) {
			return hiddenResult(theme, options, result as TextResult, "listing…");
		},
	});
}
