# Moss Hill Golf Club - README

This project hosts a  Python web server to track and display golf scores.

## Prerequisites

- **Python 3** installed on the Raspberry Pi.
- The following files present in the project directory:
  - `server.py`
  - `scores.txt` (the file where scores are stored)
  - The HTML/CSS/JS files (e.g. `index.html`, `data.html`, etc.)

## 1. Starting the Server

1. **SSH into the Raspberry Pi** (or log in directly) and navigate to the project folder. For example:

   ```bash
   cd /home/pi/moss-hill-golf
   ```

2. **Run the server** with:

   ```bash
   python3 server.py
   ```

3. You should see a message like:

   ```
   Starting server at http://0.0.0.0:3001
   ```

4. **Open a browser** on the Pi itself or any device on the same network, and go to:

   ```
   http://<RaspberryPiIP>:3001
   ```

   Replace `<RaspberryPiIP>` with your Pi’s local IP address (e.g. `192.168.x.x`).

## 2. Editing the `scores.txt` File

If you need to manually edit the raw scores, follow these steps:

1. **SSH into the Raspberry Pi** (or log in directly) and navigate to the project folder:

   ```bash
   cd /home/pi/moss-hill-golf
   ```

2. **Open the `scores.txt` file** in a text editor (for example, `nano`):

   ```bash
   nano scores.txt
   ```

3. **Make your changes**. Each line in `scores.txt` typically looks like this:
   ```
   YYYY-MM-DD HH:MM:SS,hole1,hole2,...,hole9,PlayerName
   ```
   - **Example**:
     ```
     2025-03-01 12:34:56,2,3,4,3,5,2,4,3,4,Reese
     ```
   - Modify or remove lines as needed, then **save** your changes.

4. **Restart the server** to load the updated data:

   ```bash
   # Stop the running server (Ctrl + C if running in the current shell)
   python3 server.py
   ```

---

**Note:** You can also edit scores from the web UI if you have set up the admin password and the `edit.html` page, but direct editing of `scores.txt` is sometimes easier for bulk changes or quick fixes. As of this commit, direct editing through the `edit.html` webpage is not fucntional.

## 3. Additional Notes

- **Port**: By default, the server listens on port `3001`. You can change this in `server.py` if needed.  
- **Firewall/Port Forwarding**: If you want to access the server from outside your local network, configure your router/firewall to forward port `3001` to the Pi.  
- **Admin Password**: If you use the admin features (like `edit.html`), remember to change the default `ADMIN_PASSWORD` in `server.py`.