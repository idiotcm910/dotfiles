# Copyright (c) 2010 Aldo Cortesi
# Copyright (c) 2010, 2014 dequis
# Copyright (c) 2012 Randall Ma
# Copyright (c) 2012-2014 Tycho Andersen
# Copyright (c) 2012 Craig Barnes
# Copyright (c) 2013 horsik
# Copyright (c) 2013 Tao Sauvage
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

import os
import subprocess
from libqtile import bar, layout, widget, qtile, hook
from libqtile.config import Click, Drag, Group, Key, Match, Screen
from libqtile.lazy import lazy
from libqtile.utils import guess_terminal

mod = "mod4"
terminal = guess_terminal()

keys = [
    # A list of available commands that can be bound to keys can be found
    # at https://docs.qtile.org/en/latest/manual/config/lazy.html
    # Switch between windows
    Key([mod], "h", lazy.layout.left(), desc="Move focus to left"),
    Key([mod], "l", lazy.layout.right(), desc="Move focus to right"),
    Key([mod], "j", lazy.layout.down(), desc="Move focus down"),
    Key([mod], "k", lazy.layout.up(), desc="Move focus up"),
    Key([mod], "space", lazy.layout.next(), desc="Move window focus to other window"),
#=============== layout monadltall =============

    Key([mod, "shift"], "h", 
        lazy.layout.swap_left()
    ),
    Key([mod, "shift"], "l", 
        lazy.layout.swap_right()
    ),
    Key([mod, "control"], "h",
        lazy.layout.grow(),
        lazy.layout.increase_nmaster(),
        desc='Expand window (MonadTall), increase number in master pane (Tile)'
        ),
    Key([mod, "control"], "l",
        lazy.layout.shrink(),
        lazy.layout.decrease_nmaster(),
        desc='Shrink window (MonadTall), decrease number in master pane (Tile)'
        ),
    Key([mod], "n",
        lazy.layout.reset(),
        desc='normalize window size ratios'
        ),    
    Key([mod], "m",
        lazy.layout.maximize(),
        desc='toggle window between minimum and maximum sizes'
        ),
    # Toggle Fullscreen
    Key([mod], "f",
        lazy.window.toggle_fullscreen(),
        desc='Toggle fullscreen and the bars'
        ),
    # Toggle floating
    Key([mod, "shift"], "f", lazy.window.toggle_floating(),
        desc="Toggle floating"
        ),

    Key([mod], "Return", lazy.spawn(terminal), desc="Launch terminal"),
    # Toggle between different layouts as defined below
    Key([mod], "Tab", lazy.next_layout(), desc="Toggle between layouts"),
    Key([mod], "w", lazy.window.kill(), desc="Kill focused window"),
    Key([mod, "control"], "r", lazy.reload_config(), desc="Reload the config"),
    Key([mod, "control"], "q", lazy.shutdown(), desc="Shutdown Qtile"),

    # Applications
    Key([mod, "shift"], "r", lazy.spawn('rofi -show drun')),
]

groups = [Group(i) for i in "123456789"]

for i in groups:
    keys.extend(
        [
            # mod1 + letter of group = switch to group
            Key(
                [mod],
                i.name,
                lazy.group[i.name].toscreen(),
                desc="Switch to group {}".format(i.name),
            ),
            # mod1 + shift + letter of group = switch to & move focused window to group
            Key(
                [mod, "shift"],
                i.name,
                lazy.window.togroup(i.name, switch_group=True),
                desc="Switch to & move focused window to group {}".format(i.name),
            ),
            # Or, use below if you prefer not to switch to that group.
            # # mod1 + shift + letter of group = move focused window to group
            # Key([mod, "shift"], i.name, lazy.window.togroup(i.name),
            #     desc="move focused window to group {}".format(i.name)),
        ]
    )

layout_theme = {"border_width": 3,
                "margin": 8,
                "border_focus": "#268bd2",
                "border_normal": "#073642"
                }

layouts = [
    layout.MonadTall(**layout_theme, single_border_width=0),
    layout.Max(**layout_theme),
    # Try more layouts by unleashing below layouts.
    #layout.Bsp(**layout_theme),
    #layout.Columns(**layout_theme),
    #layout.Floating(**layout_theme),
    # layout.Matrix(),
    # layout.MonadWide(),
    # layout.RatioTile(),
    # layout.Tile(),
    # layout.TreeTab(),
    # layout.VerticalTile(),
    # layout.Zoomy(),
]

#=============== mouse callbacks =============
def open_pavucontrol():
    qtile.cmd_spawn('pavucontrol')

def open_terminal():
    qtile.cmd_spawn("kitty")

def open_web():
    qtile.cmd_spawn("firefox")

def sleeping():
    qtile.cmd_spawn("systemctl suspend")

def reboot():
    qtile.cmd_spawn("reboot")

def shutdown():
    qtile.cmd_spawn("shutdown now")

def open_thunar():
    qtile.cmd_spawn("thunar")

