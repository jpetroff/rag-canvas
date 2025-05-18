#!/usr/bin/env bash
sudo apt-get update
sudo apt-get install fzf bat ripgrep build-essential cmake perl pkg-config libclang-dev musl-tools git -y
sudo ln -s /usr/bin/batcat /usr/bin/bat

# pip install -r ${PWD}/app/requirements.txt

cd ${PWD}/web
yarn install