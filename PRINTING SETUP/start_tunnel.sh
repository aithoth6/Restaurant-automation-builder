#!/bin/bash

# This script looks for a file named 'pinggy_token' on the tablet.
# If it doesn't find it, it defaults to the Free version.

TOKEN_FILE="pinggy_token"

if [ -f "$TOKEN_FILE" ]; then
    TOKEN=$(cat $TOKEN_FILE)
    echo "Using Paid Token from $TOKEN_FILE..."
    PINGGY_COMMAND="ssh -p 443 -o ServerAliveInterval=30 -R0:localhost:5555 ${TOKEN}+qr@pro.pinggy.io"
else
    echo "No token found. Starting FREE version..."
    PINGGY_COMMAND="ssh -p 443 -o ServerAliveInterval=30 -R0:localhost:5555 qr@a.pinggy.io"
fi

while true; do
    $PINGGY_COMMAND
    echo "Tunnel lost. Reconnecting in 5 seconds..."
    sleep 5
done