c_background = "#282a36"
c_foreground = "#f8f8f2"
c_green = "#50fa7b"
c_orange = "#ffb86c"
c_pink = "#ff79c6"
c_cyan = "#8be9fd"
c_yellow = "#f1fa8c"
c_foreground_2 = "#44475a"
c_purple = "#bd93f9"

c_red = "#ff5555"
fontDefault = "bitstreamverasansmono nerd font mono bold"
heightBar = 25
border_size = 5
heightItem = heightBar - border_size

widget_defaults = dict(
    font="bitstreamverasansmono nerd font mono bold",
    fontsize=13,
)
extension_defaults = widget_defaults.copy()

screens = []

#screens = [
#    Screen(
#        top=bar.Bar(
#            [
##                widget.Sep(
##                    foreground="#50fa7b",
##                    padding=10,
##                    linewidth=10
##                ),
##                widget.Sep(
##                    foreground="#ffb86c",
##                    padding=10,
##                    linewidth=10
##                ),
##                widget.Sep(
##                    foreground="#ff79c6",
##                    padding=10,
##                    linewidth=10
##                ),
##                widget.Spacer(length=20),
#                #======= file manager ======
#                widget.TextBox(
#                    text="\ue0b0",
#                    foreground=c_background,
#                    background=c_green,
#                    fontsize=heightBar,
#                    font=fontDefault,
#                    padding=0
#                ),
#                widget.TextBox(
#                    text="\ufc6e",
#                    foreground=c_foreground_2,
#                    background=c_green,
#                    fontsize=heightBar,
#                    padding=10,
#                    font=fontDefault,
#                    mouse_callbacks = {"Button1": open_thunar}
#                ),
#                #======= web =======
#                widget.TextBox(
#                    text="\ue0b4",
#                    foreground=c_green,
#                    background=c_orange,
#                    fontsize=heightBar,
#                    font=fontDefault,
#                    padding=0
#                ),
#                widget.TextBox(
#                    text="\uf268",
#                    foreground=c_foreground_2,
#                    background=c_orange,
#                    padding=10,
#                    fontsize=heightBar,
#                    font="bitstreamverasansmono nerd font mono bold",
#                    mouse_callbacks = {"Button1": open_web}
#                ),
#                #======= terminal ======
#                widget.TextBox(
#                    text="\ue0c7",
#                    foreground=c_pink,
#                    background=c_orange,
#                    fontsize=heightBar,
#                    font=fontDefault,
#                    padding=0
#                ),
#                widget.TextBox(
#                    text="\ue795",
#                    foreground=c_foreground_2,
#                    background=c_pink,
#                    padding=10,
#                    fontsize=heightBar,
#                    font="bitstreamverasansmono nerd font mono bold",
#                    mouse_callbacks = {"Button1": open_terminal}
#                ),
#                widget.TextBox(
#                    text="\ue0bc",
#                    foreground=c_pink,
#                    background=c_red,
#                    fontsize=heightBar,
#                    font=fontDefault,
#                    padding=0
#                ),
#                #===== group box =====
#                widget.TextBox(
#                    text="\uf7c2",
#                    foreground=c_foreground_2,
#                    background=c_red,
#                    font=fontDefault,
#                    fontsize=heightBar + 5
#                ),
#                widget.TextBox(
#                    text="\ue0d2",
#                    foreground=c_red,
#                    background=c_background,
#                    fontsize=heightBar,
#                    font=fontDefault,
#                    padding=0
#                ),
#                widget.GroupBox(
#                    font=fontDefault,
#                    highlight_method="block",
#                    background=c_background,
#                    inactive=c_foreground,
#                    active=c_foreground_2,
#                    this_current_screen_border=c_red
#                ),
#                widget.TextBox(
#                    text="\ue0d4",
#                    foreground=c_red,
#                    background=c_background,
#                    fontsize=heightBar,
#                    font=fontDefault,
#                    padding=0
#                ),
#                #=========== Clock =========
#                widget.Spacer(length=280),
##                widget.TextBox(
##                    text="\ue0b6",
##                    foreground=c_purple,
##                    background=c_background,
##                    fontsize=heightItem,
##                    font=fontDefault,
##                    padding=0
##                ),
#                widget.Clock(
#                    format="%Y-%m-%d %a %I:%M %p",
#                    background=c_purple,
#                    foreground=c_foreground_2,
#                    font=fontDefault,
#                    fontsize=14
#                ),
##                widget.TextBox(
##                    text="\ue0b4",
##                    foreground=c_purple,
##                    background=c_background,
##                    fontsize=heightItem + 4,
##                    font=fontDefault,
##                    padding=0
##                ),
#                widget.Spacer(length=280),
#                #========= cpu ===========
##                widget.Sep(
##                    foreground="#50fa7b",
##                    padding=10,
##                    linewidth=10
##                ),
#                widget.TextBox(
#                    text="\uf0a0",
#                    foreground=c_green,
#                    padding=5,
#                    fontsize=heightBar,
#                    font="bitstreamverasansmono nerd font mono bold",
#                ),
#                widget.CPU(
#                    format="{load_percent}%",
#                    font=fontDefault,
#                    fontsize=14,
#                    foreground=c_foreground
#                ),
#                #========== memory =========
##                widget.Sep(
##                    foreground=c_orange,
##                    padding=10,
##                    linewidth=10
##                ),
#                widget.TextBox(
#                    text="",
#                    foreground=c_orange,
#                    padding=5,
#                    fontsize=heightBar,
#                    font=fontDefault
#                ),
#                widget.Memory(
#                    font=fontDefault,
#                    fontsize=14,
#                    foreground=c_foreground
#                ),
#                #========= battery ========
##                widget.Sep(
##                    foreground=c_pink,
##                    padding=10,
##                    linewidth=10
##                ),
#                widget.TextBox(
#                    text="",
#                    foreground=c_pink,
#                    padding=5,
#                    fontsize=heightBar,
#                    font=fontDefault
#                ),
#                widget.Battery(
#                    format="{percent:2.0%} {hour:d}:{min:02d}",
#                    font=fontDefault,
#                    fontsize=14,
#                    foreground=c_foreground
#                ),
#                #========== volume ==========
#                widget.TextBox(
#                    text="\uf028",
#                    foreground=c_red,
#                    padding=5,
#                    fontsize=heightBar,
#                    font=fontDefault,
#                    mouse_callbacks = {'Button1': open_pavucontrol}
#                ),
#                #========== sleeping =========
#                widget.Spacer(length=5),
#                widget.TextBox(
#                    text="\uf186",
#                    foreground=c_cyan,
#                    padding=5,
#                    fontsize=heightBar,
#                    font=fontDefault,
#                    mouse_callbacks = {'Button1': sleeping}
#                ),
#                #========== reboot ===========
#                widget.TextBox(
#                    text="\uf01e",
#                    foreground=c_yellow,
#                    padding=5,
#                    fontsize=heightBar,
#                    font=fontDefault,
#                    mouse_callbacks = {'Button1': reboot}
#                ),
#                #========== shutdown ===========
#                widget.TextBox(
#                    text="\uf011",
#                    foreground=c_purple,
#                    padding=5,
#                    fontsize=heightBar,
#                    font=fontDefault,
#                    mouse_callbacks = {'Button1': shutdown}
#                ),
#                #============================
##                widget.Spacer(length=20),
##                widget.Sep(
##                    foreground="#50fa7b",
##                    padding=10,
##                    linewidth=10
##                ),
##                widget.Sep(
##                    foreground="#ffb86c",
##                    padding=10,
##                    linewidth=10
##                ),
##                widget.Sep(
##                    foreground="#ff79c6",
##                    padding=10,
##                    linewidth=10
##                ),
#            ],
#            heightBar, background="#282a36", margin=[8, 8, 0, 8], border_width=[8, 0, 8, 0]
#            #border_width=[2, 0, 2, 0],  # Draw top and bottom borders
#            # border_color=["ff00ff", "000000", "ff00ff", "000000"]  # Borders are magenta
#        ),
#    ),
#]

