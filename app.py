import os
import logging
from flask import Flask, render_template, request, jsonify
from memory_manager import MemoryManager

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "memory-visualizer-secret")

# Global memory manager instance
memory_manager = None

@app.route('/')
def index():
    """Render the landing page"""
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    """Render the simulation dashboard"""
    return render_template('dashboard.html')

@app.route('/api/start_simulation', methods=['POST'])
def start_simulation():
    """Initialize the memory simulation with user parameters"""
    global memory_manager
    
    data = request.json
    technique = data.get('technique', 'paging')
    memory_size = int(data.get('memory_size', 1024))
    page_size = int(data.get('page_size', 64))
    algorithm = data.get('algorithm', 'FIFO')
    
    memory_manager = MemoryManager(
        technique=technique,
        memory_size=memory_size,
        page_size=page_size,
        algorithm=algorithm
    )
    
    initial_state = memory_manager.get_current_state()
    
    return jsonify({
        'status': 'success',
        'message': 'Simulation started successfully',
        'initial_state': initial_state
    })

@app.route('/api/next_step', methods=['POST'])
def next_step():
    """Process the next memory operation and return the updated state"""
    global memory_manager
    
    if not memory_manager:
        return jsonify({
            'status': 'error',
            'message': 'No active simulation. Please start a simulation first.'
        }), 400
    
    data = request.json
    operation = data.get('operation', 'allocate')
    size = int(data.get('size', 64)) if 'size' in data else None
    address = int(data.get('address', 0)) if 'address' in data else None
    
    try:
        if operation == 'allocate':
            memory_manager.allocate_memory(size)
        elif operation == 'deallocate':
            memory_manager.deallocate_memory(address)
        elif operation == 'access':
            memory_manager.access_memory(address)
        else:
            return jsonify({
                'status': 'error',
                'message': f'Unknown operation: {operation}'
            }), 400
        
        new_state = memory_manager.get_current_state()
        
        return jsonify({
            'status': 'success',
            'state': new_state
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

@app.route('/api/get_results', methods=['GET'])
def get_results():
    """Return the current simulation results and analytics"""
    global memory_manager
    
    if not memory_manager:
        return jsonify({
            'status': 'error',
            'message': 'No active simulation. Please start a simulation first.'
        }), 400
    
    results = memory_manager.get_results()
    
    return jsonify({
        'status': 'success',
        'results': results
    })

@app.route('/api/reset_simulation', methods=['POST'])
def reset_simulation():
    """Reset the current simulation"""
    global memory_manager
    
    memory_manager = None
    
    return jsonify({
        'status': 'success',
        'message': 'Simulation reset successfully'
    })
