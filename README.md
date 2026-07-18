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
GEMINI_API_KEY=your_gemini_api_key_here

# (Optional) Set an API Key to secure external API access. 
# Leave empty to run in open developer mode.
WISEPENNY_API_KEY=your_custom_secure_api_key_here

# SMTP Server Configurations (Ethereal test SMTP is used by default if these are not provided)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=wisepenny-alerts@example.com
SMTP_TO=user@example.com
```

---

## 🔒 API Key Authentication

When `WISEPENNY_API_KEY` is defined in the environment, all third-party external requests (e.g. from curl, external servers, scripts) to the backend API endpoints (`/api/*`) are secured. 

To call the API from an external client, pass the key via the `x-api-key` header:

```bash
curl -X GET http://localhost:5000/api/expenses \
  -H "x-api-key: your_custom_secure_api_key_here"
```

*Note: Requests originating from the native WisePenny React dashboard are automatically permitted without manual API key header configuration.*

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

---

## 🐳 Docker & Google Cloud Run Deployment

WisePenny is fully containerized and configured to run on Google Cloud Run in a single container.

### Complete Google Cloud CLI Setup & Deployment Options

Follow these steps to configure your GCP project and deploy using the **gcloud CLI**:

#### 1. Authenticate and Configure Project
Ensure you are logged in and configure the target Google Cloud project ID:
```bash
# Log in to your Google Account
gcloud auth login

# Set the active project for deployment
gcloud config set project <YOUR_PROJECT_ID>
```

#### 2. Enable Required Google Cloud APIs
Enable the Google Cloud Run, Cloud Build, and Artifact Registry service APIs for your project:
```bash
gcloud services enable run.googleapis.com \
                       builds.googleapis.com \
                       artifactregistry.googleapis.com
```

#### 3. Configure Default Deployment Settings
Set standard default settings for region and platform management to simplify your commands:
```bash
gcloud config set run/region us-central1
gcloud config set run/platform managed
```

#### 4. Create an Artifact Registry Repository (Recommended)
Create a secure Docker repository in Artifact Registry to hold your container images (replacing legacy `gcr.io` registries):
```bash
gcloud artifacts repositories create wisepenny-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker repository for WisePenny"
```

#### 5. Submit Build to Artifact Registry
Use Cloud Build to build the container using the root `Dockerfile` and store it in Artifact Registry:
```bash
gcloud builds submit --tag us-central1-docker.pkg.dev/<YOUR_PROJECT_ID>/wisepenny-repo/wisepenny:latest
```

#### 6. Deploy to Google Cloud Run
Launch the container on Google Cloud Run, allowing public HTTP traffic:
```bash
gcloud run deploy wisepenny \
  --image us-central1-docker.pkg.dev/<YOUR_PROJECT_ID>/wisepenny-repo/wisepenny:latest \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_gemini_api_key
```

---

## ☁️ Render Deployment

WisePenny can be deployed to **Render** as a Web Service. The repository contains a `render.yaml` blueprint file, enabling automatic setup.

### Deployment Steps

1. **Sign in to Render**: Go to [Render Dashboard](https://dashboard.render.com).
2. **Create a Blueprint Instance**:
   - Click **New +** in the top right.
   - Choose **Blueprint**.
   - Connect your GitHub repository: `https://github.com/gauravraj9120/WisePenny.git`.
3. **Deploy**:
   - Render will parse `render.yaml` and configure the web service using the Docker environment automatically.
   - Once deployment completes, your live web application URL will be displayed.
4. **Environment Variables**:
   - You can update `GEMINI_API_KEY` or SMTP credentials under the service's **Environment** tab in Render at any time.
