// Initialize map and ThingSpeak integration
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser || !currentUser.channelId || !currentUser.apiKey) {
    alert('Device not properly paired. Please check your settings.');
    window.location.href = 'settings.html';
}

// Function to update coordinates display
function updateCoordinatesDisplay(lat, lng) {
    document.getElementById('latitude').textContent = lat.toFixed(6);
    document.getElementById('longitude').textContent = lng.toFixed(6);
    document.getElementById('update-time').textContent = new Date().toLocaleString();
}

// Initialize the map with the specific coordinates
let map = L.map('map').setView([13.2714227, 79.1198102], 15);

// Add OpenStreetMap tiles with satellite view
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: false
}).addTo(map);

// Create a marker with custom icon
const glassesIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Add marker at the specific coordinates
let marker = L.marker([13.2714227, 79.1198102], { icon: glassesIcon }).addTo(map);
marker.bindPopup('Smart Glasses Location<br>Lat: 13.2714227<br>Lng: 79.1198102').openPopup();

// Function to update map with ThingSpeak data
async function updateMap() {
    try {
        const response = await fetch(`https://api.thingspeak.com/channels/${currentUser.channelId}/feeds.json?api_key=${currentUser.apiKey}&results=1`);
        if (!response.ok) {
            throw new Error('Failed to fetch location data');
        }
        
        const data = await response.json();
        if (data.feeds && data.feeds.length > 0) {
            const latestFeed = data.feeds[0];
            const lat = parseFloat(latestFeed.field1);
            const lng = parseFloat(latestFeed.field2);
            
            if (!isNaN(lat) && !isNaN(lng)) {
                marker.setLatLng([lat, lng]);
                map.setView([lat, lng], 15);
                marker.getPopup().setContent(`Smart Glasses Location<br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`);
                marker.openPopup();
                updateCoordinatesDisplay(lat, lng);
                document.querySelector('.status-indicator').classList.remove('offline');
                document.getElementById('status-text').textContent = 'Device Online';
            }
        }
    } catch (error) {
        console.error('Error updating map:', error);
        document.querySelector('.status-indicator').classList.add('offline');
        document.getElementById('status-text').textContent = 'Device Offline';
    }
}



// Update map every 5 seconds
setInterval(updateMap, 5000);

// Initial update
updateMap();