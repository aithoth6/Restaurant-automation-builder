from flask import Flask, request, jsonify
import socket

app = Flask(__name__)

@app.route('/print', methods=['POST'])
def print_order():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({"status": "error", "message": "No data received"}), 400
    
    # Extract order text
    order_content = data['text']
    
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(5)
            s.connect(('127.0.0.1', 9100))
            
            # Print the main content
            s.sendall(order_content.encode('utf-8'))
            
            # Automatic spacing at the end so it's easy to tear
            s.sendall(b"\n\n\n\n") 
            
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    print("---------------------------------")
    print("  RESTAURANT AUTOMATION ACTIVE   ")
    print("  LISTENING FOR ORDERS...        ")
    print("---------------------------------")
    app.run(host='0.0.0.0', port=5555)
