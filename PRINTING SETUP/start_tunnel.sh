
#!/bin/bash

# CUSTOM_NAME is the permanent URL you want (e.g., ghana-kitchen)
CUSTOM_NAME="thothaikitchenprinter"

if [ -n "$PINGGY_TOKEN" ]; then
    echo "✅ Using Pro Token from environment..."
    # We use the token + your custom name for a permanent URL
    PINGGY_COMMAND="ssh -p 443 -o ServerAliveInterval=30 -o StrictHostKeyChecking=no -R0:localhost:5555 ${PINGGY_TOKEN}+${CUSTOM_NAME}@pro.pinggy.io"
else
    echo "⚠️ No token found in environment. Starting FREE version..."
    PINGGY_COMMAND="ssh -p 443 -o ServerAliveInterval=30 -R0:localhost:5555 qr@a.pinggy.io"
fi

while true; do
    echo "🚀 Starting Pinggy Tunnel..."
    $PINGGY_COMMAND
    echo "❌ Tunnel lost. Reconnecting in 5 seconds..."
    sleep 5
done
