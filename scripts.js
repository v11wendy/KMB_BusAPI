document.addEventListener('DOMContentLoaded', function() {
    const routeList = document.getElementById('routeList');
    const searchBar = document.getElementById('searchBar');
    const routeDetails = document.getElementById('routeDetails');
    const routeInfo = document.getElementById('routeInfo');
    const stopsList = document.getElementById('stopsList');
    const backButton = document.getElementById('backButton');
    const popup = document.getElementById('popup');
    const popupContent = document.getElementById('popupContent');
    const popupClose = document.getElementById('popupClose');
    const outboundButton = document.getElementById('outboundButton');
    const inboundButton = document.getElementById('inboundButton');

    let allRoutes = [];
    let currentRoute = null;

    // Fetch all routes and display them
    fetch('https://data.etabus.gov.hk/v1/transport/kmb/route/')
        .then(response => response.json())
        .then(data => {
            allRoutes = data.data;
            displayRoutes(allRoutes);
        })
        .catch(error => console.error('Error fetching route list:', error));

    // Display the routes in the routeList section
    function displayRoutes(routes) {
        routeList.innerHTML = '';
        routes.forEach(route => {
            const routeItem = document.createElement('div');
            routeItem.className = 'routeItem';
            routeItem.textContent = `Route: ${route.route} - ${route.orig_en} to ${route.dest_en}`;
            routeItem.addEventListener('click', () => fetchRouteDetails(route.route));
            routeList.appendChild(routeItem);
        });
    }

    // Fetch and display the route details and stops
    function fetchRouteDetails(route) {
        currentRoute = route;
        fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route/${route}/outbound/1`)
            .then(response => response.json())
            .then(dataOutbound => {
                fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route/${route}/inbound/1`)
                    .then(response => response.json())
                    .then(dataInbound => {
                        routeList.style.display = 'none';
                        routeDetails.style.display = 'block';
                        routeInfo.textContent = `Route: ${route}`;
                        displayDirectionButtons(dataOutbound.data, dataInbound.data);
                        fetchAndDisplayStops(route, 'outbound');
                    });
            })
            .catch(error => {
                alert('Error fetching route details.');
                console.error('Error fetching route details:', error);
            });
    }

    // Display direction buttons
    function displayDirectionButtons(outboundData, inboundData) {
        outboundButton.textContent = `Outbound: ${outboundData.orig_en} to ${outboundData.dest_en}`;
        inboundButton.textContent = `Inbound: ${inboundData.orig_en} to ${inboundData.dest_en}`;

        outboundButton.onclick = () => fetchAndDisplayStops(currentRoute, 'outbound');
        inboundButton.onclick = () => fetchAndDisplayStops(currentRoute, 'inbound');
    }

    // Fetch and display stops for the selected direction
    function fetchAndDisplayStops(route, direction) {
        fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${route}/${direction}/1`)
            .then(response => response.json())
            .then(data => {
                displayStops(data.data);
            })
            .catch(error => {
                alert('Error fetching stops.');
                console.error('Error fetching stops:', error);
            });
    }

    // Display the stops in the stopsList section
    function displayStops(stops) {
        stopsList.innerHTML = '';
        stops.forEach(stop => {
            fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop/${stop.stop}`)
                .then(response => response.json())
                .then(stopData => {
                    const stopItem = document.createElement('div');
                    stopItem.classList.add('stopItem');
                    stopItem.textContent = stopData.data.name_en;
                    stopItem.addEventListener('click', () => fetchETA(stop.stop));
                    stopsList.appendChild(stopItem);
                });
        });
    }


    // Fetch the ETA for a specific stop and display it in a popup
    function fetchETA(stopId) {
        fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/${stopId}`)
            .then(response => response.json())
            .then(data => {
                const etaInfo = data.data.map(eta => {
                    if (eta.eta) {
                        const etaTime = new Date(eta.eta);
                        const minutes = Math.round((etaTime - new Date()) / 60000);
                        return `<tr><td>${eta.route}</td><td>${minutes} minutes</td></tr>`;
                    }
                }).join('');
                popupContent.innerHTML = `<table><tr><th>Route</th><th>ETA</th></tr>${etaInfo}</table>`;
                popup.style.display = 'flex';
            })
            .catch(error => {
                alert('Error fetching ETA.');
                console.error('Error fetching ETA:', error);
            });
    }

    // Event listeners
    backButton.addEventListener('click', () => {
        routeDetails.style.display = 'none';
        routeList.style.display = 'block';
    });

    popupClose.addEventListener('click', () => {
        popup.style.display = 'none';
    });

    searchBar.addEventListener('input', function() {
        const query = searchBar.value.toUpperCase();
        const filteredRoutes = allRoutes.filter(route => route.route.includes(query));
        displayRoutes(filteredRoutes);
    });
});
