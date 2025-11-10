import os
import logging
import webbrowser
import threading
from flask import Flask, render_template, request, jsonify
from memory_manager import MemoryManager
from tutorial_manager import TutorialManager

# Configure logging
logging.basicConfig(filename="app.log", level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")

# Create Flask app
app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = os.environ.get("SESSION_SECRET", "memory-visualizer-secret")

# Global instances
memory_manager = None
tutorial_manager = TutorialManager()
# if __name__ == "__main__":
#     app.run(debug=True, host="127.0.0.1", port=5000)

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
    
    try:
        # Validate request
        if not request.is_json:
            logging.error("Invalid request format: not JSON")
            return jsonify({
                'status': 'error',
                'message': 'Invalid request format. Expected JSON.'
            }), 400
        
        data = request.json
        
        # Extract and validate parameters
        try:
            technique = data.get('technique', 'paging')
            if technique not in ['paging', 'segmentation']:
                raise ValueError(f"Invalid technique: {technique}")
            
            memory_size = int(data.get('memory_size', 1024))
            if memory_size <= 0 or memory_size > 4096:
                raise ValueError(f"Invalid memory size: {memory_size}")
            
            page_size = int(data.get('page_size', 64))
            if page_size <= 0 or page_size > 512:
                raise ValueError(f"Invalid page size: {page_size}")
            
            algorithm = data.get('algorithm', 'FIFO')
            if algorithm not in ['FIFO', 'LRU']:
                raise ValueError(f"Invalid algorithm: {algorithm}")
            
            # Validate that memory size is a multiple of page size
            if memory_size % page_size != 0:
                raise ValueError("Memory size must be a multiple of page size")
            
        except ValueError as e:
            logging.error(f"Parameter validation error: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': f"Parameter validation error: {str(e)}"
            }), 400
        
        # Initialize memory manager
        try:
            memory_manager = MemoryManager(
                technique=technique,
                memory_size=memory_size,
                page_size=page_size,
                algorithm=algorithm
            )
            
            initial_state = memory_manager.get_current_state()
            
            # Log success
            logging.info(f"Simulation started with: technique={technique}, memory_size={memory_size}, page_size={page_size}, algorithm={algorithm}")
            
            return jsonify({
                'status': 'success',
                'message': 'Simulation started successfully',
                'initial_state': initial_state
            })
            
        except Exception as e:
            logging.error(f"Error initializing memory manager: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': f"Error initializing simulation: {str(e)}"
            }), 500
            
    except Exception as e:
        logging.error(f"Unexpected error in start_simulation: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'An unexpected error occurred'
        }), 500

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

# Tutorial API Routes
@app.route('/tutorials')
def tutorials_page():
    """Render the tutorials page"""
    return render_template('tutorials.html')

@app.route('/api/tutorials', methods=['GET'])
def get_tutorials():
    """Get list of available tutorials"""
    global tutorial_manager
    
    tutorials = tutorial_manager.get_tutorial_list()
    
    return jsonify({
        'status': 'success',
        'tutorials': tutorials
    })

@app.route('/api/tutorials/start', methods=['POST'])
def start_tutorial():
    """Start a specific tutorial"""
    global tutorial_manager, memory_manager
    
    try:
        data = request.json
        
        if not data or 'tutorial_id' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Tutorial ID is required'
            }), 400
            
        tutorial_id = data['tutorial_id']
        
        # Start the tutorial
        step_data = tutorial_manager.start_tutorial(tutorial_id)
        
        if 'error' in step_data and step_data['error']:
            return jsonify({
                'status': 'error',
                'message': step_data['message']
            }), 404
            
        # Create a memory manager with the tutorial's initial configuration if needed
        if 'step' in step_data and 'config' in step_data['step'] and step_data['step']['config']:
            config = step_data['step']['config']
            
            if 'memory_size' in config and 'page_size' in config:
                memory_manager = MemoryManager(
                    technique=config.get('technique', 'paging'),
                    memory_size=config.get('memory_size', 1024),
                    page_size=config.get('page_size', 64),
                    algorithm=config.get('algorithm', 'FIFO')
                )
                
                logging.info(f"Tutorial memory manager initialized with config: {config}")
                
                # Add the memory state to the step data
                step_data['memory_state'] = memory_manager.get_current_state()
        
        return jsonify({
            'status': 'success',
            'tutorial_step': step_data
        })
    
    except Exception as e:
        logging.error(f"Error starting tutorial: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to start tutorial: {str(e)}'
        }), 500

