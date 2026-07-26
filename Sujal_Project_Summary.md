# Sujal Das's LeadTracker

## Project Overview
This project is a high-performance CRM and Lead Management application designed for Sujal Das. It is built as a Single Page Application (SPA) using React, Vite, and Tailwind CSS. The backend consists of an Express server running in Node.js, storing state in memory and exposing a comprehensive REST API.

## Architecture
- **Frontend Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Data Visualization**: Recharts (D3-based)
- **Backend Framework**: Express.js
- **Runtime**: Node.js

## Core Features
1. **Interactive Pipeline Dashboard**: Kanban and Table views to track leads across statuses. Includes real-time metrics summarizing the active database.
2. **Dynamic Charting**: A Recharts-based bar chart automatically calculates and visualizes lead distributions by their current pipeline stage.
3. **CSV Export & Import**:
   - Easily back up the entire CRM database to a CSV file.
   - Import external leads into the CRM smoothly using the newly added CSV Import feature.
4. **Deep Dive Detail Drawer**: View individual lead profiles, edit information, write contextual notes, and track automated activity logs.
5. **Simulated Email Logs**: A UI panel specifically dedicated to showing backend email notifications.
6. **Public Lead Capture Form**: An external-facing form to capture incoming lead inquiries directly into the database.
7. **Developer API Explorer**: View all available endpoints and execute live queries to test the API securely with bearer token auth.

## Customization for Sujal Das
- **Admin User**: The system's primary user has been configured to "Sujal Das" with email "sujal.das8797@gmail.com".
- **Currency**: Modified to natively display values using INR (₹).
- **Branding**: The platform header highlights "Sujal Das's LeadTracker".
- **Clean UI**: Scrollbars have been globally hidden for a premium, sleek aesthetic.

## How to Export this Document as PDF
To save this document as a PDF, simply open this markdown file in a viewer (like VS Code or GitHub), or render it using an online markdown-to-pdf tool, and use your browser or system's "Print to PDF" functionality.
