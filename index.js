import 'ol/ol.css';
import * as ol from './ol-bundle';
import * as d3 from './d3-bundle';
import jsPDF from 'jspdf';
import {toJpeg} from 'html-to-image';

// Layers desc
const layers = [
  {label: 'raster', index: 0, visible: false},
  {label: 'oceans', index: 1, visible: true},
  {label: 'lakes', index: 2, visible: true},
  {label: 'countries', index: 3, visible: false},
  {label: 'states', index: 4, visible: true},
  {label: 'marks', index: 5, visible: false},
  {label: 'clusers', index: 6, visible: true},
];

// Icons desc
// {label: '0', shape: 'circle', fill: 'black', stroke: 'black', text: 'white}
const icons = [
  {label: '0', shape: 'circle', fill: 'gray', stroke: 'white'},
  {label: 'A', shape: 'square', fill: 'red'},
  {label: 'B', shape: 'triangle', fill: 'green'},
  {label: 'C', shape: 'star', fill: 'blue'}
];

// Generate input
const sel = d3.select('#layers').selectAll('label').data(layers).enter()
sel.append('label')
    .text(d => d.label)
    .append('input')
      .attr('id', d => d.label)
      .attr('class', 'layers')
      .attr('type', 'checkbox')
      .attr('value', d => d.index)
      .property('checked', d => d.visible)

// Input listener
d3.select('#format').on('change', updateFormat)
d3.select('#resolution').on('change', updateResolution)
d3.select('#export-pdf').on('click', exportPDF)
d3.select('#coords').on('change', updateCoords)
d3.select('#radius').on('change', updateRadius)
d3.select('#distance').on('change', updateCoords)
d3.selectAll('.layers').on('change', updateLayers)
d3.select('#latitude').on('change', updateCenter)
d3.select('#longitude').on('change', updateCenter)
d3.select('#zoom').on('change', updateZoom)
d3.select('#water').on('change', updateColors)
d3.select('#land').on('change', updateColors)

// Constants
const fills = {
  red: new ol.Fill({ color: '#e41a1c' }),
  blue: new ol.Fill({ color: '#377eb8' }),
  green: new ol.Fill({ color: '#4daf4a' }),
  purple: new ol.Fill({ color: '#984ea3' }),
  orange: new ol.Fill({ color: '#ff7f00' }),
  yellow: new ol.Fill({ color: '#ffff33' }),
  brown: new ol.Fill({ color: '#a65628' }),
  pink: new ol.Fill({ color: '#f781bf' }),
  gray: new ol.Fill({ color: '#999999' })
}

const strokes = {
  black: new ol.Stroke({ color: '#000000' }),
  white: new ol.Stroke({ color: '#ffffff' })
}

const dims = {
  a0: [1189, 841],
  a1: [841, 594],
  a2: [594, 420],
  a3: [420, 297],
  a4: [297, 210],
  a5: [210, 148]
};

const exportOptions = {
  filter: function(element) {
    return element.className.indexOf('ol-control') === -1;
  }
};

// Icons array
let iconsMap = createIcons();

const markersStyle = function(feature) {
  let style;
  // get feature list
  const features = feature.get('features') ? feature.get('features') : [feature]
  // check number of types in the cluster
  const types = features.reduce((tot, r) => {
    if (!tot[r.get('type')]) { tot[r.get('type')]=0; }
    tot[r.get('type')]++;
    return tot;
  },{});
  // if only one feature
  if (Object.keys(types).length == 1) {
    style = iconsMap[features[0].get('type')];
  } else { // Else circle
    style = iconsMap['0'];
  }
  // Text
  if (features.length > 1) {
  style.getText().setText(features.length.toString());
  } else {
    style.getText().setText("1");
  }
  return style;
}

