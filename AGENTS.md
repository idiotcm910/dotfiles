# Dotfiles maintenance rules

When changing or repairing desktop behavior in this repository:

1. Treat files under this repository as the source of truth. Update the relevant
   dotfile, not only a generated or per-user copy under `$HOME`.
2. Apply the safe live update where possible (reload the compositor or restart
   the affected user process) and verify the active process uses the repository
   configuration.
3. Make the change reproducible on a fresh Arch installation. Update
   `restore.sh` for required packages, symlinks, permissions, and any
   deterministic post-install configuration.
4. Validate shell changes with `bash -n`; validate restore behavior with its
   relevant `--dry-run` profile. Keep existing unrelated worktree changes.
5. For Hyprland/Wayland changes, use the `hyprland` restore alias (or
   `wayland`) and keep `config/hypr`, `config/waybar`, and their startup
   dependencies consistent.
6. For Vietnamese input on Hyprland, use Fcitx5-Bamboo. Keep its package list,
   `config/fcitx5` profile, Wayland environment variables, and autostart in
   sync; avoid hotkeys claimed by Hyprland. Keep Chrome's Wayland IME flag in
   `config/chrome-flags.conf` and restore it to `~/.config/chrome-flags.conf`.
