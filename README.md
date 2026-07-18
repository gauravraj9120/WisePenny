# 🪙 WisePenny — AI-Powered Expense Tracker

WisePenny is a premium, glassmorphic AI-powered budget monitoring and receipt parsing application. It uses optical character recognition (OCR) and intelligence fallback classification to extract, tag, and track monthly expenses, offering automatic budget threshold warning emails.

---

## 🚀 Features

- **Glassmorphic Premium UI**: Stunning dark-mode dashboard tailored with Outfit and Inter fonts, responsive grids, and glowing micro-animations.
- **AI OCR Receipt Scanner**: Drop or upload a receipt (`PNG`, `JPG`, `JPEG`). The system processes it locally using **Tesseract.js** to extract structural text, dates, and transaction totals.
- **Intelligent Fallback Classifier**: Integrates with the Google **Gemini 1.5 Flash API** for parsing receipt metadata. If no API key is specified, it gracefully falls back to a robust local regex-based merchant and category classifier.
- **Budget Goal Settings**: Update monthly limits, adjust threshold levels (e.g., alert at 80% usage), and specify target alert emails.
- **Automated Mailer Alerts**: Automatically triggers alerts and displays email logs with sandbox mail previews via **Nodemailer** (utilizing custom SMTP or generating dynamic Ethereal test server accounts).

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Modern Custom Vanilla CSS (with radial glowing backgrounds and glassmorphism styling tokens)

### Backend
- **Server**: Node.js & Express.js
- **OCR Engine**: Tesseract.js
- **Integration**: Google Gemini AI API
- **Mailing**: Nodemailer
- **Database**: Local JSON file storage (`backend/data/db.json`)

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory. Use the structure below as a template:

```env
PORT=5000

# Leave GEMINI_API_KEY empty to use the built-in smart regex classifier fallback.
# For full AI-powered categorization and receipt details parsing, provide a Gemini API key:
GEMINI_API_KEY=your_gemini_api_key_here

# SMTP Server Configurations (Ethereal test SMTP is used by default if these are not provided)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=wisepenny-alerts@example.com
SMTP_TO=user@example.com
```

---

## 💻 Local Setup & Installation

### Prerequisites
- Node.js (v18+)

### Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/gauravraj9120/WisePenny.git
   cd WisePenny
   ```

2. **Run Dependency Setup**:
   This installs standard npm modules in both the frontend and backend folders.
   ```bash
   npm run setup
   ```

3. **Start Application Servers**:
   This runs the Vite dev server and Express backend parallelly.
   ```bash
   npm start
   ```

4. **Open in Browser**:
   Navigate to **[http://localhost:5173](http://localhost:5173)** to access the dashboard.
