from flask import Flask, request, jsonify
import socket

app = Flask(__name__)

def format_receipt(data):
    # Extracting data from n8n request
    order_id = data.get('order_id', 'N/A')
    customer_name = data.get('customer_name', 'Guest')
    customer_phone = data.get('customer_phone', 'N/A')
    items = data.get('items', []) # Expected to be a list of dicts
    total_price = data.get('total_price', '0.00')

    # Building the Receipt String
    receipt =  "      SEVERIN PLUS RESTAURANT\n"
    receipt += "    Location: TF Hostel, UG\n"
    receipt += "       Tel: 0246320684\n"
    receipt += "--------------------------------\n"
    receipt += f"ORDER ID: #{order_id}\n"
    receipt += f"NAME: {customer_name}\n"
    receipt += f"TEL: {customer_phone}\n"
    receipt += "--------------------------------\n"
    receipt += "ITEM            QTY        PRICE\n"
    
    for item in items:
        name = item.get('name', 'Item')[:15] # Truncate long names
        qty = item.get('qty', '1')
        price = item.get('price', '0.00')
        receipt += f"{name:<16}{qty:<11}{price}\n"

    receipt += "--------------------------------\n"
    receipt += f"TOTAL: GHS {total_price}\n"
    receipt += "--------------------------------\n"
    receipt += "           THANK YOU\n"
    receipt += "     Powered by Thoth AI\n"
    receipt += "        0987654rwq\n\n\n\n"
    return receipt

@app.route('/print', methods=['POST'])
def print_order():
    data = request.get_json()
    if not data:
        return jsonify({"status": "error"}), 400
    
    formatted_text = format_receipt(data)
    
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(5)
            s.connect(('127.0.0.1', 9100))
            s.sendall(formatted_text.encode('utf-8'))
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5555)