// Layers array
const layersArray = [
  // Raster
  new ol.TileLayer({
    name: layers[0].label,
    visible: layers[0].visible,
    source: new ol.OSMSource()
    
  }),
  // Ocean
  new ol.VectorLayer({
    name: layers[1].label,
    visible: layers[1].visible,
    source: new ol.VectorSource({
      url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_ocean.geojson",
      format: new ol.GeoJSON()
    })
  }),
  // Lakes
  new ol.VectorLayer({
    name: layers[2].label,
    visible: layers[2].visible,
    source: new ol.VectorSource({
      url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_lakes.geojson",
      format: new ol.GeoJSON()
    })
  }),
  // Countries
  new ol.VectorLayer({
    name: layers[3].label,
    visible: layers[3].visible,
    source: new ol.VectorSource({
      url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries_lakes.geojson",
      format: new ol.GeoJSON()
    })
  }),
  // States
  new ol.VectorLayer({
    name: layers[4].label,
    visible: layers[4].visible,
    source: new ol.VectorSource({
      url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces_lakes.geojson",
      format: new ol.GeoJSON()
    })
  }),
  // marks
  new ol.VectorLayer({
    name: layers[5].label,
    visible: layers[5].visible,
    source: createMarkersSource(),
    style: markersStyle
  }),
  // clusters
  new ol.VectorLayer({
    name: layers[6].label,
    visible: layers[6].visible,
    source: createClustersSource(),
    style: markersStyle
  })
]

// Create Map
const map = new ol.Map({
  view: new ol.View({
    center: [0, 0],
    zoom: 1
  }),
  layers: layersArray,
  target: 'map'
});
// Set div dimensions
updateFormat();
// Set Map center
updateCenter();
// Set Map Zoom
updateZoom();
// Set Layers
updateLayers();
// Set Colors
updateColors();

// Update functions
function updateFormat() {
  console.log('updateFormat')
  const format = d3.select('#format').node().value;
  var dim = dims[format];
  // set map size
  d3.select('#map')
    .style('width', `${dim[0]*2}px`)
    .style('height', `${dim[1]*2}px`)
  // Redraw map
  map.setSize([dim[0]*2, dim[1]*2])
}

function updateResolution() {
  console.log('updateResolution', 'NULL')
}

function exportPDF() {
  console.log('exportPDF')

  // exportButton.disabled = true;
  // document.body.style.cursor = 'progress';

  var format = d3.select('#format').node().value;
  var resolution = d3.select('#resolution').node().value;
  var radius = d3.select('#radius').node().value;
  var distance = d3.select('#distance').node().value;
  var dim = dims[format];
  var size = map.getSize();
  var viewResolution = map.getView().getResolution();
  // Compute scale
  var width = Math.round(dim[0] * resolution / 25.4);
  var height = Math.round(dim[1] * resolution / 25.4);
  var scale = Math.min(width / size[0], height / size[1]);
  // Scale map and markers
  exportOptions.width = width;
  exportOptions.height = height;
  map.setSize([width, height]);
  updateRadius(radius * scale, distance * scale);
  map.getView().setResolution(viewResolution / scale);
  // Save image
  map.once('rendercomplete', function() {
    toJpeg(map.getViewport(), exportOptions).then(function(dataUrl) {
      var pdf = new jsPDF('landscape', undefined, format);
      pdf.addImage(dataUrl, 'JPEG', 0, 0, dim[0], dim[1]);
      pdf.save('map.pdf');
      // Reset original map size
      map.setSize(size);
      updateRadius();
      map.getView().setResolution(viewResolution);
      // exportButton.disabled = false;
      // document.body.style.cursor = 'auto';
    });
  });
}

function updateCoords(val) {
  console.log('updateCoords', val)
  const distance = val ? val : d3.select('#distance').node().value
  // Re-Create layer sources with markers
  map.getLayers().item(5).setSource(createMarkersSource())
  map.getLayers().item(6).setSource(createClustersSource(distance))
}

