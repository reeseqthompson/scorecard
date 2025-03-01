#!/usr/bin/env python3
import http.server
import urllib.parse
import os
from datetime import datetime

HOST = '0.0.0.0'
PORT = 3001
DATA_FILE = 'scores.txt'
ADMIN_PASSWORD = 'password'  # The required password for edit/delete

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
            for line in scores:
                self.wfile.write(line.encode())
            return

        elif action == 'get_leaderboard':
            leaderboard = self.get_leaderboard()
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            for line in leaderboard:
                self.wfile.write(line.encode())
            return

        elif action == 'get_averages':
            player = query.get('player', [''])[0]
            averages = self.calculate_averages(player)
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            for avg in averages:
                self.wfile.write(f"{avg}\n".encode())
            return

        elif action == 'get_all_scores':
            """ Return the entire scores file for editing (password-protected). """
            # Check password
            password = query.get('password', [''])[0]
            if password != ADMIN_PASSWORD:
                self.send_error(403, "Forbidden: Incorrect password")
                return

            if not os.path.exists(DATA_FILE):
                self.send_response(200)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                return

            with open(DATA_FILE, 'r') as f:
                lines = [line for line in f.readlines() if line.strip()]


            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            for line in lines:
                self.wfile.write(line.encode())
            return

        else:
            # Serve static files (including edit_scores.html if requested)
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
        length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(length)
        form_data = urllib.parse.parse_qs(post_data.decode('utf-8'))
        action = form_data.get('action', [''])[0]

        if action == 'submit_score':
            # Original "Submit Score" code
            playerName = form_data.get('playerName', [''])[0].strip()
            holes = []
            for i in range(1, 10):
                val = form_data.get(f'hole{i}', [''])[0].strip()
                if not val.isdigit():
                    return self.send_error_response()
                score = int(val)
                if score < 1 or score > 5:
                    return self.send_error_response()
                holes.append(score)

            if not playerName or len(holes) != 9:
                return self.send_error_response()

            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            line = f"{now},{','.join(map(str, holes))},{playerName}\n"
            with open(DATA_FILE, 'a') as f:
                f.write(line)

            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(b"success")
            return

        elif action == 'update_score':
            """ Update a specific line in the scores file (password-protected). """
            password = form_data.get('password', [''])[0]
            if password != ADMIN_PASSWORD:
                return self.forbidden_response()

            line_index_str = form_data.get('line_index', [''])[0]
            datetime_str = form_data.get('datetime', [''])[0]
            holes_str = form_data.get('holes', [''])[0]
            player = form_data.get('player', [''])[0]

            try:
                line_index = int(line_index_str)
            except ValueError:
                return self.send_error_response()

            # Validate holes
            hole_list = holes_str.split(',')
            if len(hole_list) != 9:
                return self.send_error_response()

            # All must be numeric and between 1..5
            for h in hole_list:
                if not h.isdigit():
                    return self.send_error_response()
                if int(h) < 1 or int(h) > 5:
                    return self.send_error_response()

            # We'll read the file, replace that line with the new data
            if not os.path.exists(DATA_FILE):
                return self.send_error_response()

            with open(DATA_FILE, 'r') as f:
                lines = [line for line in f.readlines() if line.strip()]


            if line_index < 0 or line_index >= len(lines):
                return self.send_error_response()

            new_line = f"{datetime_str},{','.join(hole_list)},{player}\n"
            lines[line_index] = new_line

            with open(DATA_FILE, 'w') as f:
                f.writelines(lines)

            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(b"success")
            return

        elif action == 'delete_score':
            """ Delete a specific line in the scores file (password-protected). """
            password = form_data.get('password', [''])[0]
            if password != ADMIN_PASSWORD:
                return self.forbidden_response()

            line_index_str = form_data.get('line_index', [''])[0]
            try:
                line_index = int(line_index_str)
            except ValueError:
                return self.send_error_response()

            if not os.path.exists(DATA_FILE):
                return self.send_error_response()

            with open(DATA_FILE, 'r') as f:
                lines = [line for line in f.readlines() if line.strip()]


            if line_index < 0 or line_index >= len(lines):
                return self.send_error_response()

            # Remove that line
            del lines[line_index]

            with open(DATA_FILE, 'w') as f:
                f.writelines(lines)

            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(b"success")
            return

        else:
            # If no recognized action, fall back to the original score submission logic
            # (for backward compatibility).
            # Or just do the default error:
            return self.send_error_response()

    def send_error_response(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(b"error")

    def forbidden_response(self):
        self.send_response(403)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(b"Forbidden: Incorrect password")

    def get_recent_scores(self):
        if not os.path.exists(DATA_FILE):
            return []
        with open(DATA_FILE, 'r') as f:
            lines = [line for line in f.readlines() if line.strip()]

        return lines

    def get_leaderboard(self):
        if not os.path.exists(DATA_FILE):
            return []
        with open(DATA_FILE, 'r') as f:
            lines = [line for line in f.readlines() if line.strip()]


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

        scores.sort(key=lambda x: x[0])  # ascending by total score
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
            lines = [line for line in f.readlines() if line.strip()]


        filtered_scores = []
        for line in lines:
            line = line.strip()
            if not line:
                continue
            parts = line.split(',')
            if len(parts) < 11:
                continue
            holes = parts[1:10]
            player = parts[10]
            if player_filter and player.lower() != player_filter.lower():
                continue
            holes_int = [int(h) for h in holes]
            filtered_scores.append(holes_int)

        if not filtered_scores:
            return [0]*9

        sums = [0]*9
        for sc in filtered_scores:
            for i, val in enumerate(sc):
                sums[i] += val

        count = len(filtered_scores)
        averages = [s / count for s in sums]
        return averages

def run_server():
    server_address = (HOST, PORT)
    httpd = http.server.HTTPServer(server_address, SimpleRequestHandler)
    print(f"Starting server at http://{HOST}:{PORT}")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
