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
    // Get form values with validation
    const technique = document.getElementById('technique').value;
    
    let memorySize = 1024; // Default
    const memorySizeInput = document.getElementById('memory-size');
    if (memorySizeInput && memorySizeInput.value) {
        memorySize = parseInt(memorySizeInput.value);
    }
    
    let pageSize = 64; // Default
    const pageSizeInput = document.getElementById('page-size');
    if (pageSizeInput && pageSizeInput.value) {
        pageSize = parseInt(pageSizeInput.value);
    }
    
    const algorithm = document.getElementById('algorithm').value;
    
    // Validate input
    if (isNaN(memorySize) || memorySize <= 0) {
        showAlert('Memory size must be a positive number', 'danger');
        return;
    }
    
    if (isNaN(pageSize) || pageSize <= 0) {
        showAlert('Page size must be a positive number', 'danger');
        return;
    }
    
    if (memorySize % pageSize !== 0) {
        showAlert('Memory size must be a multiple of page size', 'danger');
        return;
    }
    
    // Find the start button and set loading state
    const startButton = simulationForm.querySelector('button[type="submit"]');
    startButton.disabled = true;
    startButton.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Starting...';
    
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
        
        // Reset button state
        startButton.disabled = false;
        startButton.innerHTML = '<i class="fas fa-play me-1"></i> Start Simulation';
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server responded with ${response.status}: ${errorText}`);
        }
        
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
        // Reset button state
        startButton.disabled = false;
        startButton.innerHTML = '<i class="fas fa-play me-1"></i> Start Simulation';
        
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
    
    // Get size if allocating, otherwise default to null
    let size = null;
    if (operation === 'allocate') {
        const sizeInput = document.getElementById('size');
        if (sizeInput && sizeInput.value) {
            size = parseInt(sizeInput.value);
        } else {
            size = 64; // Default size
        }
    }
    
    // Get address if deallocating or accessing, otherwise default to 0
    let address = 0;
    if (operation !== 'allocate') {
        const addressInput = document.getElementById('address');
        if (addressInput && addressInput.value) {
            address = parseInt(addressInput.value);
        }
    }
    
    try {
        // Set button to loading state
        executeBtn.disabled = true;
        executeBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Processing...';
        
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
        
        // Reset button state
        executeBtn.disabled = false;
        executeBtn.innerHTML = '<i class="fas fa-cog me-1"></i> Execute Operation';
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server responded with ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            memoryState = data.state;
            
            // Update UI with error handling for each component
            try {
                updateMemoryVisualization(memoryState);
            } catch (e) {
                console.error('Error updating memory visualization:', e);
            }
            
            try {
                updateMemoryInfo(memoryState);
            } catch (e) {
                console.error('Error updating memory info:', e);
            }
            
            try {
                updateAnalytics(memoryState);
            } catch (e) {
                console.error('Error updating analytics:', e);
            }
            
            try {
                updateUtilizationChart(memoryState);
            } catch (e) {
                console.error('Error updating utilization chart:', e);
            }
            
            try {
                if (memoryState.operations) {
                    updateOperationLog(memoryState.operations);
                }
            } catch (e) {
                console.error('Error updating operation log:', e);
            }
            
            // Check for page fault and show indicator
            try {
                const lastOperation = memoryState.operations && memoryState.operations.length > 0 
                    ? memoryState.operations[memoryState.operations.length - 1] 
                    : null;
                
                if (lastOperation && lastOperation.type === 'access' && lastOperation.result === 'fault') {
                    showPageFaultIndicator();
                }
            } catch (e) {
                console.error('Error checking for page fault:', e);
            }
        } else {
            showAlert(`Error: ${data.message}`, 'danger');
        }
    } catch (error) {
        // Reset button state
        executeBtn.disabled = false;
        executeBtn.innerHTML = '<i class="fas fa-cog me-1"></i> Execute Operation';
        
        showAlert(`Error executing operation: ${error.message}`, 'danger');
        console.error('Error executing operation:', error);
    }
}

/**
 * Reset the current simulation
 */
async function resetSimulation() {
    // Set button to loading state
    resetBtn.disabled = true;
    resetBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Resetting...';
    
    try {
        const response = await fetch('/api/reset_simulation', {
            method: 'POST'
        });
        
        // Reset button state
        resetBtn.disabled = false;
        resetBtn.innerHTML = '<i class="fas fa-redo me-1"></i> Reset Simulation';
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server responded with ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            simulationActive = false;
            memoryState = null;
            
            // Reset UI
            executeBtn.disabled = true;
            showAlert('Simulation reset successfully', 'success');
            
            const gridElement = document.getElementById('memory-grid');
            if (gridElement) {
                gridElement.innerHTML = `
                    <div class="text-center py-5 text-muted">
                        <i class="fas fa-memory fa-3x mb-3"></i>
                        <p>Start a simulation to visualize memory</p>
                    </div>
                `;
            }
            
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
        // Reset button state
        resetBtn.disabled = false;
        resetBtn.innerHTML = '<i class="fas fa-redo me-1"></i> Reset Simulation';
        
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