function updateRadius(r, d) {
  console.log('updateRadius', r, d)
  const radius = r ? r : d3.select('#radius').node().value
  const distance = d ? d : d3.select('#distance').node().value 
  // Re-create icons
  iconsMap = createIcons(radius);
  updateCoords(distance);
}

// function updateDistance() {
//   console.log('updateDistance')
// }
// => updateCoords();

function updateLayers() {
  console.log('updateLayers')
  const mapLayers = map.getLayers();
  d3.selectAll('.layers').each(d => {
    d.visible = d3.select(`#${d.label}`).property('checked');
    mapLayers.item(d.index).setVisible(d.visible)
  })
}

function updateCenter() {
  console.log('updateCenter')
  map.getView().setCenter(
    ol.fromLonLat([
      Number(d3.select('#longitude').node().value),
      Number(d3.select('#latitude').node().value)
    ])
  )
}

function updateZoom() {
  console.log('updateZoom')
  map.getView().setZoom(Number(d3.select('#zoom').node().value))
}

function updateColors() {
  console.log('updateColors')
  fills['water'] = new ol.Fill({ color: d3.select('#water').node().value });
  fills['land'] = new ol.Fill({ color: d3.select('#land').node().value });
  // Re-Create layer styles with markers
  map.getLayers().item(1).setStyle(new ol.Style({ fill: fills['water'] }));
  map.getLayers().item(2).setStyle(new ol.Style({ fill: fills['water'] }));
  map.getLayers().item(3).setStyle(new ol.Style({ fill: fills['land'], stroke: strokes['black'] }));
  map.getLayers().item(4).setStyle(new ol.Style({ fill: fills['land'], stroke: strokes['black'] }));
}

function createMarkersSource() {
  console.log('createMarkersSource')
  const markers = d3.csvParse(d3.select('#coords').node().value).map(m => {
    // Create marker
    // Set Coordinate (We need to transform the coordinates from Longitude/Latitude to WebMercator)
    const marker = new ol.Feature(
      new ol.Point(
        ol.fromLonLat([
          Number(m['longitude']),
          Number(m['latitude'])
        ])
      )
    );
    // Set Type
    marker.set('type', m['type']);
    // Return
    return marker;
  });
  return new ol.VectorSource({ 
    features: markers
  });
}

function createClustersSource(val) {
  console.log('createClustersSource', val)
  const distance = val ? val : d3.select('#distance').node().value;
  const markers = d3.csvParse(d3.select('#coords').node().value).map(m => {
    // Create marker
    // Set Coordinate (We need to transform the coordinates from Longitude/Latitude to WebMercator)
    const marker = new ol.Feature(
      new ol.Point(
        ol.fromLonLat([
          Number(m['longitude']),
          Number(m['latitude'])
        ])
      )
    );
    // Set Type
    marker.set('type', m['type']);
    // Return
    return marker;
  });
  return new ol.ClusterSource({
    distance: distance,
    source: new ol.VectorSource({ 
      features: markers
    })
  });
}

function createIcons(val) {
  console.log('createIcons', val)
  const radius = val ? val : d3.select('#radius').node().value
  return icons.reduce((res, r) => {
    // Default
    const label = r.label ? r.label : '0';
    const shape = r.shape ? r.shape : 'circle';
    const fill = r.fill ? r.fill : 'black';
    const stroke = r.stroke ? r.stroke : 'black';
    const text = r.text ? r.text : 'white';
    // Shape
    let s;
    switch(shape) {
      case 'square': 
        s = new ol.Style({
          image: new ol.RegularShape({
            points: 4,
            angle: Math.PI / 4,
            fill: fills[fill],
            stroke: strokes[stroke],
            radius: radius
          })
        });
        break;
      case 'triangle': 
        s = new ol.Style({
          image: new ol.RegularShape({
            points: 3,
            rotation: Math.PI / 4,
            angle: 0,
            fill: fills[fill],
            stroke: strokes[stroke],
            radius: radius
          })
        });
        break;
      case 'star': 
        s = new ol.Style({
          image: new ol.RegularShape({
            points: 5,
            angle: 0,
            fill: fills[fill],
            stroke: strokes[stroke],
            radius: radius,
            radius2: radius / 2,
          })
        });
        break;
      default:
        s = new ol.Style({
          image: new ol.Circle({
            fill: fills[fill],
            stroke: strokes[stroke],
            radius: radius
          })
        });
    }
    // Text
    s.setText(new ol.Text({
      text: '',
      fill: strokes[text],
      stroke: strokes[text],
      font: radius + 'px sans-serif'
    }))
    // Return
    res[label] = s;
    return res;
  }, {});
}

