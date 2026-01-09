from flask import Flask, request, jsonify
import socket
from datetime import datetime

app = Flask(__name__)
PRINTER_IP, PRINTER_PORT = '127.0.0.1', 9100

def send_to_printer(text):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(5)
            s.connect((PRINTER_IP, PRINTER_PORT))
            s.sendall(text.encode('utf-8'))
            s.sendall(b"\n\n\n\n") # Extra feed for easy tearing
            return True
    except Exception as e:
        print(f"Printer Error: {e}")
        return False

@app.route('/print', methods=['POST'])
def print_order():
    data = request.json
    if not data:
        return jsonify({"error": "No data"}), 400

    now = datetime.now().strftime("%d/%m/%Y %H:%M")
    
    # 1. HEADER
    receipt =  "================================\n"
    receipt += f"      ORDER #{data.get('orderId', '???')}      \n"
    receipt += f"      {now}             \n"
    receipt += "================================\n\n"

    # 2. CUSTOMER INFO
    receipt += f"CUSTOMER: {data.get('customerName', 'Guest')}\n"
    receipt += f"PHONE:    {data.get('phone', 'N/A')}\n"
    receipt += f"ZONE:     {data.get('deliveryZone', 'N/A')}\n"
    receipt += f"TYPE:     {data.get('deliveryOption', 'N/A')}\n"
    receipt += "--------------------------------\n"

    # 3. THE ITEM (Main Focus)
    receipt += "ITEMS:\n"
    item_str = f"{data.get('items', 'No items')}"
    qty = data.get('quantity', 1)
    receipt += f" > {item_str} x{qty}\n"
    receipt += "--------------------------------\n"

    # 4. PAYMENT
    receipt += f"TOTAL AMOUNT: GHS {data.get('amount', '0.00')}\n"
    receipt += "================================\n"
    
    # 5. DYNAMIC ADD-ONS (If you add extra fields in n8n later, they appear here)
    known_keys = ['orderId', 'customerName', 'phone', 'items', 'quantity', 'deliveryOption', 'amount', 'deliveryZone']
    extras = {k: v for k, v in data.items() if k not in known_keys}
    if extras:
        receipt += "\nADDITIONAL INFO:\n"
        for k, v in extras.items():
            receipt += f"{k}: {v}\n"

    if send_to_printer(receipt):
        return jsonify({"status": "success"}), 200
    return jsonify({"status": "error"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5555)
