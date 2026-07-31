# Desktop profiles

This repository intentionally keeps two independent desktop profiles.

## Qtile X11

Restore with `./restore.sh --profile x11`. This installs Xorg, Qtile, Polybar,
Picom, Rofi and the X11 screenshot workflow. Its sources are `config/qtile`,
`config/polybar`, `config/rofi`, and `.xinitrc`.

## Hyprland Wayland

Restore with `./restore.sh --profile wayland`. This installs Hyprland, Waybar,
Fuzzel, Mako, Swaybg, Swaylock, Grim/Slurp/Satty and portals. It deliberately
does not install `xorg-server`, `xorg-xinit`, or `xorg-xwayland`.

The Wayland profile sources are `config/hypr`, `config/waybar`,
`config/fuzzel`, `config/mako`, and `config/environment.d`.

After restoring Wayland, log in through a Wayland-capable display manager and
select Hyprland, or start `dbus-run-session Hyprland` from a TTY. Verify IBus
Vietnamese input in Kitty, Neovim and Chrome before removing any existing X11
packages from an older installation.
