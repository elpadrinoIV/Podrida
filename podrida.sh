#!/bin/bash

PODRIDA_HOME=/home/nicolasdascanio/Podrida

cd $PODRIDA_HOME

cat index.js | grep player.Player | grep -v '//'

node index.js
