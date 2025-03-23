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
    const ctx = document.getElementById('utilization-chart').getContext('2d');
    
    // Reset data
    utilizationData = {
        labels: [0],
        allocated: [0],
        free: [100]
    };
    
    // Destroy existing chart if it exists
    if (utilizationChart) {
        utilizationChart.destroy();
    }
    
    // Create new chart
    utilizationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: utilizationData.labels,
            datasets: [
                {
                    label: 'Allocated Memory (%)',
                    data: utilizationData.allocated,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Free Memory (%)',
                    data: utilizationData.free,
                    backgroundColor: 'rgba(108, 117, 125, 0.7)',
                    borderColor: 'rgba(108, 117, 125, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Operation'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Percentage (%)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

/**
 * Update the utilization chart with new data
 * @param {Object} state - Current memory state
 */
function updateUtilizationChart(state) {
    if (!state || !utilizationChart) return;
    
    // Calculate utilization
    const allocatedFrames = state.memory.filter(frame => frame.status === 'allocated').length;
    const totalFrames = state.total_frames;
    const allocatedPercent = (allocatedFrames / totalFrames * 100).toFixed(1);
    const freePercent = (100 - allocatedPercent).toFixed(1);
    
    // Add new data point
    const operationCount = state.operations.length;
    
    // Only add a new point if we have a new operation
    if (utilizationData.labels.length === 0 || 
        utilizationData.labels[utilizationData.labels.length - 1] < operationCount) {
        
        utilizationData.labels.push(operationCount);
        utilizationData.allocated.push(parseFloat(allocatedPercent));
        utilizationData.free.push(parseFloat(freePercent));
        
        // Keep chart data limited to the last 10 points
        if (utilizationData.labels.length > 10) {
            utilizationData.labels.shift();
            utilizationData.allocated.shift();
            utilizationData.free.shift();
        }
        
        // Update chart
        utilizationChart.data.labels = utilizationData.labels;
        utilizationChart.data.datasets[0].data = utilizationData.allocated;
        utilizationChart.data.datasets[1].data = utilizationData.free;
        utilizationChart.update();
    }
}

/**
 * Reset the utilization chart
 */
function resetUtilizationChart() {
    if (utilizationChart) {
        utilizationChart.destroy();
        utilizationChart = null;
    }
    
    // Reset data
    utilizationData = {
        labels: [],
        allocated: [],
        free: []
    };
    
    // Create an empty chart
    const ctx = document.getElementById('utilization-chart').getContext('2d');
    utilizationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Allocated Memory (%)',
                    data: [],
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Free Memory (%)',
                    data: [],
                    backgroundColor: 'rgba(108, 117, 125, 0.7)',
                    borderColor: 'rgba(108, 117, 125, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Operation'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Percentage (%)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    position: 'top'
                }
            }
        }
    });
}