// const style = (shape, fill, stroke = 'black', text = 'white') => {
//   let s;
//   switch(shape) {
//     case 'square': 
//       s = new ol.Style({
//         image: new ol.RegularShape({
//           fill: fills[fill],
//           stroke: strokes[stroke],
//           points: 4,
//           radius: inputRadius * inputRadius,
//           angle: Math.PI / 4
//          }),
//         text: new ol.Text({
//           text: ' ',
//           fill: strokes[text],
//           stroke: strokes[text]
//         })
//       });
//       break;
//     case 'triangle': 
//       s = new ol.Style({
//         image: new ol.RegularShape({
//           fill: fills[fill],
//           stroke: strokes[stroke],
//           points: 3,
//           radius: inputRadius * inputRadius,
//           rotation: Math.PI / 4,
//           angle: 0
//         }),
//         text: new ol.Text({
//           text: ' ',
//           fill: strokes[text],
//           stroke: strokes[text]
//         })
//       });
//       break;
//     case 'star': 
//       s = new ol.Style({
//         image: new ol.RegularShape({
//           fill: fills[fill],
//           stroke: strokes[stroke],
//           points: 5,
//           radius: inputRadius * inputRadius,
//           radius2: inputRadius * inputRadius / 2,
//           angle: 0
//         }),
//         text: new ol.Text({
//           text: ' ',
//           fill: strokes[text],
//           stroke: strokes[text]
//         })
//       });
//       break;
//     default:
//       s = new ol.Style({
//         image: new ol.Circle({
//           fill: fills[fill],
//           stroke: strokes[stroke],
//           radius: inputRadius * inputRadius
//         }),
//         text: new ol.Text({
//           text: ' ',
//           fill: strokes[text],
//           stroke: strokes[text]
//         })
//       });
//   }
//   return s;
// }

// const icons = {
//   0: style('default', 'gray', 'white'),
//   A: style('square', 'red'),
//   B: style('triangle', 'green'),
//   C: style('star', 'blue')
// }

// // Create Markers from coords
// const markers = d3.csvParse(inputCoords).map(p => {
//   // Create marker
//   // Set Coordinate (We need to transform the coordinates from Longitude/Latitude to WebMercator)
//   const marker = new ol.Feature(
//     new ol.Point(
//       ol.fromLonLat([
//         Number(p['longitude']),
//         Number(p['latitude'])
//       ])
//     )
//   );
//   // Set Type
//   marker.set('type', p['type']);
//   // Return
//   return marker;
// });

// // Styles
// const styleMarkers = function(feature) {
//   let style;
//   // get feature list
//   const features = feature.get('features') ? feature.get('features') : [feature]
//   // check number of types in the cluster
//   const types = features.reduce((tot, r) => {
//     if (!tot[r.get('type')]) { tot[r.get('type')]=0; }
//     tot[r.get('type')]++;
//     return tot;
//   },{});
//   // if only one feature
//   if (Object.keys(types).length == 1) {
//     style = icons[features[0].get('type')];
//   } else { // Else circle
//     style = icons[0];
//   }
//   // Text
//   if (features.length > 1) {
//   style.getText().setText(features.length.toString());
//   } else {
//     style.getText().setText("");
//   }
//   style.getImage().setScale(inferScale())
//   return style;
// }



