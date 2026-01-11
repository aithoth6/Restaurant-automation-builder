#!/bin/bash

# 1. Configuration
CUSTOM_NAME="thothaikitchenprinter"

# 2. FORCE-LOAD THE TOKEN
# This fixes the problem where Termux "forgets" your token after a restart.
if [ -z "$PINGGY_TOKEN" ]; then
    source $HOME/.bashrc
fi

# 3. VERIFY TOKEN (Safety Check)
if [ -z "$PINGGY_TOKEN" ]; then
    echo "❌ ERROR: Token not found in .bashrc. Cannot start Pro tunnel."
    exit 1
fi

# 4. DEFINE THE COMMAND WITH AGGRESSION FLAGS
# +key: tells it to use your token
# +force: KILLS the "ghost" connection so you don't get 'already active' errors
PINGGY_COMMAND="ssh -p 443 -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o StrictHostKeyChecking=no -R0:localhost:5555 ${PINGGY_TOKEN}+${CUSTOM_NAME}+key+force@pro.pinggy.io"

while true; do
    echo "🚀 [$(date)] Starting Aggressive Tunnel..."
    
    # THE MAGIC FIX: 
    # 'echo "" |' automatically presses ENTER for you if it asks for a password.
    echo "" | $PINGGY_COMMAND
    
    echo "⚠️ Connection lost or ghost kicked. Retrying in 5 seconds..."
    sleep 5
done
