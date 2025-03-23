/**
 * Main script for memory management visualizer
 */

// DOM elements
const simulationForm = document.getElementById('simulation-form');
const operationForm = document.getElementById('operation-form');
const resetBtn = document.getElementById('reset-btn');
const operationSelect = document.getElementById('operation');
const allocateInput = document.querySelector('.allocate-input');
const addressInput = document.querySelector('.address-input');
const executeBtn = operationForm.querySelector('button[type="submit"]');

// State variables
let simulationActive = false;
let memoryState = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
});

/**
 * Set up event listeners
 */
function initEventListeners() {
    // Simulation form submit - Start simulation
    simulationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        startSimulation();
    });
    
    // Operation form submit - Execute memory operation
    operationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        executeOperation();
    });
    
    // Reset button click - Reset simulation
    resetBtn.addEventListener('click', function() {
        resetSimulation();
    });
    
    // Operation type change - Toggle input fields
    operationSelect.addEventListener('change', function() {
        updateOperationForm();
    });
}

/**
 * Start a new memory simulation
 */
async function startSimulation() {
    const technique = document.getElementById('technique').value;
    const memorySize = parseInt(document.getElementById('memory-size').value);
    const pageSize = parseInt(document.getElementById('page-size').value);
    const algorithm = document.getElementById('algorithm').value;
    
    // Validate input
    if (memorySize % pageSize !== 0) {
        showAlert('Memory size must be a multiple of page size', 'danger');
        return;
    }
    
    try {
        const response = await fetch('/api/start_simulation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                technique,
                memory_size: memorySize,
                page_size: pageSize,
                algorithm
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            simulationActive = true;
            memoryState = data.initial_state;
            
            // Update UI
            executeBtn.disabled = false;
            showAlert('Simulation started successfully', 'success');
            
            // Initialize visualization
            initializeMemoryGrid(memoryState);
            updateMemoryInfo(memoryState);
            updateAnalytics(memoryState);
            initUtilizationChart();
            clearOperationLog();
            
            // Disable simulation settings
            Array.from(simulationForm.elements).forEach(element => {
                element.disabled = true;
            });
        } else {
            showAlert(`Error: ${data.message}`, 'danger');
        }
    } catch (error) {
        showAlert(`Error starting simulation: ${error.message}`, 'danger');
        console.error('Error starting simulation:', error);
    }
}

/**
 * Execute a memory operation (allocate, deallocate, access)
 */
async function executeOperation() {
    if (!simulationActive) {
        showAlert('Please start a simulation first', 'warning');
        return;
    }
    
    const operation = operationSelect.value;
    const size = operation === 'allocate' ? parseInt(document.getElementById('size').value) : null;
    const address = operation !== 'allocate' ? parseInt(document.getElementById('address').value) : null;
    
    try {
        const response = await fetch('/api/next_step', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                operation,
                size,
                address
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            memoryState = data.state;
            
            // Update UI
            updateMemoryVisualization(memoryState);
            updateMemoryInfo(memoryState);
            updateAnalytics(memoryState);
            updateUtilizationChart(memoryState);
            updateOperationLog(memoryState.operations);
            
            // Check for page fault and show indicator
            const lastOperation = memoryState.operations[memoryState.operations.length - 1];
            if (lastOperation && lastOperation.type === 'access' && lastOperation.result === 'fault') {
                showPageFaultIndicator();
            }
        } else {
            showAlert(`Error: ${data.message}`, 'danger');
        }
    } catch (error) {
        showAlert(`Error executing operation: ${error.message}`, 'danger');
        console.error('Error executing operation:', error);
    }
}

/**
 * Reset the current simulation
 */
async function resetSimulation() {
    try {
        const response = await fetch('/api/reset_simulation', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            simulationActive = false;
            memoryState = null;
            
            // Reset UI
            executeBtn.disabled = true;
            showAlert('Simulation reset successfully', 'success');
            
            document.getElementById('memory-grid').innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="fas fa-memory fa-3x mb-3"></i>
                    <p>Start a simulation to visualize memory</p>
                </div>
            `;
            
            clearAnalytics();
            clearOperationLog();
            resetUtilizationChart();
            
            // Enable simulation settings
            Array.from(simulationForm.elements).forEach(element => {
                element.disabled = false;
            });
        } else {
            showAlert(`Error: ${data.message}`, 'danger');
        }
    } catch (error) {
        showAlert(`Error resetting simulation: ${error.message}`, 'danger');
        console.error('Error resetting simulation:', error);
    }
}

/**
 * Update the operation form based on the selected operation
 */
function updateOperationForm() {
    const operation = operationSelect.value;
    
    if (operation === 'allocate') {
        allocateInput.classList.remove('d-none');
        addressInput.classList.add('d-none');
    } else {
        allocateInput.classList.add('d-none');
        addressInput.classList.remove('d-none');
    }
}

/**
 * Show an alert message
 * @param {string} message - The message to display
 * @param {string} type - The alert type (success, danger, warning)
 */
function showAlert(message, type) {
    // Create alert element
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Find a suitable location for the alert
    const container = document.querySelector('main .container');
    container.insertBefore(alertElement, container.firstChild);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertElement);
        bsAlert.close();
    }, 5000);
}

/**
 * Update memory information display
 * @param {Object} state - Current memory state
 */
function updateMemoryInfo(state) {
    if (!state) return;
    
    const allocatedFrames = state.memory.filter(frame => frame.status === 'allocated').length;
    const totalFrames = state.total_frames;
    const memoryInfo = document.getElementById('memory-info');
    
    memoryInfo.textContent = `Memory: ${allocatedFrames}/${totalFrames} frames`;
    
    document.getElementById('total-memory').textContent = `${state.memory_size} bytes`;
    document.getElementById('page-size-value').textContent = `${state.page_size} bytes`;
}

/**
 * Clear analytics display
 */
function clearAnalytics() {
    document.getElementById('page-faults').textContent = '0';
    document.getElementById('hit-miss-ratio').textContent = '0% / 0%';
    document.getElementById('memory-utilization').textContent = '0%';
    document.getElementById('total-memory').textContent = '0 bytes';
    document.getElementById('page-size-value').textContent = '0 bytes';
    document.getElementById('memory-info').textContent = 'Memory: 0/0 bytes';
}

/**
 * Clear operation log
 */
function clearOperationLog() {
    document.getElementById('operation-log').innerHTML = '<p class="text-muted">No operations yet</p>';
}

/**
 * Show the page fault indicator
 */
function showPageFaultIndicator() {
    const indicator = document.getElementById('page-fault-indicator');
    indicator.classList.add('active');
    
    setTimeout(() => {
        indicator.classList.remove('active');
    }, 2000);
}
