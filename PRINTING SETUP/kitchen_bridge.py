from flask import Flask, request, jsonify
import socket

app = Flask(__name__)
PRINTER_IP, PRINTER_PORT = '127.0.0.1', 9100

def send_to_printer(text):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            # OPTIMIZATION: Send data immediately without buffering
            s.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            s.settimeout(1.0) 
            s.connect((PRINTER_IP, PRINTER_PORT))
            s.sendall(text.encode('utf-8'))
            s.sendall(b"\n\n\n") 
            return True
    except Exception as e:
        print(f"Printer Error: {e}")
        return False

@app.route('/print', methods=['POST'])
def print_order():
    data = request.json
    if not data: return jsonify({"status": "error"}), 400

    # Building the string in one go is faster than multiple += lines
    receipt = (
        "================================\n"
        f"      ORDER #{data.get('orderId', '???')}\n"
        "================================\n"
        f"CUST: {data.get('customerName', 'Guest')}\n"
        f"TEL:  {data.get('phone', 'N/A')}\n"
        "--------------------------------\n"
        f"ITEM: {data.get('items', 'No items')}\n"
        f"QTY:  {data.get('quantity', 1)}\n"
        "--------------------------------\n"
        f"ZONE: {data.get('deliveryZone', 'N/A')}\n"
        f"TOTAL: GHS {data.get('amount', '0.00')}\n"
        "================================\n"
    )
    
    if send_to_printer(receipt):
        return jsonify({"status": "success"}), 200
    return jsonify({"status": "error"}), 500

if __name__ == '__main__':
    # Use threaded=True to handle requests faster
    app.run(host='0.0.0.0', port=5555, threaded=True)
