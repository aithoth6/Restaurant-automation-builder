Tablet Setup Manual (From Scratch)
This guide explains how to turn a fresh Android tablet into a professional kitchen printer bridge.

🛠️ Phase 1: The Initial Installation
Once you install Termux

1. Update the System
Bash

pkg update && pkg upgrade -y
2. Install Git and Python
Bash

pkg install git python -y
3. "Clone" the Project (The First Time Only)
"Cloning" creates a folder on your tablet that is an exact copy of your GitHub. Replace YOUR_USERNAME with your actual name.

Bash

git clone https://github.com/YOUR_USERNAME/Restaurant-automation-builder.git
🏗️ Phase 2: Building the Environment
Now that the files are on your tablet, you need to "build" the office.

1. Enter the Folder
Bash

cd Restaurant-automation-builder
2. Give Permission to the Scripts
Bash

chmod +x *.sh
3. Run the Setup Script
This script installs Flask and other tools needed for the printer to work.

Bash

./setup.sh
📡 Phase 3: The Daily Routine
Every morning, or if the tablet restarts, you must start the "Receptionist" (Python) and the "Bridge" (Tunnel).

Session 1: Start the Printer Brain
Bash

python kitchen_bridge.py
Session 2: Start the Tunnel
(Swipe from the left of the screen, click "New Session")

Bash

./start_tunnel.sh
🔄 Phase 4: Managing Changes (Pull & Push)
This is how you keep your tablet in sync with your GitHub.

Updating the Tablet (Git Pull)
If you change the receipt design or the code on GitHub using your computer, you don't need to delete anything. Just go to the folder and type:

Bash

git pull origin main
This "pulls" the new code from the cloud down to your tablet.

Sending Tablet Changes to GitHub (Git Push)
If you change a file on the tablet and want to save it to GitHub:

git add . (Gather all changes)

git commit -m "Updated receipt design" (Label the change)

git push origin main (Send it to the cloud)

🔒 Security: Protecting your Paid Token
If you buy Pinggy Pro, do NOT put the token on GitHub. Instead, run this command on the tablet only:

Bash

echo "YOUR_SECRET_TOKEN_HERE" > pinggy_token
