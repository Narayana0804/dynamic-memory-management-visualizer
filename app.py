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
    
    try:
        data = request.json
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'Invalid request: No JSON data provided'
            }), 400
            
        operation = data.get('operation')
        if not operation:
            operation = 'allocate'
            logging.warning(f"No operation specified, defaulting to '{operation}'")
        
        # Validation and execution
        if operation == 'allocate':
            try:
                size = data.get('size')
                if size is None:
                    size = 64
                    logging.warning(f"No size specified for allocation, using default: {size}")
                else:
                    size = int(size)
                    if size <= 0:
                        size = 64
                        logging.warning(f"Invalid allocation size, using default: {size}")
                
                memory_manager.allocate_memory(size)
                logging.debug(f"Successfully allocated {size} bytes")
                
            except (ValueError, TypeError) as e:
                logging.error(f"Error parsing allocation size: {e}")
                return jsonify({
                    'status': 'error',
                    'message': f'Invalid allocation size: {str(e)}'
                }), 400
                
        elif operation == 'deallocate':
            try:
                address = data.get('address')
                if address is None:
                    # Find the first allocated frame
                    for i, frame in enumerate(memory_manager.memory):
                        if frame['status'] == 'allocated':
                            address = i * memory_manager.page_size
                            logging.warning(f"No address specified for deallocation, using first allocated frame: {address}")
                            break
                    else:
                        return jsonify({
                            'status': 'error',
                            'message': 'No memory allocated to deallocate'
                        }), 400
                else:
                    try:
                        address = int(address)
                    except (ValueError, TypeError):
                        # Find a valid address if the provided one is invalid
                        for i, frame in enumerate(memory_manager.memory):
                            if frame['status'] == 'allocated':
                                address = i * memory_manager.page_size
                                logging.warning(f"Invalid address for deallocation, using first allocated frame: {address}")
                                break
                        else:
                            return jsonify({
                                'status': 'error',
                                'message': 'No memory allocated to deallocate'
                            }), 400
                
                memory_manager.deallocate_memory(address)
                logging.debug(f"Successfully deallocated memory at address {address}")
                
            except Exception as e:
                logging.error(f"Error in deallocation: {e}")
                return jsonify({
                    'status': 'error',
                    'message': f'Deallocation error: {str(e)}'
                }), 400
                
        elif operation == 'access':
            try:
                address = data.get('address')
                if address is None:
                    # Use a default or find a valid address
                    address = 0
                    logging.warning(f"No address specified for memory access, using default: {address}")
                else:
                    try:
                        address = int(address)
                    except (ValueError, TypeError):
                        address = 0
                        logging.warning(f"Invalid address for memory access, using default: {address}")
                
                memory_manager.access_memory(address)
                logging.debug(f"Successfully accessed memory at address {address}")
                
            except Exception as e:
                logging.error(f"Error in memory access: {e}")
                return jsonify({
                    'status': 'error',
                    'message': f'Memory access error: {str(e)}'
                }), 400
                
        else:
            return jsonify({
                'status': 'error',
                'message': f'Unknown operation: {operation}'
            }), 400
        
        # Get and return the new state
        try:
            new_state = memory_manager.get_current_state()
            
            return jsonify({
                'status': 'success',
                'state': new_state
            })
        except Exception as e:
            logging.error(f"Error getting memory state: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Failed to get memory state: {str(e)}'
            }), 500
            
    except Exception as e:
        logging.error(f"Unexpected error in next_step: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Server error: {str(e)}'
        }), 500

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
