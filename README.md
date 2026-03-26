# 🚀 LoadLab — K6 Load Testing Web Application

**LoadLab** is a modern web application that provides a powerful visual interface for running **K6** load tests directly from your browser. It eliminates the need to write complex K6 scripts manually, allowing developers and QA engineers to configure, execute, and monitor performance tests through an intuitive dashboard.

## Preview
<img width="1007" height="736" alt="Screenshot 2026-03-26 at 14 58 58" src="https://github.com/user-attachments/assets/51241d45-8471-448a-998e-975e48f806af" />


---

## ✨ Features

- **Intuitive Configuration**: Set up target URLs, HTTP methods, VUs, and duration without touching a line of code.
- **Advanced Options**: Support for custom Request Headers, Request Body, Ramp-up Stages, and K6 Thresholds.
- **Real-time Metrics**: Monitor total requests, success/error rates, response times (Avg/P95), and throughput (Req/s) as the test runs.
- **Live Logs**: View real-time output from the K6 engine in a terminal-style log viewer.
- **Premium Design**: A responsive, dark-themed interface built with modern web aesthetics (Shadcn UI, Glassmorphism).

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, React 19
- **Styling**: Tailwind CSS, Shadcn UI
- **Load Testing Engine**: [K6](https://k6.io/) (Run as a child process)
- **Real-time Communication**: Server-Sent Events (SSE)
- **Package Manager**: pnpm

---

## 📋 Prerequisites

Before running the project, ensure you have the following installed on your system:

1.  **Node.js**: Version 18.x or later.
2.  **pnpm**: The recommended package manager for this project.
    ```bash
    npm install -g pnpm
    ```
3.  **K6**: The load testing engine must be installed and available in your system's `PATH`.
    - **macOS (Homebrew)**: `brew install k6`
    - **Windows (Chocolatey)**: `choco install k6`
    - **Linux (APT)**: [Check installation guide](https://k6.io/docs/getting-started/installation/#linux)

---

## 🚀 Getting Started

Follow these steps to set up and run LoadLab locally:

### 1. Clone the Repository
```bash
git clone https://github.com/vickyvaf/load-lab.git
cd load-lab
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Run the Development Server
```bash
pnpm dev
```

### 4. Access the Application
Open [http://localhost:3000](http://localhost:3000) in your browser to start testing.

---

## 📖 Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [K6 Documentation](https://k6.io/docs/) - learn about K6 load testing engine.
- [Shadcn UI](https://ui.shadcn.com/) - premium components used for styling.
