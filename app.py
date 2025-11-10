import os
import logging
import webbrowser
import threading
from flask import Flask, render_template, request, jsonify
from memory_manager import MemoryManager
from tutorial_manager import TutorialManager

# Uncomment if deploying frontend and backend separately
# from flask_cors import CORS

logging.basicConfig(filename="app.log", level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")
app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = os.environ.get("SESSION_SECRET", "memory-visualizer-secret")

# CORS(app)  # Uncomment if needed

memory_manager = None
tutorial_manager = TutorialManager()
# if __name__ == "__main__":
#     app.run(debug=True, host="127.0.0.1", port=5000)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/api/start_simulation', methods=['POST'])
def start_simulation():
    global memory_manager
    try:
        if not request.is_json:
            return jsonify({'status': 'error', 'message': 'Invalid request format. Expected JSON.'}), 400
        data = request.json
        technique = data.get('technique', 'paging')
        if technique not in ['paging', 'segmentation']:
            return jsonify({'status': 'error', 'message': 'Invalid technique.'}), 400
        memory_size = int(data.get('memory_size', 1024))
        page_size = int(data.get('page_size', 64))
        algorithm = data.get('algorithm', 'FIFO')
        if algorithm not in ['FIFO', 'LRU']:
            return jsonify({'status': 'error', 'message': 'Invalid algorithm.'}), 400
        if memory_size <= 0 or memory_size > 4096:
            return jsonify({'status': 'error', 'message': 'Invalid memory size.'}), 400
        if page_size <= 0 or page_size > 512:
            return jsonify({'status': 'error', 'message': 'Invalid page size.'}), 400
        if memory_size % page_size != 0:
            return jsonify({'status': 'error', 'message': 'Memory size must be a multiple of page size.'}), 400

        memory_manager = MemoryManager(
            technique=technique,
            memory_size=memory_size,
            page_size=page_size,
            algorithm=algorithm
        )
        initial_state = memory_manager.get_current_state()
        analytics = memory_manager.get_analytics() if hasattr(memory_manager, "get_analytics") else {}
        return jsonify({'status': 'success', 'message': 'Simulation started successfully', 'initial_state': initial_state, 'analytics': analytics})
    except Exception as e:
        logging.error(f"Unexpected error in start_simulation: {str(e)}")
        return jsonify({'status': 'error', 'message': 'An unexpected error occurred'}), 500

@app.route('/api/next_step', methods=['POST'])
def next_step():
    global memory_manager
    if not memory_manager:
        return jsonify({'status': 'error', 'message': 'No active simulation. Please start a simulation first.'}), 400
    try:
        data = request.json
        if not data:
            return jsonify({'status': 'error', 'message': 'Invalid request: No JSON data provided'}), 400
        operation = data.get('operation')
        if not operation:
            return jsonify({'status': 'error', 'message': 'Missing "operation" parameter'}), 400
        size = int(data.get('size', 64)) if operation == 'allocate' else None
        address = int(data.get('address', 0)) if operation in ['deallocate', 'access'] else None

        # Call the relevant method on memory_manager, e.g.:
        # result = memory_manager.allocate(size) if operation == 'allocate' else ...
        # For now, let's assume you have a method memory_manager.process_operation(...)
        if hasattr(memory_manager, "process_operation"):
            memory_manager.process_operation(operation, size=size, address=address)
        state = memory_manager.get_current_state()
        analytics = memory_manager.get_analytics() if hasattr(memory_manager, "get_analytics") else {}
        return jsonify({'status': 'success', 'state': state, 'analytics': analytics})
    except Exception as e:
        logging.error(f"Error in next_step: {str(e)}")
        return jsonify({'status': 'error', 'message': f'Error processing step: {str(e)}'}), 500

@app.route('/api/reset_simulation', methods=['POST'])
def reset_simulation():
    global memory_manager
    memory_manager = None
    return jsonify({'status': 'success', 'message': 'Simulation reset successfully'})

# Add any additional endpoints, e.g. for tutorials, as needed

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    url = f"http://127.0.0.1:{port}/"

    # When debug=True, the reloader spawns two processes.
    # WERKZEUG_RUN_MAIN is set to "true" in the *reloader child* process.
    should_open = os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not app.debug

    if should_open:
        # open browser shortly after server starts (non-blocking)
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()

    # Keep debug=True for autoreload and nicer tracebacks while developing
    app.run(debug=True, host="127.0.0.1", port=port)