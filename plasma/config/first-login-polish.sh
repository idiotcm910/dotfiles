#!/bin/sh
# First Plasma session: put the panel at top and add a compact system monitor.
set -eu
marker="$HOME/.config/plasma-tokyo-night-ready"
[ -e "$marker" ] && exit 0
sleep 8
qdbus_bin="$(command -v qdbus || command -v qdbus-qt5 || true)"
[ -n "$qdbus_bin" ] || exit 0
script='var panel = panels()[0]; if (panel) { panel.location = "top"; panel.height = 36; var monitor = panel.addWidget("org.kde.plasma.systemmonitor"); monitor.currentConfigGroup = ["General"]; monitor.writeConfig("displayStyle", "Compact"); monitor.currentConfigGroup = ["Appearance"]; monitor.writeConfig("chartFace", "org.kde.ksysguard.textonly"); monitor.currentConfigGroup = ["Sensors"]; monitor.writeConfig("totalSensors", "cpu/all/usage,memory/physical/usedPercent"); }'
"$qdbus_bin" org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.evaluateScript "$script" >/dev/null 2>&1 || exit 0
touch "$marker"
