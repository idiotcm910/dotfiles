#!/bin/sh
SCRIPT=`realpath $0`
SCRIPTPATH=`dirname $SCRIPT`

for f in */ ; do
	NAME=`basename $f`
	echo "symlink folder $NAME to ~/.config"
	ln -s $SCRIPTPATH/$f ~/.config/$NAME
done


