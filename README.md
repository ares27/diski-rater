# ⚽ DiskiRater

**DiskiRater** is a sophisticated Progressive Web App (PWA) designed to streamline local soccer management. It allows captains and players to organize matches, rate skill sets, and balance teams based on real-time performance data.

Built with the **MERN** stack (MongoDB, Express, React, Node) and specialized for high-performance mobile use.

---

## 🚀 Key Features

### 🛡️ Role-Based Access Control (RBAC)

- **Captains:** Empowered to approve new players, edit technical ratings, and generate balanced teams.
- **Players:** Access to view their own stats, participate in squad selection, and submit community suggestions.

### 📍 Area-Specific Ecosystems

- Automatic filtering based on user location (e.g., Midrand, Centurion).
- Squads and leaderboards are isolated by area to ensure relevant local competition.

### ⚖️ Advanced Team Balancing

- One-click **Team Generation** that uses an algorithm to split "Playing" players into two balanced sides based on their technical, physical, and skill ratings.

### 📶 Offline-First Architecture

- **Sticky Sessions:** Squad selections are persisted locally so you don't lose your lineup during navigation or page refreshes.
- **Background Sync:** A custom sync-indicator shows real-time database status (Green = Synced, Orange = Local Cache).
- **Service Worker:** Full PWA support allowing the app to be "installed" on home screens and used with spotty field connection.

### 💡 Community Board

- A suggestion and upvoting system for players to propose app improvements or local match rules.

---

## 🛠️ The Tech Stack

- **Frontend:** React 19, TypeScript, Vite, React-Bootstrap.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB Atlas (NoSQL).
- **Auth:** Firebase Authentication.
- **Deployment:** Render (Automated CI/CD).
- **Styling:** SASS / Bootstrap 5.3.

---

## 🏗️ Project Structure

```text
diski-rater/
├── src/                # Frontend React application
│   ├── components/     # Reusable UI elements (PlayerCard, Modals)
│   ├── services/       # API logic and Firebase config
│   ├── routes/         # RBAC Protected routing
│   └── types/          # TypeScript interfaces
├── server/             # Node.js Express Backend
│   ├── models/         # MongoDB Schemas
│   └── routes/         # API Endpoints
└── public/             # PWA Icons and manifest
```
