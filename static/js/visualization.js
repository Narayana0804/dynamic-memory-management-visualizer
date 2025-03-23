/**
 * Memory visualization functions
 */

/**
 * Initialize the memory grid with the initial state
 * @param {Object} state - Initial memory state
 */
function initializeMemoryGrid(state) {
    if (!state) return;
    
    const gridElement = document.getElementById('memory-grid');
    if (!gridElement) {
        console.error('Could not find memory-grid element');
        return;
    }
    
    gridElement.innerHTML = '';
    
    const gridContainer = document.createElement('div');
    gridContainer.className = 'memory-grid-container';
    
    // Create memory cells
    for (let i = 0; i < state.memory.length; i++) {
        const frame = state.memory[i];
        const cell = createMemoryCell(i, frame);
        gridContainer.appendChild(cell);
    }
    
    gridElement.appendChild(gridContainer);
}

/**
 * Create a memory cell element
 * @param {number} index - Frame index
 * @param {Object} frame - Frame data
 * @returns {HTMLElement} - Memory cell element
 */
function createMemoryCell(index, frame) {
    const cell = document.createElement('div');
    cell.className = `memory-cell ${frame.status}`;
    cell.dataset.index = index;
    
    // Use the process ID as content if allocated
    cell.textContent = frame.status === 'allocated' ? frame.id : '';
    
    // Add tooltip
    cell.title = `Frame ${index} (${frame.status})`;
    
    return cell;
}

/**
 * Update the memory visualization based on new state
 * @param {Object} state - Current memory state
 */
function updateMemoryVisualization(state) {
    if (!state) return;
    
    const cells = document.querySelectorAll('.memory-cell');
    if (cells.length === 0) {
        // If no cells exist, reinitialize the grid
        initializeMemoryGrid(state);
        return;
    }
    
    // Update each cell
    state.memory.forEach((frame, index) => {
        if (index < cells.length) {
            const cell = cells[index];
            
            // Check if state changed
            const oldStatus = cell.className.replace('memory-cell ', '').replace(' fault', '');
            const newStatus = frame.status;
            
            if (oldStatus !== newStatus || 
                (newStatus === 'allocated' && cell.textContent != frame.id)) {
                
                // Update class and content
                cell.className = `memory-cell ${frame.status}`;
                cell.textContent = frame.status === 'allocated' ? frame.id : '';
                
                // Animation for state change
                cell.classList.add('pulse');
                setTimeout(() => {
                    cell.classList.remove('pulse');
                }, 1000);
            }
        }
    });
    
    // Check for page faults in the last operation
    const operations = state.operations;
    if (operations && operations.length > 0) {
        const lastOp = operations[operations.length - 1];
        
        if (lastOp.type === 'access' && lastOp.result === 'fault') {
            // Highlight the frame where the fault occurred
            const frameNum = Math.floor(lastOp.address / state.page_size);
            if (frameNum < cells.length) {
                cells[frameNum].classList.add('fault');
                setTimeout(() => {
                    cells[frameNum].classList.remove('fault');
                }, 2000);
            }
        }
    }
}

/**
 * Update analytics with current memory state
 * @param {Object} state - Current memory state
 */
function updateAnalytics(state) {
    if (!state) return;
    
    // Update page faults
    document.getElementById('page-faults').textContent = state.page_faults;
    
    // Update hit/miss ratio
    const hitRatio = state.memory_accesses > 0 
        ? (state.page_hits / state.memory_accesses * 100).toFixed(1) 
        : 0;
    const missRatio = state.memory_accesses > 0 
        ? (state.page_faults / state.memory_accesses * 100).toFixed(1) 
        : 0;
    document.getElementById('hit-miss-ratio').textContent = `${hitRatio}% / ${missRatio}%`;
    
    // Update memory utilization
    const allocatedFrames = state.memory.filter(frame => frame.status === 'allocated').length;
    const utilization = (allocatedFrames / state.total_frames * 100).toFixed(1);
    document.getElementById('memory-utilization').textContent = `${utilization}%`;
}

/**
 * Update the operation log with recent operations
 * @param {Array} operations - Recent operations
 */
function updateOperationLog(operations) {
    if (!operations || operations.length === 0) return;
    
    const logElement = document.getElementById('operation-log');
    
    // Clear "no operations" message if present
    if (logElement.querySelector('.text-muted')) {
        logElement.innerHTML = '';
    }
    
    // Add the latest operation to the log
    const latestOp = operations[operations.length - 1];
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry mb-1';
    
    let operationText = '';
    let statusClass = '';
    
    switch (latestOp.type) {
        case 'allocate':
            operationText = `Allocated ${latestOp.size} bytes for process ${latestOp.process_id} in frames ${latestOp.frames.join(', ')}`;
            statusClass = 'text-success';
            break;
        case 'deallocate':
            operationText = `Deallocated memory for process ${latestOp.process_id} from frames ${latestOp.frames.join(', ')}`;
            statusClass = 'text-warning';
            break;
        case 'access':
            const result = latestOp.result === 'hit' ? 'hit' : 'fault';
            operationText = `Memory access at address ${latestOp.address} resulted in page ${result}`;
            statusClass = latestOp.result === 'hit' ? 'text-info' : 'text-danger';
            break;
    }
    
    logEntry.innerHTML = `
        <span class="timestamp text-muted">[${new Date().toLocaleTimeString()}]</span> 
        <span class="${statusClass}">${operationText}</span>
    `;
    
    // Add to the log (newest at top)
    logElement.insertBefore(logEntry, logElement.firstChild);
    
    // Keep log limited to 100 entries for performance
    const entries = logElement.querySelectorAll('.log-entry');
    if (entries.length > 100) {
        logElement.removeChild(entries[entries.length - 1]);
    }
}
