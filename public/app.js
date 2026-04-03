let map;
let allThreats = [];
let markersLayer = L.layerGroup();
let currentTypeFilter = 'all';
let currentCountryFilter = 'all';
let currentTimeFilter = '48';
let autoRefreshInterval;

function initMap() {
    map = L.map('map', {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        worldCopyJump: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    markersLayer.addTo(map);
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

function createMarkerIcon(severity) {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="marker-pulse ${severity}"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });
}

function populateCountryFilter(threats) {
    const select = document.getElementById('country-filter');
    const countries = [...new Set(threats.map(t => t.country))].filter(c => c !== 'Unknown').sort();
    select.innerHTML = '<option value="all">All Countries</option>';
    countries.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
    });
}

function applyFilters() {
    const now = new Date();
    const timeLimit = now.getTime() - (parseInt(currentTimeFilter) * 60 * 60 * 1000);

    return allThreats.filter(threat => {
        const typeMatch = currentTypeFilter === 'all' || threat.type === currentTypeFilter;
        const countryMatch = currentCountryFilter === 'all' || threat.country === currentCountryFilter;
        const threatTime = new Date(threat.timestamp).getTime();
        const timeMatch = threatTime >= timeLimit;
        return typeMatch && countryMatch && timeMatch;
    });
}

function updateStats(filteredThreats) {
    document.getElementById('stat-total').textContent = filteredThreats.length;

    if (filteredThreats.length === 0) {
        document.getElementById('stat-top-type').textContent = '-';
        document.getElementById('stat-top-country').textContent = '-';
        return;
    }

    const types = {};
    const countries = {};
    filteredThreats.forEach(t => {
        types[t.type] = (types[t.type] || 0) + 1;
        countries[t.country] = (countries[t.country] || 0) + 1;
    });

    let topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
    let topCountry = Object.entries(countries).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    document.getElementById('stat-top-type').textContent = topType.charAt(0).toUpperCase() + topType.slice(1);
    document.getElementById('stat-top-country').textContent = topCountry;
}

function updateUI() {
    const filteredThreats = applyFilters();
    filteredThreats.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    markersLayer.clearLayers();
    const listContainer = document.getElementById('threat-list');
    listContainer.innerHTML = '';

    updateStats(filteredThreats);

    filteredThreats.forEach(threat => {
        const marker = L.marker([threat.lat, threat.lng], {
            icon: createMarkerIcon(threat.severity)
        });

        const popupContent = `
            <div class="custom-popup">
                <h3 class="${threat.severity}">${threat.type.toUpperCase()}</h3>
                <p><strong>${threat.title}</strong></p>
                <p>${threat.description}</p>
                <p><a href="${threat.url}" target="_blank" rel="noopener noreferrer">View Source</a></p>
                <div class="popup-meta">
                    <div>📍 ${threat.country}</div>
                    <div>⏱️ ${new Date(threat.timestamp).toLocaleString()}</div>
                </div>
            </div>
        `;

        marker.bindPopup(popupContent);
        markersLayer.addLayer(marker);

        const listItem = document.createElement('div');
        listItem.className = `threat-item ${threat.severity}`;
        listItem.innerHTML = `
            <div class="threat-meta">
                <span class="threat-type ${threat.severity}">${threat.type}</span>
                <span class="threat-time">${timeAgo(threat.timestamp)}</span>
            </div>
            <div class="threat-title">${threat.title}</div>
            <div class="threat-country">📍 ${threat.country}</div>
        `;

        listItem.addEventListener('click', () => {
            map.setView([threat.lat, threat.lng], 5);
            marker.openPopup();
        });

        listContainer.appendChild(listItem);
    });
}

async function fetchThreatData() {
    const loadingEl = document.getElementById('map-loading');
    loadingEl.classList.remove('hidden');

    try {
        const response = await fetch('/api/threats');
        if (!response.ok) throw new Error('Network response was not ok');

        allThreats = await response.json();
        populateCountryFilter(allThreats);
        updateUI();
    } catch (error) {
        console.error('Error fetching threat data:', error);
    } finally {
        loadingEl.classList.add('hidden');
    }
}

function setupEventListeners() {
    document.getElementById('type-filter').addEventListener('change', (e) => {
        currentTypeFilter = e.target.value;
        updateUI();
    });

    document.getElementById('country-filter').addEventListener('change', (e) => {
        currentCountryFilter = e.target.value;
        if (currentCountryFilter !== 'all') {
            const countryThreats = allThreats.filter(t => t.country === currentCountryFilter);
            if (countryThreats.length > 0) {
                const avgLat = countryThreats.reduce((s, t) => s + t.lat, 0) / countryThreats.length;
                const avgLng = countryThreats.reduce((s, t) => s + t.lng, 0) / countryThreats.length;
                map.setView([avgLat, avgLng], 4);
            }
        } else {
            map.setView([20, 0], 2);
        }
        updateUI();
    });

    document.getElementById('time-filter').addEventListener('change', (e) => {
        currentTimeFilter = e.target.value;
        updateUI();
    });

    document.getElementById('refresh-btn').addEventListener('click', () => {
        fetchThreatData();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupEventListeners();
    fetchThreatData();

    autoRefreshInterval = setInterval(fetchThreatData, 5 * 60 * 1000);
});