@app.route('/api/tutorials/next', methods=['POST'])
def tutorial_next_step():
    """Advance to the next step in the tutorial"""
    global tutorial_manager, memory_manager
    
    try:
        # Check if an operation was performed (for verification)
        data = request.json or {}
        operation_data = data.get('operation_data', {})
        
        # Verify step if operation data provided
        if operation_data:
            if not tutorial_manager.verify_step_completed(operation_data):
                return jsonify({
                    'status': 'error',
                    'message': 'Please complete the current step\'s task before proceeding'
                }), 400
        
        # Advance to next step
        step_data = tutorial_manager.next_step()
        
        if 'error' in step_data and step_data['error']:
            return jsonify({
                'status': 'error',
                'message': step_data['message']
            }), 400
            
        # If tutorial completed
        if 'completed' in step_data and step_data['completed']:
            return jsonify({
                'status': 'success',
                'completed': True,
                'message': step_data['message']
            })
            
        # Initialize memory manager with step config if needed
        if 'step' in step_data and 'config' in step_data['step'] and step_data['step']['config']:
            config = step_data['step']['config']
            
            if config and 'technique' in config:
                memory_manager = MemoryManager(
                    technique=config.get('technique', 'paging'),
                    memory_size=config.get('memory_size', 1024),
                    page_size=config.get('page_size', 64),
                    algorithm=config.get('algorithm', 'FIFO')
                )
                
                logging.info(f"Tutorial step memory manager initialized with config: {config}")
                
                # Add the memory state to the step data
                step_data['memory_state'] = memory_manager.get_current_state()
        
        return jsonify({
            'status': 'success',
            'tutorial_step': step_data
        })
    
    except Exception as e:
        logging.error(f"Error advancing tutorial: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to advance tutorial: {str(e)}'
        }), 500

@app.route('/api/tutorials/previous', methods=['POST'])
def tutorial_previous_step():
    """Go back to the previous step in the tutorial"""
    global tutorial_manager, memory_manager
    
    try:
        step_data = tutorial_manager.previous_step()
        
        if 'error' in step_data and step_data['error']:
            return jsonify({
                'status': 'error',
                'message': step_data['message']
            }), 400
            
        # Initialize memory manager with step config if needed
        if 'step' in step_data and 'config' in step_data['step'] and step_data['step']['config']:
            config = step_data['step']['config']
            
            if config and ('memory_size' in config or 'technique' in config):
                memory_manager = MemoryManager(
                    technique=config.get('technique', 'paging'),
                    memory_size=config.get('memory_size', 1024),
                    page_size=config.get('page_size', 64),
                    algorithm=config.get('algorithm', 'FIFO')
                )
                
                logging.info(f"Tutorial step memory manager initialized with config: {config}")
                
                # Add the memory state to the step data
                step_data['memory_state'] = memory_manager.get_current_state()
        
        return jsonify({
            'status': 'success',
            'tutorial_step': step_data
        })
        
    except Exception as e:
        logging.error(f"Error going to previous tutorial step: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to go to previous step: {str(e)}'
        }), 500

@app.route('/api/tutorials/end', methods=['POST'])
def end_tutorial():
    """End the current tutorial"""
    global tutorial_manager
    
    try:
        result = tutorial_manager.end_tutorial()
        
        if 'error' in result and result['error']:
            return jsonify({
                'status': 'error',
                'message': result['message']
            }), 400
            
        return jsonify({
            'status': 'success',
            'message': 'Tutorial ended successfully',
            'tutorial_id': result.get('tutorial_id')
        })
        
    except Exception as e:
        logging.error(f"Error ending tutorial: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to end tutorial: {str(e)}'
        }), 500

@app.route('/api/tutorials/current', methods=['GET'])
def get_current_tutorial_step():
    """Get the current tutorial step"""
    global tutorial_manager, memory_manager
    
    try:
        step_data = tutorial_manager.get_current_step()
        
        if 'error' in step_data and step_data['error']:
            return jsonify({
                'status': 'error',
                'message': step_data['message']
            }), 400
        
        # Add current memory state if available
        if memory_manager:
            step_data['memory_state'] = memory_manager.get_current_state()
        
        return jsonify({
            'status': 'success',
            'tutorial_step': step_data
        })
        
    except Exception as e:
        logging.error(f"Error getting current tutorial step: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to get tutorial step: {str(e)}'
        }), 500
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