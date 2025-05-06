document.addEventListener("DOMContentLoaded", () => {
  const goButton = document.getElementById("go-button");
  const moreInfoButton = document.getElementById("more-info-button");
  const toggleTableButton = document.getElementById("toggle-table-button");
  const boroughEl = document.getElementById("borough");
  const factorEl = document.getElementById("factor");
  const yearEl = document.getElementById("year");
  const yearVal = document.getElementById("year-value");
  const table = document.getElementById("data-table");
  const heading = document.getElementById("data-heading");
  const downloadLink = document.getElementById("download-link");
  const factorDescriptionEl = document.getElementById("factor-description");
  const infoSection = document.getElementById("info-section");
  const dataSection = document.getElementById("data-section");

  // Update slider value in real time
  yearEl.addEventListener("input", () => {
    yearVal.innerText = yearEl.value;
  });

  // Initialize the map centered on London
  const map = L.map('map').setView([51.5074, -0.1278], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let geoLayer;
  // Load GeoJSON for London boroughs
  fetch('/static/london_boroughs.geojson')
    .then(response => response.json())
    .then(data => {
      geoLayer = L.geoJSON(data, {
        style: {
          color: 'blue',
          weight: 2,
          fillColor: 'lightblue',
          fillOpacity: 0.5
        },
        onEachFeature: (feature, layer) => {
          layer.on("click", () => {
            // Set the borough dropdown to the clicked borough
            boroughEl.value = feature.properties.name;
            updateData(); // Update data when the borough is clicked

            // Reset all styles and highlight the selected borough
            geoLayer.eachLayer(l => geoLayer.resetStyle(l));
            layer.setStyle({
              color: 'red',
              weight: 3,
              fillColor: 'pink',
              fillOpacity: 0.7
            });
            map.fitBounds(layer.getBounds());
          });
        }
      }).addTo(map);
    })
    .catch(error => console.error("Error loading GeoJSON:", error));

  // Function to update data when "Go" is pressed
  const updateData = () => {
    const borough = boroughEl.value;
    const factor = factorEl.value;
    const year = yearEl.value;
    yearVal.innerText = year;
    table.innerHTML = "<tr><td>Loading...</td></tr>";

    console.log("Fetching data for:", { borough, factor, year }); // Debug log

    // Highlight the selected borough if applicable
    if (geoLayer) {
      if (borough !== "London Total") {
        geoLayer.eachLayer(layer => {
          if (layer.feature.properties.name === borough) {
            geoLayer.eachLayer(l => geoLayer.resetStyle(l));
            layer.setStyle({
              color: 'red',
              weight: 3,
              fillColor: 'pink',
              fillOpacity: 0.7
            });
            map.fitBounds(layer.getBounds());
          }
        });
      } else {
        geoLayer.eachLayer(l => geoLayer.resetStyle(l));
      }
    }

    // Fetch the relevant data from the backend
    fetch("/get_data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borough, factor, year })
    })
    .then(res => res.json())
    .then(res => {
      console.log("Received data:", res); // Debug log
      const data = res.records || [];
      const unit = res.unit || "";
      const desc = res.description || "";

      heading.textContent = `${factor} Data — ${borough} (${year}) [${unit}]`;
      factorDescriptionEl.textContent = desc;

      if (data.length === 0) {
        console.warn("No data received from backend");
        table.innerHTML = "<tr><td>No data available</td></tr>";
        return;
      }

      // Build table headers and rows
      const headers = Object.keys(data[0]);
      let html = "<tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr>";
      data.forEach(row => {
        html += "<tr>" + headers.map(h => `<td>${row[h]}</td>`).join("") + "</tr>";
      });
      table.innerHTML = html;

      // Build CSV string for download
      const csv = [headers.join(",")].concat(
        data.map(row => headers.map(h => row[h]).join(","))
      ).join("\n");

      downloadLink.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
      downloadLink.download = `${factor.replace(/ /g, '_')}_${borough.replace(/ /g, '_')}_${year}.csv`;

      console.log("CSV string:", csv); // Debug log for CSV string
    })
    .catch(error => {
      console.error("Error updating data:", error);
      table.innerHTML = "<tr><td>Error loading data. Please try again.</td></tr>";
    });
  };

  // Bind event listener to "Go" button
  if (goButton) {
    goButton.addEventListener("click", updateData);
  }

  // "Click for More Info" button toggles the info overlay section
  if (moreInfoButton) {
    moreInfoButton.addEventListener("click", () => {
      infoSection.classList.toggle("hidden");
    });
  }

  // Toggle the display of the data table via class toggling
  if (toggleTableButton) {
    toggleTableButton.addEventListener("click", () => {
      dataSection.classList.toggle("hidden");
      if (dataSection.classList.contains("hidden")) {
        toggleTableButton.textContent = "Show Data Table";
      } else {
        toggleTableButton.textContent = "Hide Data Table";
      }
    });
  }
});