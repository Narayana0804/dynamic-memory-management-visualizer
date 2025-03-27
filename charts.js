/**
 * Charts for memory visualization
 */

// Chart global variables
let utilizationChart = null;
let utilizationData = {
    labels: [],
    allocated: [],
    free: []
};

/**
 * Initialize the memory utilization chart
 */
function initUtilizationChart() {
    try {
        const canvas = document.getElementById('utilization-chart');
        if (!canvas) {
            console.error('Cannot find utilization-chart canvas element');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Failed to get 2d context from canvas');
            return;
        }
        
        // Reset data
        utilizationData = {
            labels: ['Start'],
            allocated: [0],
            free: [100]
        };
        
        // Destroy existing chart if it exists
        if (utilizationChart) {
            try {
                utilizationChart.destroy();
            } catch (error) {
                console.error('Error destroying existing chart:', error);
            }
        }
        
        // Check if Chart is available
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded. Please check the script inclusion.');
            
            // Show error message in the chart area
            const chartContainer = canvas.parentElement;
            if (chartContainer) {
                chartContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Chart.js library not loaded. Unable to display chart.
                    </div>
                `;
            }
            return;
        }
        
        console.log('Creating utilization chart...');
        
        // Create new chart with simplified options first
        utilizationChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: utilizationData.labels,
                datasets: [
                    {
                        label: 'Allocated Memory (%)',
                        data: utilizationData.allocated,
                        backgroundColor: 'rgba(40, 167, 69, 0.7)'
                    },
                    {
                        label: 'Free Memory (%)',
                        data: utilizationData.free,
                        backgroundColor: 'rgba(108, 117, 125, 0.7)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
        
        console.log('Utilization chart created successfully');
    } catch (error) {
        console.error('Error initializing utilization chart:', error);
        
        // Show error in HTML instead of failing silently
        const container = document.getElementById('utilization-chart').parentElement;
        if (container) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Unable to initialize chart: ${error.message}
                </div>
            `;
        }
    }
}

/**
 * Update the utilization chart with new data
 * @param {Object} state - Current memory state
 */
function updateUtilizationChart(state) {
    try {
        if (!state) {
            console.warn('Cannot update utilization chart: state is null or undefined');
            return;
        }
        
        if (!utilizationChart) {
            console.warn('Cannot update utilization chart: chart not initialized');
            // Try to reinitialize chart
            initUtilizationChart();
            if (!utilizationChart) return;
        }
        
        // Make sure state has required properties
        if (!state.memory || !Array.isArray(state.memory) || !state.total_frames) {
            console.warn('Cannot update utilization chart: invalid state structure', state);
            return;
        }
        
        console.log('Updating utilization chart with state:', state);
        
        // Calculate utilization
        const allocatedFrames = state.memory.filter(frame => frame.status === 'allocated').length;
        const totalFrames = state.total_frames;
        const allocatedPercent = (allocatedFrames / totalFrames * 100).toFixed(1);
        const freePercent = (100 - allocatedPercent).toFixed(1);
        
        // Add new data point
        const operationCount = state.operations ? state.operations.length : utilizationData.labels.length;
        const operationLabel = `Op ${operationCount}`;
        
        // Only add a new point if we have a new operation
        if (utilizationData.labels.length === 0 || 
            utilizationData.labels[utilizationData.labels.length - 1] !== operationLabel) {
            
            utilizationData.labels.push(operationLabel);
            utilizationData.allocated.push(parseFloat(allocatedPercent));
            utilizationData.free.push(parseFloat(freePercent));
            
            // Keep chart data limited to the last 10 points
            if (utilizationData.labels.length > 10) {
                utilizationData.labels.shift();
                utilizationData.allocated.shift();
                utilizationData.free.shift();
            }
            
            // Update chart safely
            try {
                utilizationChart.data.labels = utilizationData.labels;
                utilizationChart.data.datasets[0].data = utilizationData.allocated;
                utilizationChart.data.datasets[1].data = utilizationData.free;
                utilizationChart.update();
                console.log('Chart updated successfully');
            } catch (error) {
                console.error('Error updating chart:', error);
            }
        }
    } catch (error) {
        console.error('Error in updateUtilizationChart:', error);
    }
}

/**
 * Reset the utilization chart
 */
function resetUtilizationChart() {
    try {
        if (utilizationChart) {
            try {
                utilizationChart.destroy();
            } catch (error) {
                console.error('Error destroying chart:', error);
            } finally {
                utilizationChart = null;
            }
        }
        
        // Reset data
        utilizationData = {
            labels: [],
            allocated: [],
            free: []
        };
        
        const canvas = document.getElementById('utilization-chart');
        if (!canvas) {
            console.error('Cannot find utilization-chart canvas element');
            return;
        }
        
        try {
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error('Failed to get 2d context from canvas');
                return;
            }
            
            // Check if Chart is available
            if (typeof Chart === 'undefined') {
                console.error('Chart.js is not loaded. Please check the script inclusion.');
                return;
            }
            
            console.log('Resetting utilization chart...');
            
            // Create a new empty chart with minimal configuration to avoid errors
            utilizationChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Start'],
                    datasets: [
                        {
                            label: 'Allocated Memory (%)',
                            data: [0],
                            backgroundColor: 'rgba(40, 167, 69, 0.7)'
                        },
                        {
                            label: 'Free Memory (%)',
                            data: [100],
                            backgroundColor: 'rgba(108, 117, 125, 0.7)'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
            
            console.log('Utilization chart reset successfully');
        } catch (error) {
            console.error('Error creating reset chart:', error);
            
            // Show empty placeholder instead of erroring out
            const placeholder = `
                <div class="d-flex justify-content-center align-items-center" style="height: 150px;">
                    <div class="text-muted">
                        <i class="fas fa-chart-bar fa-2x mb-2"></i>
                        <p>Memory utilization chart will appear here.</p>
                    </div>
                </div>
            `;
            
            const container = canvas.parentElement;
            if (container) {
                container.innerHTML = placeholder;
            }
        }
    } catch (error) {
        console.error('Error in resetUtilizationChart:', error);
    }
}
