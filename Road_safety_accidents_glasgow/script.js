// Set base map and load data
mapboxgl.accessToken =
  "pk.eyJ1IjoiY2ljaTQxIiwiYSI6ImNsY3BjbmxqdzBoZTEzeGxhZnkzanY4MnMifQ.75zEsFo4CkWFqpM64jnAng";

const map = new mapboxgl.Map({
  container: "map", // container element id
  style: "mapbox://styles/cici41/cldfu2ekr001z01lfpcy6cyrv",
  center: [-4.2518, 55.8642], // initial map center in [lon, lat]
  zoom: 11
});

const data_url =
  "https://api.mapbox.com/datasets/v1/cici41/cldgdnkay01n920s8loc9aazk/features?access_token=pk.eyJ1IjoiY2ljaTQxIiwiYSI6ImNsY3BjbmxqdzBoZTEzeGxhZnkzanY4MnMifQ.75zEsFo4CkWFqpM64jnAng";

map.on("load", () => {
  let filterTime = ["==", ["number", ["get", "time"]], 12];
  let filterYear = ["<=", ["number", ["get", "year"]], 2022];

  map.addSource("data_url", {
    type: "geojson",
    data: data_url,
    generateId: true
  });

  map.addLayer({
    id: "accidents",
    type: "circle",
    source: "data_url",
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["number", ["get", "casualties"]],
        0,
        7,
        14,
        20,
        28,
        30
      ],
      "circle-color": [
        "interpolate",
        ["linear"],
        ["number", ["get", "casualties"]],
        1,
        "#FFCD6D",
        2,
        "#FFA87B",
        3,
        "#E98D8A",
        4,
        "#BE7B90",
        5,
        "#8E6D87",
        6,
        "#7A7299",
        7,
        "#5779A3",
        10,
        "#21819F",
        29,
        "#00858C"
      ],
      "circle-opacity": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        1,
        0.6
      ]
    }
  });

  //time slider interaction
  document.getElementById("slider").addEventListener("input", (event) => {
    const time = parseInt(event.target.value);
    // update the map

    // map.setFilter("accidents", ["==", ["number", ["get", "time"]], time]);
    filterTime = ["==", ["number", ["get", "time"]], time];
    map.setFilter("accidents", ["all", filterTime, filterYear]);

    // converting 1-24 hour to AMPM format
    const ampm = time >= 12 ? "PM" : "AM";
    const time12 = time % 12 ? time % 12 : 12;

    // update text in the UI
    document.getElementById("active-time").innerText = time12 + ampm;
  });

  //Radio button interaction code goes below
  document.getElementById("filters").addEventListener("change", (event) => {
    const year = event.target.value;
    //console.log(year);

    // update the map filter
    if (year == "all") {
      filterYear = ["<=", ["number", ["get", "year"]], 2022];
    } else if (year == "2016") {
      //filterTime = ["==", ["number", ["get", "time"]], time];
      // filterYear = ["==", ["number", ["get", "year"]], year];
      filterYear = ["==", ["number", ["get", "year"]], 2016];
    } else if (year == "2017") {
      filterYear = ["==", ["number", ["get", "year"]], 2017];
    } else if (year == "2018") {
      filterYear = ["==", ["number", ["get", "year"]], 2018];
    } else if (year == "2019") {
      filterYear = ["==", ["number", ["get", "year"]], 2019];
    } else if (year == "2020") {
      filterYear = ["==", ["number", ["get", "year"]], 2020];
    } else if (year == "2021") {
      filterYear = ["==", ["number", ["get", "year"]], 2021];
    } else {
      console.log("error");
    }
    map.setFilter("accidents", ["all", filterTime, filterYear]);
  });
});

// add a listener for click map
map.on("click", (event) => {
  //click on one of circle to get information
  const features = map.queryRenderedFeatures(event.point, {
    layers: ["accidents"] // replace with your layer name
  });
  if (!features.length) {
    return;
  }
  const feature = features[0];

  /*
      Create a popup for circle information
   */
  const popup = new mapboxgl.Popup({ offset: [0, -10], className: "my-popup" })
    .setLngLat(feature.geometry.coordinates)
    .setHTML(
      `<h3>Accidents Severity: ${feature.properties.severity}</h3>
    <p>Casualty Type: ${feature.properties.casualty_type}</p>  
    <p>Weather Conditions: ${feature.properties.weather}</p>
    <p>Road Conditions: ${feature.properties.road_surface}</p>  
    <p>Light Conditions: ${feature.properties.light}</p>`
    )
    .addTo(map);

  /*
  Fly to popup when clicked 
  */
  map.flyTo({
    center: feature.geometry.coordinates,
    zoom: 15,
    speed: 0.3,
    curve: 2
  });
});

