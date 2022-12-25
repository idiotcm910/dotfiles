#!/bin/sh
SCRIPT=`realpath $0`
SCRIPTPATH=`dirname $SCRIPT`

for f in config/*/ ; do
	NAME=`basename $f`
	echo "symlink folder $NAME to ~/.config"
	ln -s $SCRIPTPATH/$f ~/.config/$NAME
done

#utility
sudo pacman -S zip
sudo pacman -S unzip
sudo pacman -S pavucontrol

#software
sudo pacman -S rofi
sudo pacman -S fish
sudo pacman -S kitty
sudo pacman -S polybar
sudo pacman -S qtile
sudo pacman -S feh
sudo pacman -S nodejs npm
sudo pacman -S lf

#neovim
sudo pacman -S neovim
sudo pacman -S python-pip
pip3 install --user --upgrade neovim


#chmod
sudo chmod +x ./config/polybar/launch.sh


#file xinit
ln -s $SCRIPTPATH/.xinitrc ~/
echo "symlink folder xinitrc to ~/"

#font 
sudo cp -r ./font /usr/share/fonts/
fc-cache -v -f


