# Grok

Portable Grok CLI configuration exported from `~/.grok`.

Tracked:

- `config.toml` (models, UI, marketplace sources, enabled plugins)

Runtime state is intentionally excluded, including authentication, agent id,
sessions, logs, caches, downloads, binaries, installed plugin checkouts,
marketplace cache and worktree databases.

Restore the tracked file into `~/.grok` without replacing that whole runtime
directory. After restore, run `grok login` and reinstall plugins if needed
(for example `superpowers` from the official marketplace).
