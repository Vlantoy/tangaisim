import os
import sys
import time
import socket
import threading
import logging
import webview
from app import app

def find_free_port(start_port=5050):
    for port in range(start_port, start_port + 50):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
    return start_port

PORT = find_free_port(5050)

def start_server():
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)
    app.run(host='127.0.0.1', port=PORT, debug=False, use_reloader=False)

def on_closed():
    # Clean exit when user closes window
    os._exit(0)

def main():
    # Start Flask server in background thread
    t = threading.Thread(target=start_server, daemon=True)
    t.start()
    time.sleep(0.5)

    # Create native desktop window
    window = webview.create_window(
        title='Bumble Dating Simulator - TANGAISIM',
        url=f'http://127.0.0.1:{PORT}',
        width=1340,
        height=900,
        min_size=(950, 700),
        background_color='#07090E',
        text_select=False
    )
    window.events.closed += on_closed

    # Start webview GUI loop
    webview.start(private_mode=False)

if __name__ == '__main__':
    main()
