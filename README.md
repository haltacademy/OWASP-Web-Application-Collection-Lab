# OWASP Web Application Collection Lab

A centralized, containerized cyber range portal for managing and exploring popular deliberately vulnerable web applications. This lab environment provides a sleek Flask-based dashboard to easily start, stop, and access various web vulnerability training applications locally using Docker Compose.

## Features

- **Centralized Dashboard**: A premium, glassmorphic UI to manage all your vulnerable web apps in one place.
- **Container Orchestration**: Starts and stops labs asynchronously using Docker Compose, preventing UI hangs during large image pulls.
- **Session-Based Authentication**: Secure login portal to protect the dashboard from unauthorized access.
- **Plug-and-Play Architecture**: Easily add new labs by simply updating the `docker-compose.yml` file with specific labels.

## Included Applications

The lab comes pre-configured with the following vulnerable web applications:

| Application | Port | Description |
| :--- | :--- | :--- |
| **OWASP Juice Shop** | `9000` | The most modern and sophisticated insecure web application. |
| **OWASP WebGoat** | `9001` | A deliberately insecure Java EE web application. |
| **OWASP Mutillidae II** | `9002` | A free, open-source web application deliberately designed to be vulnerable. |
| **OWASP VulnerableApp** | `9003` | A modular, deliberately vulnerable web app for benchmarking security tools. |
| **DVWA** | `9004` | A PHP/MySQL web application that is damn vulnerable. |

## Prerequisites

Ensure you have the following installed on your host machine:

- **Docker**
- **Docker Compose** (V2 recommended)
- **Python 3.8+**
- **pip** (Python package installer)

## Installation

1. **Clone the repository:**
   ```bash
   git clone git@github.com:haltacademy/OWASP-Web-Application-Collection-Lab.git
   cd OWASP-Web-Application-Collection-Lab
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install flask pyyaml
   ```

## Usage

1. **Start the Dashboard Application:**
   Run the `start_lab.sh` script or start the Flask app directly:
   ```bash
   python app.py
   ```

2. **Access the Portal:**
   Open your web browser and navigate to:
   ```
   http://localhost:5000
   ```

3. **Login Credentials:**
   By default, the dashboard is protected with the following credentials:
   - **Username:** `owasp`
   - **Password:** `owasp`

4. **Manage Labs:**
   From the dashboard, you can click "Start" on any of the available applications. They will start in the background. Once running, you can click "Access" to navigate to the respective vulnerable web app or "Stop" to shut down the container.

## How to Add New Labs

You can easily add new containerized vulnerable apps by adding them to the `docker-compose.yml` file and including the necessary labels:

```yaml
  new_vulnerable_app:
    image: vendor/vulnerable-app:latest
    container_name: custom_app
    ports:
      - "9005:80"
    restart: unless-stopped
    labels:
      - "lab.name=My Custom Vuln App"
      - "lab.description=A description for the dashboard."
      - "lab.port=9005"
```

The Flask app dynamically reads these labels to populate the dashboard.

## Disclaimer

⚠️ **WARNING:** This repository contains deliberately insecure applications. **Do not deploy these applications on a production network or exposed public server.** They are intended for educational purposes and local security testing only. Always run this lab in an isolated network environment.
