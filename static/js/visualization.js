/**
 * Memory visualization functions
 */

/**
 * Initialize the memory grid with the initial state
 * @param {Object} state - Initial memory state
 */
function initializeMemoryGrid(state) {
    if (!state) {
        console.error('Cannot initialize memory grid: state is null or undefined');
        return;
    }
    
    const gridElement = document.getElementById('memory-grid');
    if (!gridElement) {
        console.error('Could not find memory-grid element');
        return;
    }
    
    console.log('Initializing memory grid with state:', state);
    gridElement.innerHTML = '';
    
    const gridContainer = document.createElement('div');
    gridContainer.className = 'memory-grid-container';
    
    try {
        // Create memory cells
        if (!state.memory || !Array.isArray(state.memory)) {
            throw new Error('Invalid memory structure: memory is not an array');
        }
        
        console.log(`Creating ${state.memory.length} memory cells`);
        
        for (let i = 0; i < state.memory.length; i++) {
            let frame = state.memory[i];
            if (!frame) {
                console.warn(`Frame at index ${i} is undefined, using default empty frame`);
                frame = { status: 'free', id: null };
            }
            const cell = createMemoryCell(i, frame);
            gridContainer.appendChild(cell);
        }
        
        gridElement.appendChild(gridContainer);
        console.log('Memory grid initialization complete');
    } catch (error) {
        console.error('Error creating memory grid:', error);
        gridElement.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error creating memory grid: ${error.message}
            </div>
        `;
    }
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
    if (!state || !state.memory) {
        console.error('Invalid memory state received:', state);
        return;
    }
    
    const cells = document.querySelectorAll('.memory-cell');
    if (cells.length === 0) {
        // If no cells exist, reinitialize the grid
        try {
            initializeMemoryGrid(state);
        } catch (error) {
            console.error('Failed to initialize memory grid:', error);
        }
        return;
    }
    
    try {
        // Update each cell
        state.memory.forEach((frame, index) => {
            if (index < cells.length) {
                const cell = cells[index];
                if (!cell) return; // Skip if cell doesn't exist
                
                // Check if state changed
                const oldStatus = cell.className.replace('memory-cell ', '').replace(' fault', '').replace(' pulse', '');
                const newStatus = frame.status || 'free';
                
                if (oldStatus !== newStatus || 
                    (newStatus === 'allocated' && cell.textContent != frame.id)) {
                    
                    // Update class and content
                    cell.className = `memory-cell ${newStatus}`;
                    cell.textContent = newStatus === 'allocated' ? (frame.id || '') : '';
                    
                    // Animation for state change
                    cell.classList.add('pulse');
                    setTimeout(() => {
                        try {
                            if (cell && cell.classList) {
                                cell.classList.remove('pulse');
                            }
                        } catch (e) {
                            // Ignore errors in setTimeout callbacks
                        }
                    }, 1000);
                }
            }
        });
        
        // Check for page faults in the last operation
        const operations = state.operations;
        if (operations && operations.length > 0) {
            const lastOp = operations[operations.length - 1];
            
            if (lastOp && lastOp.type === 'access' && lastOp.result === 'fault' && 
                typeof lastOp.address === 'number' && typeof state.page_size === 'number') {
                
                // Highlight the frame where the fault occurred
                const frameNum = Math.floor(lastOp.address / state.page_size);
                if (frameNum >= 0 && frameNum < cells.length && cells[frameNum]) {
                    cells[frameNum].classList.add('fault');
                    setTimeout(() => {
                        try {
                            if (cells[frameNum] && cells[frameNum].classList) {
                                cells[frameNum].classList.remove('fault');
                            }
                        } catch (e) {
                            // Ignore errors in setTimeout callbacks
                        }
                    }, 2000);
                }
            }
        }
    } catch (error) {
        console.error('Error updating memory visualization:', error);
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
    if (!logElement) {
        console.error('Could not find operation-log element');
        return;
    }
    
    // Clear "no operations" message if present
    if (logElement.querySelector('.text-muted')) {
        logElement.innerHTML = '';
    }
    
    // Add the latest operation to the log
    const latestOp = operations[operations.length - 1];
    if (!latestOp) return;  // Safety check
    
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry mb-1';
    
    let operationText = '';
    let statusClass = '';
    
    try {
        switch (latestOp.type) {
            case 'allocate':
                const framesStr = Array.isArray(latestOp.frames) ? latestOp.frames.join(', ') : 'unknown';
                operationText = `Allocated ${latestOp.size || 0} bytes for process ${latestOp.process_id || 'unknown'} in frames ${framesStr}`;
                statusClass = 'text-success';
                break;
            case 'deallocate':
                const deallocFramesStr = Array.isArray(latestOp.frames) ? latestOp.frames.join(', ') : 'unknown';
                operationText = `Deallocated memory for process ${latestOp.process_id || 'unknown'} from frames ${deallocFramesStr}`;
                statusClass = 'text-warning';
                break;
            case 'access':
                const result = latestOp.result === 'hit' ? 'hit' : 'fault';
                operationText = `Memory access at address ${latestOp.address || 0} resulted in page ${result}`;
                statusClass = latestOp.result === 'hit' ? 'text-info' : 'text-danger';
                break;
            default:
                operationText = `Unknown operation: ${latestOp.type || 'undefined'}`;
                statusClass = 'text-secondary';
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
    } catch (error) {
        console.error('Error updating operation log:', error);
        logEntry.innerHTML = `
            <span class="timestamp text-muted">[${new Date().toLocaleTimeString()}]</span> 
            <span class="text-secondary">Operation completed (details unavailable)</span>
        `;
        logElement.insertBefore(logEntry, logElement.firstChild);
    }
}
