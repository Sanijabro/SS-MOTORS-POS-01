# SS Motors POS Suite - Windows PC Local Installation Guide

This guide details how to install and run the **SS Motors POS & Inventory Management Suite** locally on your Windows computer. This runs the application fully full-stack (React Frontend + Express Backend) on your local machine with automatic database/offline mechanics.

---

## 1. Quick Operator Login Reference

Use these pre-configured login profiles once the application boots up.

| Operator Role | Display Name | Username | Password |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Rohan (Admin) | `rohan_admin` | `admin@ssmotors` |
| **Store Manager** | Bandara (Manager) | `bandara_manager` | `manager@ssmotors` |
| **Cashier** | Chinthaka (Cashier) | `chinthaka_cashier` | `cashier@ssmotors` |

---

## 2. Prerequisites (One-Time Setup)

To run the application locally, you need to install **Node.js**:

1. **Download Node.js**:
   - Go to [https://nodejs.org/](https://nodejs.org/)
   - Download the recommended **LTS (Long Term Support)** installer for Windows.
2. **Install Node.js**:
   - Run the downloaded installer (e.g., `node-v20.xx.x-x64.msi`).
   - Leave all options default and click **Next** until finished.
3. **Verify Installation**:
   - Open **Command Prompt** (press `Windows Key + R`, type `cmd`, and press Enter).
   - Type `node -v` and press Enter. It should output a version number (like `v20.12.0`).

---

## 3. Direct One-Click Installation

To make setting up and running the application completely effortless, we have created a manual automation script `setup_windows.bat` at the project root.

1. Locate the **`setup_windows.bat`** file in your downloaded/extracted project folder.
2. **Double-click `setup_windows.bat`**.
3. The script will automatically:
   - Check if Node.js is installed.
   - Install all package dependencies (`npm install`).
   - Create your local security environment configuration file (`.env`).
   - Launch the development server in a few seconds.
4. Once completed, keep the command line window open. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

---

## 4. Manual Installation (Alternative)

If you prefer to run the setup manually without using the automation script, follow these commands in your Command Prompt inside the project's root folder:

### Step A: Install Dependencies
Run this command to download and install all the necessary node modules:
```bash
npm install
```

### Step B: Setup Environment Parameters
Create a copy of `.env.example` and name it `.env` in the same directory:
```cmd
copy .env.example .env
```
*(Optional: Open `.env` in Notepad and add your own specific `GEMINI_API_KEY` to enable the server-side AI spare-parts querying mechanics).*

### Step C: Run in Production Mode (Recommended)
This compiles the application assets to run fast, secure, and fully responsive:
```bash
npm run build
npm start
```

### Step D: Run in Developer Mode (Alternative)
If you want to make live adjustments or debug code:
```bash
npm run dev
```

---

## 5. Network Access (Sharing POS with other Devices)

You can access this POS system from tablet devices, barcode handsets, or secondary cashier PCs on the same Wi-Fi connection!

1. Open **Command Prompt** on your main host PC and type `ipconfig`.
2. Locate your **IPv4 Address** (usually starts with `192.168.x.x`).
3. On your secondary cashier device or tablet, open the browser and type:
   ```text
   http://<YOUR_IP_ADDRESS>:3000
   ```
   *(For example: `http://192.168.1.50:3000`)*
