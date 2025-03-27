# dynamic-memory-management-visualizer
Overview

The Dynamic Memory Management Visualizer is an interactive web-based tool that simulates and visualizes memory management techniques such as paging, segmentation, and virtual memory. The tool provides real-time visualization, memory allocation tracking, and performance analytics, helping users understand how different memory management techniques work.

Features

🌐 Frontend (HTML, CSS, JavaScript)

1️⃣ Landing Page

A clean and modern homepage with:

A header: "Dynamic Memory Management Visualizer"

A hero section with a short description: "Simulate paging, segmentation, and virtual memory techniques with real-time visualization."

A Start Simulation button that redirects to the simulation dashboard.

2️⃣ Simulation Dashboard (Main Page)

A two-panel layout:

Left Panel (User Input Form):

Dropdown to select Memory Management Technique (Paging / Segmentation).

Number input for Memory Size and Page Size.

Dropdown for Page Replacement Algorithm (FIFO, LRU).

A Start Simulation button.

Right Panel (Memory Visualization):

A dynamic grid layout showing allocated memory blocks.

Color coding:

🟩 Green: Allocated memory

🟥 Red: Page faults

⚪ Gray: Free memory

A Live Page Fault Indicator that blinks when a fault occurs.

A Step-by-Step Execution button to visualize each memory operation.

3️⃣ Results & Analytics Section

A table showing:

Total page faults

Hit/miss ratio

A bar chart displaying memory utilization.

A Reset Button to start a new simulation.

🎨 Styling (CSS)

Uses modern CSS techniques (Flexbox & Grid) for layout.

Hover effects and smooth transitions for UI elements.

Mobile responsiveness for accessibility across devices.

Dark mode theme with green, blue, and red accents.

🛠️ Backend (Flask + Python)

The backend handles memory allocation logic and serves data to the frontend.

Backend Logic:

Implements memory management techniques:
✅ Paging✅ Segmentation✅ Virtual Memory Handling✅ FIFO & LRU Page Replacement Algorithms

API Endpoints (Flask)

POST /start_simulation → Initializes memory with user input.

GET /next_step → Sends the next memory state for visualization.

GET /results → Returns total page faults and memory statistics.

How Backend Works:

Simulates memory operations using lists and dictionaries.

Tracks page faults and memory usage dynamically.

Sends step-by-step memory states to the frontend via AJAX (JavaScript fetch API).

🔹 Additional Features

✅ Animations using JavaScript (CSS transitions & Canvas API for visualization).✅ Data Fetching using JavaScript fetch() to communicate with Flask API.✅ Deployment: Backend on Render/Heroku, Frontend on GitHub Pages/Vercel.

📝 Expected Output

A fully interactive memory visualizer that lets users simulate paging, segmentation, and virtual memory.

Color-coded memory visualization showing real-time page faults and memory allocation.

A Flask API backend that computes and returns step-by-step memory states to the frontend.

Charts and tables for analyzing memory performance (hit/miss ratio, memory utilization).
