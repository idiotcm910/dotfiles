#!/usr/bin/env bash
# IBus must be present in the environment before Qtile starts so that GUI
# applications (including Kitty) can receive composed Vietnamese input.
export GTK_IM_MODULE=ibus
export QT_IM_MODULE=ibus
export XMODIFIERS=@im=ibus
export GLFW_IM_MODULE=ibus

dbus-update-activation-environment --systemd DISPLAY XAUTHORITY
systemctl --user import-environment DISPLAY XAUTHORITY
exec qtile start