// change the mouse style and opacity of circle color when hover
let hoveredStateId = null;

map.on("mousemove", "accidents", (e) => {
  map.getCanvas().style.cursor = "pointer";
  hoveredStateId = e.features[0].id;
  if (e.features.length > 0) {
    if (hoveredStateId !== null) {
      map.setFeatureState(
        {
          source: "data_url",

          id: hoveredStateId
        },
        { hover: false }
      );
    }

    map.setFeatureState(
      { source: "data_url", id: hoveredStateId },
      { hover: true }
    );
  }
});

map.on("mouseleave", "accidents", () => {
  map.getCanvas().style.cursor = "";
  if (hoveredStateId !== null) {
    map.setFeatureState(
      { source: "data_url", id: hoveredStateId },
      { hover: false }
    );
  }
  hoveredStateId = null;
});

//Add controls to the map
/*
  Add a geocoder search control
  */
const geocoder = new MapboxGeocoder({
  // Initialize the geocoder
  accessToken: mapboxgl.accessToken, // Set the access token
  mapboxgl: mapboxgl, // Set the mapbox-gl instance
  marker: false, // Do not use the default marker style
  placeholder: "Search for places in Glasgow", // Placeholder text for the search bar
  proximity: {
    longitude: 55.8642,
    latitude: 4.2518
  } // Coordinates of Glasgow center
});

map.addControl(geocoder, "top-right");

/*
  Add a navigation control
  */
map.addControl(new mapboxgl.NavigationControl(), "top-right");

map.addControl(
  new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true,
    showUserHeading: true
  }),
  "top-right"
);

//add barchart
am5.ready(function () {
  // Create root element
  var root = am5.Root.new("chartdiv");

  // Set themes
  root.setThemes([am5themes_Animated.new(root)]);

  // Create chart
  var chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panX: true,
      panY: true,
      wheelX: "panX",
      wheelY: "zoomX",
      pinchZoomX: true
    })
  );

  // Add cursor
  var cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
  cursor.lineY.set("visible", false);

  // Create axes
  var xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 30 });
  xRenderer.labels.template.setAll({
    rotation: -90,
    centerY: am5.p50,
    centerX: am5.p100,
    paddingRight: 15
  });

  xRenderer.grid.template.setAll({
    location: 1
  });

  var xAxis = chart.xAxes.push(
    am5xy.CategoryAxis.new(root, {
      maxDeviation: 0.3,
      categoryField: "year",
      renderer: xRenderer,
      tooltip: am5.Tooltip.new(root, {})
    })
  );

  var yAxis = chart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      maxDeviation: 0.3,
      renderer: am5xy.AxisRendererY.new(root, {
        strokeOpacity: 0.1
      })
    })
  );

  // Create series
  var series = chart.series.push(
    am5xy.ColumnSeries.new(root, {
      name: "Series 1",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "value",
      sequencedInterpolation: true,
      categoryXField: "year",
      tooltip: am5.Tooltip.new(root, {
        labelText: "{valueY}"
      })
    })
  );

  series.columns.template.setAll({
    cornerRadiusTL: 5,
    cornerRadiusTR: 5,
    strokeOpacity: 0
  });
  series.columns.template.adapters.add("fill", function (fill, target) {
    return chart.get("colors").getIndex(series.columns.indexOf(target));
  });

  series.columns.template.adapters.add("stroke", function (stroke, target) {
    return chart.get("colors").getIndex(series.columns.indexOf(target));
  });

  // Set data
  var data = [
    {
      year: "2016",
      value: 1569
    },
    {
      year: "2017",
      value: 1330
    },
    {
      year: "2018",
      value: 1138
    },
    {
      year: "2019",
      value: 161
    },
    {
      year: "2020",
      value: 721
    },
    {
      year: "2021",
      value: 697
    }
  ];

  xAxis.data.setAll(data);
  series.data.setAll(data);

  // Make stuff animate on load
  series.appear(1000);
  chart.appear(1000, 100);
}); // end am5.ready()