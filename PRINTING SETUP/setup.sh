#!/bin/bash

echo "Starting Installation for Restaurant Automation..."

# Update and install dependencies
pkg update -y && pkg upgrade -y
pkg install python openssh -y
pip install flask

echo "------------------------------------------------"
echo "INSTALLATION COMPLETE"
echo "To start the bridge: python kitchen_bridge.py"
echo "------------------------------------------------"
