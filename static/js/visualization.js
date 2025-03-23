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
    
    // Clear any previous content
    gridElement.innerHTML = '';
    
    try {
        // Create memory cells
        if (!state.memory || !Array.isArray(state.memory)) {
            throw new Error('Invalid memory structure: memory is not an array');
        }
        
        const gridContainer = document.createElement('div');
        gridContainer.className = 'memory-grid-container';
        gridContainer.style.display = 'flex';
        gridContainer.style.flexWrap = 'wrap';
        gridContainer.style.gap = '3px';
        gridContainer.style.padding = '10px';
        
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
        
        // Add debug info for development
        const debugInfo = document.createElement('div');
        debugInfo.className = 'memory-debug-info text-muted small mt-2';
        debugInfo.textContent = `Memory size: ${state.memory_size} bytes, Page size: ${state.page_size} bytes, Frames: ${state.memory.length}`;
        
        // Add grid container to the DOM
        gridElement.appendChild(gridContainer);
        gridElement.appendChild(debugInfo);
        
        // Add direct styles to ensure visibility
        const cells = gridElement.querySelectorAll('.memory-cell');
        cells.forEach(cell => {
            // Ensure cells are visible with inline styles
            cell.style.display = 'inline-block';
            cell.style.width = '30px';
            cell.style.height = '30px';
            cell.style.margin = '2px';
            cell.style.textAlign = 'center';
            cell.style.lineHeight = '30px';
            cell.style.fontWeight = 'bold';
            cell.style.fontSize = '0.8rem';
            cell.style.borderRadius = '3px';
            
            // Apply color based on class
            if (cell.classList.contains('free')) {
                cell.style.backgroundColor = '#495057'; // gray-700
                cell.style.color = '#adb5bd';
            } else if (cell.classList.contains('allocated')) {
                cell.style.backgroundColor = '#198754'; // success
                cell.style.color = 'white';
            } else if (cell.classList.contains('fault')) {
                cell.style.backgroundColor = '#dc3545'; // danger
                cell.style.color = 'white';
            }
        });
        
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
    
    console.log('Updating memory visualization with state:', state);
    
    // Check if we need to completely reinitialize the grid
    const gridContainer = document.querySelector('.memory-grid-container');
    const cells = document.querySelectorAll('.memory-cell');
    
    // If the grid doesn't exist or cell count doesn't match,
    // reinitialize the entire grid
    if (!gridContainer || cells.length !== state.memory.length) {
        try {
            console.log('Memory grid missing or size mismatch, reinitializing...');
            initializeMemoryGrid(state);
            return;
        } catch (error) {
            console.error('Failed to initialize memory grid:', error);
            return;
        }
    }
    
    try {
        // Update each cell with direct styling to ensure visibility
        state.memory.forEach((frame, index) => {
            if (index < cells.length) {
                const cell = cells[index];
                if (!cell) return; // Skip if cell doesn't exist
                
                // Check if state changed
                const oldStatus = cell.className.replace('memory-cell ', '').replace(' fault', '').replace(' pulse', '');
                const newStatus = frame.status || 'free';
                
                // Always update to ensure styles are applied
                // Update class and content
                cell.className = `memory-cell ${newStatus}`;
                cell.textContent = newStatus === 'allocated' ? (frame.id || '') : '';
                
                // Ensure styles are applied directly
                cell.style.display = 'inline-block';
                cell.style.width = '30px';
                cell.style.height = '30px';
                cell.style.margin = '2px';
                cell.style.textAlign = 'center';
                cell.style.lineHeight = '30px';
                cell.style.fontWeight = 'bold';
                cell.style.fontSize = '0.8rem';
                cell.style.borderRadius = '3px';
                
                // Apply color based on class
                if (cell.classList.contains('free')) {
                    cell.style.backgroundColor = '#495057'; // gray-700
                    cell.style.color = '#adb5bd';
                } else if (cell.classList.contains('allocated')) {
                    cell.style.backgroundColor = '#198754'; // success
                    cell.style.color = 'white';
                } else if (cell.classList.contains('fault')) {
                    cell.style.backgroundColor = '#dc3545'; // danger
                    cell.style.color = 'white';
                }
                
                // Animation for state change (only if state changed)
                if (oldStatus !== newStatus || 
                    (newStatus === 'allocated' && cell.textContent != frame.id)) {
                    // Add a temporary border for visual indicator of change
                    cell.style.border = '2px solid #fff';
                    setTimeout(() => {
                        try {
                            if (cell) {
                                cell.style.border = 'none';
                            }
                        } catch (e) {
                            // Ignore errors in setTimeout callbacks
                        }
                    }, 1000);
                }
            }
        });
        
        // Update memory debug info
        const debugInfo = document.querySelector('.memory-debug-info');
        if (debugInfo) {
            debugInfo.textContent = `Memory size: ${state.memory_size} bytes, Page size: ${state.page_size} bytes, Frames: ${state.memory.length}`;
        }
        
        // Check for page faults in the last operation
        const operations = state.operations;
        if (operations && operations.length > 0) {
            const lastOp = operations[operations.length - 1];
            
            if (lastOp && lastOp.type === 'access' && lastOp.result === 'fault' && 
                typeof lastOp.address === 'number' && typeof state.page_size === 'number') {
                
                // Highlight the frame where the fault occurred
                const frameNum = Math.floor(lastOp.address / state.page_size);
                if (frameNum >= 0 && frameNum < cells.length && cells[frameNum]) {
                    cells[frameNum].style.backgroundColor = '#dc3545'; // danger
                    cells[frameNum].style.color = 'white';
                    cells[frameNum].style.animation = 'blink 1s ease-in-out';
                    
                    setTimeout(() => {
                        try {
                            if (cells[frameNum]) {
                                if (cells[frameNum].classList.contains('allocated')) {
                                    cells[frameNum].style.backgroundColor = '#198754'; // success
                                } else {
                                    cells[frameNum].style.backgroundColor = '#495057'; // gray-700
                                }
                                cells[frameNum].style.animation = 'none';
                            }
                        } catch (e) {
                            // Ignore errors in setTimeout callbacks
                        }
                    }, 2000);
                }
            }
        }
        
        console.log('Memory visualization updated successfully');
    } catch (error) {
        console.error('Error updating memory visualization:', error);
        // Try to recover by reinitializing the grid
        try {
            initializeMemoryGrid(state);
        } catch (e) {
            console.error('Failed to reinitialize grid after error:', e);
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
