# Qtile Shortcuts Guide Design

## Goal

Add a Vietnamese cheatsheet that documents only the keyboard and mouse bindings
currently active in `config/qtile/config.py`. The page must help the user recall
an action quickly without implying that unconfigured shortcuts are available.

## Source of truth

`config/qtile/config.py` is authoritative. The guide documents:

- `Super` focus movement with `H/J/K/L` and focus cycling with `Space`;
- `Super+Shift` window swaps and floating toggle;
- `Super+Ctrl` layout sizing, Qtile reload, and Qtile shutdown;
- layout reset, maximize, fullscreen, and layout switching;
- terminal and Rofi launchers;
- workspace switching and move-and-follow behavior for groups `1` through `9`;
- floating-window mouse move, resize, and raise actions.

Commented-out bindings and proposed shortcuts are out of scope.

## Information architecture

Create `guide/qtile.html` as page `09 · Qtile`. Use the existing guide shell,
shared sidebar, search, theme toggle, `.group`, `.rows`, `.row`, and keyboard-key
components. Organize shortcuts by user intent:

1. Mental model and modifier legend.
2. Focus windows.
3. Move and resize windows.
4. Layout and window modes.
5. Workspaces 1–9.
6. Launch applications.
7. Qtile lifecycle.
8. Floating-window mouse controls.

Add a prominent warning that `Super+W` closes one window while
`Super+Ctrl+Q` shuts down Qtile. Register the page in the shared `PAGES` array,
add an index card, and document it in `guide/README.md`.

## Interaction and responsive behavior

The page uses the existing `/` search and `Escape` clear behavior without new
JavaScript. Existing light/dark themes and responsive two-column rows remain
authoritative. On narrow screens, key combinations may wrap but must not cause
horizontal page overflow.

## Verification

Add a shell contract test that verifies:

- the page, navigation entry, and index card exist;
- every documented shortcut maps to an active binding in the Qtile config;
- workspace and mouse bindings are represented;
- the close-window versus shutdown warning is present;
- search-compatible `.group` and `.row` structures are used;
- local links resolve and existing guide, restore, and tmux tests still pass.

Visually inspect desktop and mobile layouts, both themes, search filtering, and
keyboard focus before committing the implementation.
