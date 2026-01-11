#!/bin/bash

# CUSTOM_NAME is the permanent URL you want
CUSTOM_NAME="thothaikitchenprinter"

if [ -n "$PINGGY_TOKEN" ]; then
    echo "✅ Using Pro Token from environment..."
    # 1. Added +force to the username to kick out ghost sessions
    # 2. Added +key to ensure it uses the token for auth
    # 3. Added ServerAliveCountMax for better stability
    PINGGY_COMMAND="ssh -p 443 -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o StrictHostKeyChecking=no -R0:localhost:5555 ${PINGGY_TOKEN}+${CUSTOM_NAME}+key+force@pro.pinggy.io"
else
    echo "⚠️ No token found in environment. Starting FREE version..."
    PINGGY_COMMAND="ssh -p 443 -o ServerAliveInterval=30 -R0:localhost:5555 qr@a.pinggy.io"
fi

while true; do
    echo "🚀 [$(date)] Starting Pinggy Tunnel..."
    
    # The 'echo "" |' part is the magic that "presses Enter" for you automatically
    echo "" | $PINGGY_COMMAND
    
    echo "❌ Tunnel lost. Reconnecting in 5 seconds..."
    sleep 5
done
