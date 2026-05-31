document.addEventListener('DOMContentLoaded', () => {
    fetchLabs();
});

async function fetchLabs() {
    const container = document.getElementById('labs-container');
    container.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const response = await fetch('/api/labs');
        const labs = await response.json();
        
        container.innerHTML = '';
        
        if (labs.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No labs found. Please check your docker-compose.yml configuration.</p>';
            return;
        }
        
        labs.forEach(lab => {
            const card = createLabCard(lab);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error fetching labs:', error);
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--danger-color);">Error connecting to the Lab Manager API.</p>';
    }
}

function createLabCard(lab) {
    const template = document.getElementById('lab-card-template');
    const clone = template.content.cloneNode(true);
    const cardDiv = clone.querySelector('.lab-card');
    
    // Set text content
    clone.querySelector('.lab-name').textContent = lab.name;
    clone.querySelector('.lab-desc').textContent = lab.description;
    clone.querySelector('.lab-port span').textContent = lab.port || 'N/A';
    
    // Setup status
    const statusBadge = clone.querySelector('.status-badge');
    updateStatusBadge(statusBadge, lab.status);
    
    // Setup buttons
    const btnStart = clone.querySelector('.btn-start');
    const btnStop = clone.querySelector('.btn-stop');
    const btnOpen = clone.querySelector('.btn-open');
    
    if (lab.status === 'running') {
        btnStart.style.display = 'none';
        btnStop.style.display = 'inline-flex';
        if (lab.port) {
            btnOpen.style.display = 'inline-flex';
            // Use current hostname and lab port
            const currentHost = window.location.hostname;
            btnOpen.href = `http://${currentHost}:${lab.port}`;
        }
    } else {
        btnStart.style.display = 'inline-flex';
        btnStop.style.display = 'none';
        btnOpen.style.display = 'none';
    }
    
    // Add Event Listeners
    btnStart.addEventListener('click', () => handleLabAction(lab.id, 'start', statusBadge, btnStart, btnStop, btnOpen, lab.port));
    btnStop.addEventListener('click', () => handleLabAction(lab.id, 'stop', statusBadge, btnStart, btnStop, btnOpen, lab.port));
    
    return cardDiv;
}

function updateStatusBadge(badge, status) {
    badge.className = 'status-badge'; // Reset classes
    if (status === 'running') {
        badge.classList.add('status-running');
        badge.textContent = 'Running';
    } else if (status === 'stopped') {
        badge.classList.add('status-stopped');
        badge.textContent = 'Stopped';
    } else if (status === 'loading') {
        badge.classList.add('status-loading');
        badge.textContent = 'Processing...';
    }
}

async function handleLabAction(labId, action, statusBadge, btnStart, btnStop, btnOpen, port) {
    // Set loading state
    updateStatusBadge(statusBadge, 'loading');
    btnStart.disabled = true;
    btnStop.disabled = true;
    
    try {
        const response = await fetch(`/api/labs/${labId}/${action}`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (response.ok && result.status === 'success') {
            if (action === 'start') {
                // Poll until running
                pollLabStatus(labId, statusBadge, btnStart, btnStop, btnOpen, port);
            } else {
                updateStatusBadge(statusBadge, 'stopped');
                btnStart.style.display = 'inline-flex';
                btnStop.style.display = 'none';
                btnOpen.style.display = 'none';
                btnStart.disabled = false;
                btnStop.disabled = false;
            }
        } else {
            alert(`Failed to ${action} lab: ${result.message}`);
            // Revert state
            updateStatusBadge(statusBadge, action === 'start' ? 'stopped' : 'running');
            btnStart.disabled = false;
            btnStop.disabled = false;
        }
    } catch (error) {
        console.error(`Error ${action}ing lab:`, error);
        alert(`An error occurred while trying to ${action} the lab.`);
        updateStatusBadge(statusBadge, action === 'start' ? 'stopped' : 'running');
        btnStart.disabled = false;
        btnStop.disabled = false;
    }
}

async function pollLabStatus(labId, statusBadge, btnStart, btnStop, btnOpen, port) {
    const maxRetries = 60; // Poll for up to 5 minutes (5 sec interval)
    let retries = 0;
    
    const interval = setInterval(async () => {
        try {
            const response = await fetch('/api/labs');
            const labs = await response.json();
            const lab = labs.find(l => l.id === labId);
            
            if (lab && lab.status === 'running') {
                clearInterval(interval);
                updateStatusBadge(statusBadge, 'running');
                btnStart.style.display = 'none';
                btnStop.style.display = 'inline-flex';
                if (port) {
                    btnOpen.style.display = 'inline-flex';
                    const currentHost = window.location.hostname;
                    btnOpen.href = `http://${currentHost}:${port}`;
                }
                btnStart.disabled = false;
                btnStop.disabled = false;
            } else if (retries >= maxRetries) {
                clearInterval(interval);
                alert(`Timed out waiting for ${labId} to start. It may still be pulling the image.`);
                btnStart.disabled = false;
                btnStop.disabled = false;
                // keep loading status or revert to stopped? Let user refresh.
            }
            retries++;
        } catch (e) {
            console.error("Error polling lab status:", e);
        }
    }, 5000);
}
