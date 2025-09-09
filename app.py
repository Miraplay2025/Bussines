from flask import Flask, render_template, jsonify, request
import subprocess
import requests
import os
import time

app = Flask(__name__)

# Inicia o WPPConnect Server automaticamente
if not os.path.exists("wppconnect_running"):
    subprocess.Popen(["node", "wppconnect.js"])
    with open("wppconnect_running", "w") as f:
        f.write("running")
    time.sleep(5)  # espera o servidor iniciar

WPPCONNECT_SERVER = "http://localhost:21465"
SESSION_NAME = "meu_session"

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/qr', methods=['GET'])
def get_qr():
    try:
        res = requests.get(f"{WPPCONNECT_SERVER}/v1/{SESSION_NAME}/qrcode")
        data = res.json()
        if "qr" in data:
            return jsonify({"qr": data["qr"]})
        return jsonify({"error": "QR Code não disponível"})
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/send_message', methods=['POST'])
def send_message():
    phone = request.form.get('phone')
    message = request.form.get('message')
    payload = {"phone": phone, "message": message}
    try:
        res = requests.post(f"{WPPCONNECT_SERVER}/v1/{SESSION_NAME}/send-message", json=payload)
        return jsonify(res.json())
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
