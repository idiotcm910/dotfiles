# brainstorming override

SKILL.md overrides Superpowers brainstorming (user skill wins).
On a fresh machine after restore, run:

```bash
PKG="$HOME/.pi/agent/git/github.com/obra/superpowers/skills/brainstorming"
ln -sfn "$PKG/visual-companion.md" "$HOME/.pi/agent/skills/brainstorming/visual-companion.md"
ln -sfn "$PKG/spec-document-reviewer-prompt.md" "$HOME/.pi/agent/skills/brainstorming/spec-document-reviewer-prompt.md"
ln -sfn "$PKG/scripts" "$HOME/.pi/agent/skills/brainstorming/scripts"
```

Or open Pi once after superpowers install — you can also re-run restore ai after packages install.