// // Create Map
// const map = new ol.Map({
//   target: 'map',
//   layers: layersArray,
//   view: new ol.View({
//     center: ol.fromLonLat([
//       Number(inputLongitude),
//       Number(inputLatitude)
//     ]),
//     zoom: Number(inputZoom)
//   })
// });

// function updateResolution() {
//   inputResolution = Number(d3.select('#resolution').node().value);
// }

// function updateRadius() {
//   inputRadius = Number(d3.select('#radius').node().value);
//   Object.keys(icons).forEach(k => {
//     icons[k] = 
//   }) = {
//     0: style('default', 'gray', 'white'),
//     A: style('square', 'red'),
//     B: style('triangle', 'green'),
//     C: style('star', 'blue')
//   }
//   map.getLayers().changed()
// }

// function updateZoom() {
//   map.getView().setZoom(this.value)
// }

// function updateCenter() {
//   map.getView().setCenter(ol.fromLonLat([
//     Number(d3.select('#longitude').node().value),
//     Number(d3.select('#latitude').node().value)
//   ]))
// }

// function updateLayers() {
//   console.log('update layers')
//   const layers = map.getLayers();
//   d3.selectAll('.layers').each((d, i) => {
//     d.visible = d3.select(`#${d.label}`).property('checked');
//     console.log(d)
//     layers.item(d.index).setVisible(d.visible)
//   })
// }

// function inferScale() {
//   console.log('input radius', inputRadius );
//   console.log('resolution', inputResolution);
//   // Compute output dimensions
//   var dim = dims[inputPage];
//   console.log('dim', dim);
//   var width = Math.round(dim[0] * inputResolution / 25.4);
//   var height = Math.round(dim[1] * inputResolution / 25.4);
//   console.log('w h', width, height);
//   var size = map.getSize();
//   console.log('size', size);
//   var scaling = Math.min(width / size[0], height / size[1]);
//   console.log('scaling', scaling)
//   console.log('infer scale', scaling/inputRadius );
//   // var scale = Math.round(inputRadius * inputResolution / 25.4)
//   return scaling / inputRadius
// }

// function exportPDF() {
//   // Style button
//   d3.select('#export-pdf').node().disabled = true;
//   document.body.style.cursor = 'progress';
//   // Compute output dimensions
//   var dim = dims[inputPage];
//   var width = Math.round(dim[0] * inputResolution / 25.4);
//   var height = Math.round(dim[1] * inputResolution / 25.4);
//   // Save current map size
//   var size = map.getSize();
//   var resolution = map.getView().getResolution();
//   /**/
//   console.log('map size', map.getSize())
//   console.log('map zoom', map.getView().getZoom())
//   console.log('map resolution', map.getView().getResolution())
//   console.log('computed scale', Math.round(width / map.getSize()[0]))
//   // Resize markers
//   map.getLayers().changed()
//   // Generate printable map
//   map.once('rendercomplete', function() {
//     exportOptions.width = width;
//     exportOptions.height = height;
//     toJpeg(map.getViewport(), exportOptions)
//       .then(function(dataUrl) {
//         var pdf = new jsPDF({orientation: 'landscape', format: inputPage});
//         pdf.addImage(dataUrl, 'JPEG', 0, 0, dim[0], dim[1]);
//         pdf.save('map.pdf');
//         // Reset original map size
//         map.setSize(size);
//         map.getView().setResolution(resolution);
//         // Style button
//         d3.select('#export-pdf').node().disabled = false;
//         document.body.style.cursor = 'auto';
//       });
//   });

//   // Set print size
//   var printSize = [width, height];
//   map.setSize(printSize);
//   var scaling = Math.min(width / size[0], height / size[1]);
//   map.getView().setResolution(resolution / scaling);
//   console.log('scaling', scaling)


//   console.log('done')
// }
