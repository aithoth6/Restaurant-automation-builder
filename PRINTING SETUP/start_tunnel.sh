#!/bin/bash

# 1. Configuration
CUSTOM_NAME="thothaikitchenprinter"

# 2. FORCE-LOAD THE TOKEN
# This ensures that even if you just opened Termux, the token is pulled from .bashrc
if [ -z "$PINGGY_TOKEN" ]; then
    source $HOME/.bashrc
fi

# 3. VERIFY TOKEN (Safety Check)
if [ -z "$PINGGY_TOKEN" ]; then
    echo "❌ ERROR: Token not found in .bashrc. Cannot start Pro tunnel."
    exit 1
fi

# 4. DEFINE THE COMMAND WITH AGGRESSION FLAGS
# +key: forces token authentication
# +force: kicks out any existing "ghost" sessions immediately
PINGGY_COMMAND="ssh -p 443 -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o StrictHostKeyChecking=no -R0:localhost:5555 ${PINGGY_TOKEN}+${CUSTOM_NAME}+key+force@pro.pinggy.io"

while true; do
    echo "🚀 [$(date)] Starting Super-Aggressive Tunnel..."
    
    # THE "INFINITE ENTER" UPGRADE:
    # 'yes ""' continuously sends Enter keys. 
    # Whether it asks 1 time or 5 times, this will bypass it.
    yes "" | $PINGGY_COMMAND
    
    echo "⚠️ Connection lost or ghost kicked. Retrying in 5 seconds..."
    sleep 5
done
