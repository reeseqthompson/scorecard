#!/usr/bin/env python3
import http.server
import urllib.parse
import os
from datetime import datetime

HOST = '0.0.0.0'
PORT = 3001
DATA_FILE = 'scores.txt'

class SimpleRequestHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(parsed_path.query)

        action = query.get('action', [''])[0]

        if action == 'get_recent_scores':
            scores = self.get_recent_scores()
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            # `scores` is a list of lines from the data file
            # Just return them as-is (already CSV lines)
            for line in scores:
                self.wfile.write(line.encode())
            return
        elif action == 'get_averages':
            player = query.get('player', [''])[0]
            averages = self.calculate_averages(player)
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            # averages is a list of 9 floats
            for avg in averages:
                self.wfile.write(f"{avg}\n".encode())
            return
        if action == 'get_leaderboard':
            leaderboard = self.get_leaderboard()
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            for line in leaderboard:
                self.wfile.write(line.encode())
            return
        else:
            # Serve static files
            if parsed_path.path == '/':
                file_path = 'index.html'
            else:
                file_path = parsed_path.path.strip('/')

            if os.path.isfile(file_path):
                self.send_response(200)
                if file_path.endswith('.html'):
                    self.send_header('Content-Type', 'text/html')
                elif file_path.endswith('.css'):
                    self.send_header('Content-Type', 'text/css')
                elif file_path.endswith('.js'):
                    self.send_header('Content-Type', 'application/javascript')
                else:
                    self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                with open(file_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_error(404, "File not found")

    def do_POST(self):
        length = int(self.headers.get('Content-Length'))
        post_data = self.rfile.read(length)
        form_data = urllib.parse.parse_qs(post_data.decode('utf-8'))

        playerName = form_data.get('playerName', [''])[0].strip()
        holes = []
        for i in range(1, 10):
            val = form_data.get(f'hole{i}', [''])[0].strip()
            if not val.isdigit():
                self.send_error_response()
                return
            score = int(val)
            if score < 1 or score > 5:
                self.send_error_response()
                return
            holes.append(score)

        if not playerName or len(holes) != 9:
            self.send_error_response()
            return

        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        line = f"{now},{','.join(map(str, holes))},{playerName}\n"
        with open(DATA_FILE, 'a') as f:
            f.write(line)

        self.send_response(200)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(b"success")

    def send_error_response(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(b"error")

    def get_recent_scores(self):
        if not os.path.exists(DATA_FILE):
            return []
        with open(DATA_FILE, 'r') as f:
            lines = f.readlines()
            # lines = lines[-5:]
        return lines
    
    def get_leaderboard(self):
        if not os.path.exists(DATA_FILE):
            return []
        with open(DATA_FILE, 'r') as f:
            lines = f.readlines()

        scores = []
        for line in lines:
            parts = line.strip().split(',')
            if len(parts) < 11:
                continue
            datetime_str = parts[0]
            holes = parts[1:10]
            player = parts[10]
            total_score = sum(int(h) for h in holes)
            scores.append((total_score, datetime_str, holes, player))

        # Sort by total score (ascending) and take top 5
        scores.sort(key=lambda x: x[0])
        top_5 = scores[:5]

        leaderboard = []
        for total, datetime_str, holes, player in top_5:
            line = f"{datetime_str},{','.join(holes)},{total},{player}\n"
            leaderboard.append(line)
        return leaderboard


    def calculate_averages(self, player_filter=''):
        if not os.path.exists(DATA_FILE):
            return [0]*9
        with open(DATA_FILE, 'r') as f:
            lines = f.readlines()

        filtered_scores = []
        for line in lines:
            line = line.strip()
            if not line:
                continue
            parts = line.split(',')
            # parts: [datetime, hole1, hole2, ..., hole9, player]
            if len(parts) < 11:
                continue
            dt = parts[0]
            holes = parts[1:10]
            player = parts[10]
            if player_filter and player.lower() != player_filter.lower():
                continue
            holes_int = [int(h) for h in holes]
            filtered_scores.append(holes_int)

        if not filtered_scores:
            return [0]*9

        hole_count = len(filtered_scores)
        sums = [0]*9
        for sc in filtered_scores:
            for i, val in enumerate(sc):
                sums[i] += val
        averages = [s / hole_count for s in sums]
        return averages


def run_server():
    server_address = (HOST, PORT)
    httpd = http.server.HTTPServer(server_address, SimpleRequestHandler)
    print(f"Starting server at http://{HOST}:{PORT}")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
