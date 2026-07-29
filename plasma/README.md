# KDE Plasma Wayland

KDE Plasma replaces the hand-built Sway desktop with a complete native Wayland
session: top panel, notifications, launcher, display settings, effects, and
IBus Bamboo. GDM and GNOME remain available as safe fallbacks.

```bash
cd ~/thai/system
bash plasma/install.sh
```

The script needs your sudo password. Log out and select **Plasma (Wayland)** at
the GDM gear menu. Its first login makes the panel a top header and adds CPU/RAM
monitoring; IBus Bamboo starts automatically. Open **IBus Bamboo Setup** from
the app launcher to choose your preferred Vietnamese input mode/hotkey.

Only after Plasma works, remove Sway:

```bash
bash ~/thai/system/plasma/remove-sway.sh
```

The removal script requires `REMOVE-SWAY`, purges only Sway-related packages,
and moves live configs plus backups to Trash. The source under `system/sway`
stays as a recoverable archive.
