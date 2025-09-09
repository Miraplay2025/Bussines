
from flask import Flask, render_template, request, jsonify
import requests
import subprocess
import os
import time

app = Flask(__name__)

# Configurações
WPP_URL = os.getenv("WPP_URL", "http://localhost:21465")
SESSION = os.getenv("SESSION_NAME", "minha_sessao")

# Inicializa WppConnect Server (Node.js)
def start_wppconnect():
    try:
        subprocess.Popen([
            "npx", "@wppconnect-team/wppconnect-server",
            "--puppeteerOptions.headless", "true",
            "--puppeteerOptions.args", "[--no-sandbox,--disable-setuid-sandbox]"
        ])
        print("✅ WppConnect Server iniciado...")
        time.sleep(5)  # dá tempo para iniciar
    except Exception as e:
        print("❌ Erro ao iniciar WppConnect:", str(e))

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/get_qr", methods=["GET"])
def get_qr():
    try:
        response = requests.post(f"{WPP_URL}/api/{SESSION}/start-session")
        data = response.json()
        if "qrcode" in data:
            return jsonify({"status": "qrcode", "qr": data["qrcode"]})
        elif data.get("status") == "CONNECTED":
            return jsonify({"status": "connected"})
        else:
            return jsonify({"status": "waiting"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route("/send_message", methods=["POST"])
def send_message():
    number = request.form.get("number")
    message = request.form.get("message")

    payload = {"phone": number, "message": message}
    try:
        response = requests.post(f"{WPP_URL}/api/{SESSION}/send-message", json=payload)
        return jsonify(response.json())
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == "__main__":
    start_wppconnect()
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
