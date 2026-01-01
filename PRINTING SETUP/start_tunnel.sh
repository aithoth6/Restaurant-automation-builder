#!/bin/bash

# --- CONFIGURATION ---
PORT=5555
# If you get Pinggy Pro, replace 'qr@a.pinggy.io' with your 'token+qr@pro.pinggy.io'
PINGGY_COMMAND="ssh -p 443 -o ServerAliveInterval=30 -R0:localhost:$PORT qr@a.pinggy.io"

echo "------------------------------------------------"
echo "  STARTING PINGGY TUNNEL (Auto-Restart Enabled) "
echo "  Local Port: $PORT                             "
echo "------------------------------------------------"

# This loop restarts the tunnel automatically if it drops
while true; do
    echo "Connecting to Pinggy..."
    $PINGGY_COMMAND
    echo "Tunnel connection lost. Restarting in 5 seconds..."
    sleep 5
done
