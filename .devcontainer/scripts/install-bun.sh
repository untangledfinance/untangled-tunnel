#!/bin/bash

sudo apt-get update
sudo apt-get install curl unzip -y
sudo apt-get clean
curl -fsSL https://bun.sh/install | bash