# Drag floating layouts.
mouse = [
    Drag([mod], "Button1", lazy.window.set_position_floating(), start=lazy.window.get_position()),
    Drag([mod], "Button3", lazy.window.set_size_floating(), start=lazy.window.get_size()),
    Click([mod], "Button2", lazy.window.bring_to_front()),
]

dgroups_key_binder = None
dgroups_app_rules = []  # type: list
follow_mouse_focus = True
bring_front_click = False
cursor_warp = False
floating_layout = layout.Floating(
    float_rules=[
        # Run the utility of `xprop` to see the wm class and name of an X client.
        *layout.Floating.default_float_rules,
        Match(wm_class="confirmreset"),  # gitk
        Match(wm_class="makebranch"),  # gitk
        Match(wm_class="maketag"),  # gitk
        Match(wm_class="ssh-askpass"),  # ssh-askpass
        Match(title="branchdialog"),  # gitk
        Match(title="pinentry"),  # GPG key password entry
    ]
)
auto_fullscreen = True
focus_on_window_activation = "smart"
reconfigure_screens = True

# If things like steam games want to auto-minimize themselves when losing
# focus, should we respect this or not?
auto_minimize = True

# When using the Wayland backend, this can be used to configure input devices.
wl_input_rules = None

# XXX: Gasp! We're lying here. In fact, nobody really uses or cares about this
# string besides java UI toolkits; you can see several discussions on the
# mailing lists, GitHub issues, and other WM documentation that suggest setting
# this string if your java app doesn't work correctly. We may as well just lie
# and say that we're a working one by default.
#
# We choose LG3D to maximize irony: it is a 3D non-reparenting WM written in
# java that happens to be on java's whitelist.
wmname = "LG3D"
