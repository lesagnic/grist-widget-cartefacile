// Widget identification
//
const widgetName = "Grist Widget Carte Facile";
const widgetVersion = "1.0.16" // Increment at least last figure for new release
//
// Debug management
//
// Set debug to true to send log to the console
const debug = true;
// Debug message root
const widgetRootMsg = `${widgetName} v${widgetVersion} `;
// Debug message template to be used (Replace "Debug on" with your message)
if (debug) console.log(widgetRootMsg+"Debug on");
//
// Styling of markers
//
// Base 64 encoding of the marker PNG File
// The PNG can be black & white (2-colours) but transparency
// is required to met 
const base64EncodedMarker = "iVBORw0KGgoAAAANSUhEUgAAADIAAABSAgMAAABrpW94AAABhWlDQ1BJQ0MgcHJvZmlsZQAAKJF9kb9Lw0AcxV9Ti1IqHewg4pChOlkRFXGUKhbBQmkrtOpgcukvaNKQpLg4Cq4FB38sVh1cnHV1cBUEwR8g/gHipOgiJX4vKbSI8eC4D+/uPe7eAUKzylSzZwJQNctIJ+JiLr8q9r7CjwDCCGJcYqaezCxm4Tm+7uHj612MZ3mf+3P0KwWTAT6ReI7phkW8QTyzaemc94kjrCwpxOfEYwZdkPiR67LLb5xLDgs8M2Jk0/PEEWKx1MVyF7OyoRJPE0cVVaN8IeeywnmLs1qts/Y9+QtDBW0lw3Waw0hgCUmkIEJGHRVUYSFGq0aKiTTtxz38Q44/RS6ZXBUwciygBhWS4wf/g9/dmsWpSTcpFAcCL7b9MQL07gKthm1/H9t26wTwPwNXWsdfawKzn6Q3Olr0CAhvAxfXHU3eAy53gMEnXTIkR/LTFIpF4P2MvikPDNwCwTW3t/Y+Th+ALHW1fAMcHAKjJcpe93h3X3dv/55p9/cDXnNynwvzmMUAAAAJUExURQAALgAAAP///xxfjRMAAAABdFJOUwBA5thmAAAAAWJLR0QAiAUdSAAAAAlwSFlzAAAD6AAAA+gBtXtSawAAAAd0SU1FB+oDBgksA7YpttMAAAC4SURBVDjLjdTLFcQgCAVQWVgC/ViCC+i/lfkY9T0MmXGTcw2BRDGl/Bjiblv+Hn2ifuR4a92UIcNA9waBV6hMGQaOrCxdapBkpCHJlpEcUy6ZXNKRGy7z8aWy1Q/pV/MFx+z/UlBWIXuz+SltXDpNJt+ertKhp7UOu5LpYW/t7AKhDuF+WUnbjSoUiOKOZHHvBikUiOITwBIsEMTnKEihQFSFAlF8UlkFC0QpFIiqTj8Dy1X6g27HC45Au/ZEeLoSAAAAAElFTkSuQmCC";
// default and selected colors
const defaultColor = '#0070C0';   // blue
const selectedColor = '#548235';  // green
// marker.png height is 82 pixels. It is reduced using markerIconSize factor
const markerIconSize = 0.25;
const popupOffset = 13; // 2/3 of marker height after resizing
//
// Zoom management
//
// In MapLibre GL JS (and Mapbox GL JS), the zoom value is a floating‑point number where:
// 0 = whole world view
// ~5–7 = country level
// ~10–12 = city level
// ~14–16 = street/block level
// ~17–19 = building level
// 20+ = very close, individual building details (if tiles support it)
// Highest zoom level recommended for cartes.gouv is 18.9
const highestZoomLevel = 18.9; // recommended by Carte Facile service
// Cluster max zoom level for clusters
const clusterMaxZoom = 14; // From Map Libre example
// Set the Zoom to focus on a specific feature just above clusterMaxZoom
// to ensure that the feature marker will be visible
const focusZoom = clusterMaxZoom + 0.1;
//
// Cursor specific shape for chossing new row location
const svgCursor = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
	<circle cx="8" cy="8" r="2" fill="none" stroke="black" stroke-width="1"/>
	<line stroke-linecap="undefined" stroke-linejoin="undefined" id="svg_1" x1="8" y1="1" x2="8" y2="6" stroke="black" stroke-width="1"/>
	<line stroke-linecap="undefined" stroke-linejoin="undefined" id="svg_2" x1="8" y1="15" x2="8" y2="10" stroke="black" stroke-width="1"/>
	<line stroke-linecap="undefined" stroke-linejoin="undefined" id="svg_3" x1="1" y1="8" x2="6" y2="8" stroke="black" stroke-width="1"/>
	<line stroke-linecap="undefined" stroke-linejoin="undefined" id="svg_4" x1="10" y1="8" x2="15" y2="8" stroke="black" stroke-width="1"/>
</svg>
`;
const svgCursorUri = `url('data:image/svg+xml;base64,${btoa(svgCursor)}') 8 8, auto`;
//
// Widget management
//
// Id of current row even if there is no corresponding feature on the map
let currentRowId = null;
// reference to the active Popup
let activePopup = null;
// refreence to the hover Popup
let hoverPopup = null;
// Detection of internal setCursorPos to leave quickly subsequent call to
// onRecord
let internalCursorPos = false;
// Detect internal add row
let internalAddRow = false;
// When onRecord is called before the map is ready, lateMapFocus is set to true
// in order to ChangeMapFocus as soon as the map is ready
let lateMapFocus = false;
// Detect removal of a row
let recordRemoval = false;
// Parameters model dialog box
let modal = null;
let newRowDialog = null;
// Columns Mapping for AddRows
let mapping = {};
// Context menu
let contextMenu = null;
let clickedLngLat = null;
// 
// Mapping management
//
// reference to the map
let map = null;
// list of features corresponding to valid rows
let geojsonFeatures = [];
// Bouding Box ogf valid rows
let BBox = [];
// It is used in onRecord to avoid style changes when the map is not yet loaded
// Cluster radius (0=>no cluster) in pixels. This can be changed by the users
// via the widget buttons to fit the feature density.
let clusterRadius = 30;
// Flag set to true when map has been loaded. 
let mapReady = false;
//
let instructionControl = undefined;
let newRecordSelect = null;
//
// SetCursorPos expect a position in the table not the record.id : keep track of the records to determine the position from the id.
let currentRecords = [];
//
// Lookup of records having at least a valid id
let recordLookup = {};
// The lookup key structure is: id. title (lon,lat)
function recordKey(id, title, lat, lon) {
	return id + ". " +title + " (" + lat + "," + lon + ")";
}
// Add a record to the lookup if title and id are valid
// the key giove access to the record id and the title
function addRecord2Lookup (id, title, lat, lon) {
	if ( id ) recordLookup[recordKey(id, title, lat, lon)] = { id: id, title: title}; 
}
//
// Utilities function
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// The Active Popup of the selected feature is created in different contexts consistently
function NewActiveFeaturePopup(f) {
if (debug) console.log(widgetRootMsg+"NewActiveFeaturePopup : f="+JSON.stringify(f, null, 2));
	return new maplibregl.Popup({
		closeOnClick: false, // prevent popup to closewhen clickin outiside
		anchor: 'bottom', // render the popup above the anchor
		offset: popupOffset, // More or less the center of the marker circle
		className: 'maplibregl-popup'
	})
	.setLngLat(f.geometry.coordinates)
	.setHTML(`${f.properties.title}`)
	.addTo(map);
}
// Change of the current row is called only when it comes
// from the widget ....
function ChangeCurrentRow(id) {
if (debug) console.log(widgetRootMsg+"ChangeCurrentRow : id="+id
		+", currentRowId="+currentRowId
		+", internalCursorPos="+internalCursorPos
		+" index="+currentRecords.findIndex(r => r.id === id));
	if (id !== currentRowId) {
		currentRowId = id;
		internalCursorPos = true;
		grist.setCursorPos?.({ rowId: id });
	}
}
// ... Set Current Row occurs only when it comes from an 
// external widget
function SetCurrentRow(id) {
if (debug) console.log(widgetRootMsg+"SetCurrentRow : id="+id
		+", currentRowId="+currentRowId
		+", internalCursorPos="+internalCursorPos
    	+" index="+currentRecords.findIndex(r => r.id === id));
	if (id !== currentRowId) {
		currentRowId = id;
		internalCursorPos = false;
	}
}
//
// Change Map Selection and flyTo the selected feature
function ChangeMapFocus(f) {
if (debug) console.log(widgetRootMsg+"ChangeMapFocus : f: "+JSON.stringify(f, null, 2));
	// Zoom in on the focus record when it is valid in "selected" widget mode
	if (f) {
		// Fit the map to the record
		map.flyTo({
			center: f.geometry.coordinates,
			zoom: focusZoom,
			speed: 3.0,       // Lower is slower
			curve: 1.42,       // Flight curvature
			easing: t => t,   // Linear easing
			essential: true   // Required for accessibility
		});
	}
	// Map Selection to be applied even if not f (for unselection)
	ChangeMapSelection(f);
}
//
// Change the color of the marker corresponding to the current row,
// delete the previous Popup and create a new on using the data of feature f
function ChangeMapSelection(f) {
if (debug) console.log(widgetRootMsg+"ChangeMapSelection : f: "+JSON.stringify(f, null, 2));
  // Update paint property of the layer dynamically to highlighth the marker of the currentRow
  if (f) {
    map.setPaintProperty('unclustered-point', 'icon-color', [
      'case',
      ['==', ['coalesce', ['get', 'id'], ''], ['literal', currentRowId || '']],
      selectedColor,
      defaultColor
    ]);
  }
  else { // no selection
    map.setPaintProperty('unclustered-point', 'icon-color', defaultColor);
  }    
  // Change active Popup    
  if (activePopup) activePopup.remove();
  if (f) activePopup = NewActiveFeaturePopup(f);
}
//
// Return the BoundingBox of a set of features
// A feature is expected to be a GeoJson objects.
// It should have a geometry composed of a valid couple of coordinates (Lon,Lat)
function BoundingBox(features) {
	// Set local null bbox coordinates to keep the previous
	// BBOX in case the new bbox is invalid
	let westLng  = null;
	let southLat = null;
	let eastLng  = null;
	let northLat = null;
	//exit when no features
	if (!features) return;
	// ... calcul de la bounding box
	features.forEach(f => {
		if ( westLng == null || westLng > f.geometry.coordinates[0] ) westLng = f.geometry.coordinates[0];
		if ( southLat == null || southLat > f.geometry.coordinates[1] ) southLat = f.geometry.coordinates[1];
		if ( eastLng == null || eastLng < f.geometry.coordinates[0] ) eastLng = f.geometry.coordinates[0];
		if ( northLat == null || northLat < f.geometry.coordinates[1] ) northLat = f.geometry.coordinates[1];
	});
	// Use the nullish coalescing operator (??) To keep a valid BBox when source data are emptied, 
	BBox[0] = westLng ?? BBox[0]; // BBox[0] set to westlng only if westLng is not null and defined
	BBox[1] = southLat ?? BBox[1]; 
	BBox[2] = eastLng ?? BBox[2];
	BBox[3] = northLat ?? BBox[3];
}
//
// FitBounds Dynamic padding computation
function getDynamicPadding() {
	// Calculate approximate geographic span
	const lonDiff = Math.abs(BBox[2] - BBox[0]);
	const latDiff = Math.abs(BBox[3] - BBox[1]);
	// Heuristic: smaller area → bigger padding
	const maxDiff = Math.max(lonDiff, latDiff);
	if (maxDiff < 0.1) { // very close points
		return 75;
	} else if (maxDiff < 1) { // same city
		return 50;
	} else if (maxDiff < 5) { // same region
		return 30;
	} else { // large area (e.g., whole country)
		return 10;
	}
}
//
// Fit the map to the bounding box with padding
// Note : At least two calls, on through the widget buttons, another when
// creating the map. This function ensures the consistency.
function FitBounds() {
	map.fitBounds(BBox, {
		padding: getDynamicPadding(),	// pixels
		maxZoom: highestZoomLevel,		// prevent zooming in too far
		duration: 1000					// animation duration in ms
	});
}
//
// Mapping of the map data is by default clustered
// but it is possible to change the cluster radius
// possibly any positive integer including 0 (no cluster).
// The following function generates all map Libre Data
// from the Grist source table according to clusterRadius
// parameter. It is called once when the map is loaded
// using the default cluster radius value
function AddGristTable2Map () {
	//
	// Option 1 : With Clustering
	if (clusterRadius > 0) {
		// 1.1 Set up the source
		if ( !map.getSource('markers') ) {
			map.addSource('markers', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: [...geojsonFeatures] // Need to clone geojsonFeatures instead of passing it by reference
				},
				cluster: true,
				clusterMaxZoom: clusterMaxZoom, // Maximum zoom level to cluster
				clusterRadius: clusterRadius // Radius of each cluster in pixels
			});
		}
		// 1.2 Add a layer to display clusters:
		map.addLayer({
			id: 'clusters', 
			type: 'circle',
			source: 'markers',
			filter: ['has', 'point_count'], // important !!! Identifiy clustered source features
			paint: {
				// Use step expressions (https://maplibre.org/maplibre-style-spec/#expressions-step)
				// with three steps to implement three types of circles:
				//   * Blue, 20px circles when point count is less than 100
				//   * Yellow, 30px circles when point count is between 100 and 750
				//   * Pink, 40px circles when point count is greater than or equal to 750
				'circle-color': [
					'step',
					['get', 'point_count'],
					'#51bbd6', // Blue
					100,
					'#f1f075', // Yellow
					750,
					'#f28cb1'  // Pink
   		 		],
				'circle-radius': [
					'step',
					['get', 'point_count'],
					10,
					100,
					15,
					750,
					20
				]
			}
		});
		// 1.3 Add a layer for cluster labels
		map.addLayer({
			id: 'cluster-count',
			type: 'symbol', 
			source: 'markers', 
			filter: ['has', 'point_count'],
			layout: { 
				'text-field': '{point_count_abbreviated}',
				'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
				'text-size': 12
			} 
		});
	//
	// Option 2 : Without clustering
	} else {
	  // Just need to set the source
		map.addSource('markers', {
			type: 'geojson',
			data: {
				type: 'FeatureCollection',
				features: [...geojsonFeatures] // Need to clone geojsonFeatures instead of passing it by reference
			},
			cluster: false
		});
	} //  END OF if (clusterRadius > 0) else
	//
	// 3 : Set up the table row geographic representation
	//
	// 3.1 Check whether the marker icon (representing table rows in the map)
	// has to be added to the map
	if (!map.hasImage('custom-marker')) {   
		const img = new Image();
		img.onload = () => {
			map.addImage('custom-marker', img, { sdf: true });
		};
		img.src = `data:image/png;base64,${base64EncodedMarker}`;       
	}
	//
	// 3.2 Highlight current row marker (define the color rule)
	// Apply selectedColor when id=currentRowId or defaultColor
	let iconColor = defaultColor;
	if ( !currentRowId ) iconColor = [
		'case',
		['==', ['coalesce', ['get', 'id'], ''], ['literal', currentRowId || '']],
		selectedColor, // Selected point color
		defaultColor  // Default color
	];
	//
	// 3.3 Add the layer of the GRIST table markers (unclustered points)
	map.addLayer({
		id: 'unclustered-point',
		type: 'symbol',
		source: 'markers',
		filter: ['!', ['has', 'point_count']],
		layout: {
			'icon-image': 'custom-marker', // built-in SDF icon
			'icon-size': markerIconSize,
			'icon-anchor': 'bottom',
			'icon-allow-overlap': true
		},
		paint: {
			'icon-color': iconColor
		}
	});
	// 
	// 3.4 At this stage, the map is ready
	// It is possible to call ChangeMapSelection and ChangeMapFocus 
	// typically when receiving change record selection through onRecord
	mapReady = true;
if(debug) console.log(widgetRootMsg+"Map is ready!!!");
	//
	// 4. Set the initial row selection and display the table row representation
	//
	// 4.1 Option 1 : There has not been any selection yet
	// Select first line of the Grist table when creating the map
	// (if it has not been set first by a call to onRecord...)
	if (currentRowId == null) {
if(debug) console.log(widgetRootMsg+"AddGristTable2Map: currentRowId is null");
		ChangeCurrentRow(geojsonFeatures[0].properties.id);
		ChangeMapSelection(geojsonFeatures[0]);
	}
	//
	// 4.2 Option 2 : A record has been removed
	// TBD - Confirm whether :
	// 1. This can really arise here
	// 2. Best behaviour is always to select the first valid record,
	//    i.e. there  is a case where the currentRowId would not
	//    be the deleted one
	// 3. It is more appropriate to relocate the map to an overview 
	// of the table records
	if ( recordRemoval ) {
if(debug) console.log(widgetRootMsg+"AddGristTable2Map: a record has been removed (currentRowId="+currentRowId);
		ChangeCurrentRow(geojsonFeatures[0].properties.id);
		ChangeMapSelection(geojsonFeatures[0]);
		// In case of record removal, 
		FitBounds();
		recordRemoval = false; // reset for security
	}
	//
	// 4.3 Option 3 : Late Map Focus
	// Late map focus arise when loading the page if the connected widget
	// cursor position is not on the first row. Since it is not a user
	// choice to focus on this record, we just apply a MapSelection
	// instead of a MapFocus to provide an overview of the full table
	if ( lateMapFocus ) {
if(debug) console.log(widgetRootMsg+"lateMapFocus is true => Focus on:"+currentRowId);
		ChangeMapSelection(geojsonFeatures.find(
			item => item.properties.id === currentRowId
    	));
		lateMapFocus = false;
	}
	//
	// 5. Hover Poppup
	//
  	// Create Add hoverPopup
	if ( !hoverPopup ) hoverPopup = new maplibregl.Popup({
		closeButton: false,
		closeOnClick: false,
		anchor: 'bottom', // render the popup above the anchor
		offset: popupOffset, // More or less the center of the marker circle
		className: 'maplibregl-popup'
	});

}
//
// @WidgetControl : Management of GRIST Widget Control
//
// Disable a Button
function disableBtn ( btnId ) {
	const btn = document.getElementById(btnId);
	if ( btn ) {
		btn.disabled = true;
		btn.classList.add('disabled');
	}
}
// Enable a Button
function enableBtn ( btnId ) {
	const btn = document.getElementById(btnId);
	if ( btn ) {
		btn.disabled = false;
		btn.classList.remove('disabled');
	}
}
// 
// @WidgetControl, @AddRowBtn
//
// @AddRowBtn Click handler
// After a click event related to this function, it :
function handleNewRowClick(e) {
	//
	// 1. Gets the geograpohic coordinates of the click
	const lng = e.lngLat.lng.toFixed(6);
	const lat = e.lngLat.lat.toFixed(6);
	//
	// 2. Prepares the Add/Update Dialog Box
	//
	// 2.1 Setup the select input  @RowsSelector
	newRecordSelect = document.getElementById('newRowRecord');
	if ( newRecordSelect ) {
		newRecordSelect.innerHTML = "";
		// 2.2.1 Create the placeholder option
		const placeholder = document.createElement("option");
		placeholder.textContent = "Choisissez une ligne à mettre à jour..."; // visible text
		placeholder.value = "";                          // empty value
		placeholder.disabled = true;                     // can't be selected after change
		placeholder.selected = true;                     // selected by default
		placeholder.hidden = true;                       // hides from dropdown list
		newRecordSelect.appendChild(placeholder);
		// 2.2.2. Add new option for each identified record in recordLookup key alphabetic order
		// (more or less in record.id order)
		// TBD : Ensure a formatting of recordLookup Keys ensuring id numeric order 
		Object.keys(recordLookup)
  			.sort((a, b) => a.localeCompare(b)) // localeCompare handles case & accents
  			.forEach(key => {
				const option = document.createElement("option");
  				option.value = key;
  				option.textContent = key;
				newRecordSelect.appendChild(option);
			});
	} // END if (recorrdSelect)
	//
	// 2.2 : Replace Dialog Box labels with mapped column names @UserContext
	document.getElementById('newRowLabelTitle').textContent = mapping.Titre;
	document.getElementById('newRowLabelLatitude').textContent = mapping.Latitude;
	document.getElementById('newRowLabelLongitude').textContent = mapping.Longitude;
	//
	// 2.3 : Set Dialog box Lon/Lat inputs using the coordinates of the click
	if (document.getElementById('newRowLat')) document.getElementById('newRowLat').value = lat;
	if (document.getElementById('newRowLon')) document.getElementById('newRowLon').value = lng;
	//
	// 3. Restore the context before Add row Button click @AddRowBtn
	//
	// 3.1. Remove listeners
	map.off('click', handleNewRowClick);
	document.removeEventListener('keydown', handleNewRowEscKey);
	document.removeEventListener('mousemove', handleNewRowMouseMove, true);
	// 3.2 Restore defualt curosr
	map.getCanvas().style.cursor = '';
	// 3.4 Stops Instruction ControlSuppression de l'instruction
	map.removeControl(instructionControl);
	// 3.5 Enable AddRowBtn button again
	enableBtn('AddRowBtn');
	//
	// 4. Display the Add/Update Dialog Box
	//
	// Only need change the display styling of the Dialog Box div
	newRowDialog.style.display = 'block';
	//
	// 5. Activate Dialob Box Listeners
	//
	// 5.1 For simplicity, there are permanent listeners on click on 
	// the Dialog Box Button an on click outside the Dialog Box
	// since they an work only when the Dialog Box is visible
	//
	// 5.2 Listen to the change event of the record select input
	// TBD : See whether it should not be permanente as well
	// Run on load ...
	handleRecordSelectChange();
	// ...and whenever selection changes
	newRecordSelect.addEventListener("change", handleRecordSelectChange);
}
// Temporary end of Clean up
//
// ESC key handler
function handleNewRowEscKey(e) {
  if (e.key === 'Escape') {
    map.off('click', handleNewRowClick);
    document.removeEventListener('keydown', handleNewRowEscKey);
    document.removeEventListener('mousemove', handleNewRowMouseMove, true);
		map.getCanvas().style.cursor = '';
    // Suppression de l'instruction
    map.removeControl(instructionControl);
		// Enable the button again
		enableBtn('AddRowBtn');
		// No newRowDialog display => need to reset the form fields before leaving
    document.getElementById('newRowRecord').value = '';
    document.getElementById('newRowTitle').value = '';
    document.getElementById('newRowLat').value = '';
    document.getElementById('newRowLon').value = '';
  }
}
// To avoid external cursor changes while chosing the new row location
function handleNewRowMouseMove(e) {
   e.target.style.cursor = svgCursorUri;
}
//
// Add a new row using mapped names
async function addOrUpdateRow(id,titre,lat,lon) {

  if (!mapping.Longitude || !mapping.Latitude) {
    console.error(widgetRootMsg+"Mapping not ready");
    return;
  }

  // Build the record object using real column IDs
 	let fields = {
    [mapping.Longitude]: lon,
    [mapping.Latitude]: lat
  };
  if (mapping.Titre && titre) {
    fields[mapping.Titre] = titre;
  }

  try {
		// Update row	
		if ( id > 0 ) {
			const result = await grist.selectedTable.update({ 
				id: id,
				fields: fields
			});
    	if (debug) console.log(widgetRootMsg+"Update Row result: ", JSON.stringify(result, null, 2));
			// result seems to be always undefined
			// There are subsequent calls to onRecords and onRecord which mays or not result to 
			// a map focus on the updated row. Typically, if the recod was invalid, it is necessary
			// to apply a map focus after a certain time (waiting calls to onRecords/onRecord)
			// TBD : confirm whether Add and Update should result to Map focus or Map Selection from
			// a user perspective...
			setTimeout(() => {
					f = geojsonFeatures.find(item => item.properties.id === id );
					ChangeCurrentRow(id);
					// The new record may not be valid
					if (f) ChangeMapFocus(f);
      }, 500); // adjust delay if needed
		}
		// Add row
		else {
			// In case of success, grist.SelectTable.create will generate a call to onRecord
    	// which will change the currentRowID and shall ChangeMapSelection instead of
    	// ChangeMapFocus, because the new row is created by the widget.
    	// internalAddRow flags this.
    	internalAddRow = true;
    	const result = await grist.selectedTable.create({ fields: fields  });
    	if (debug) console.log(widgetRootMsg+"Add Row result: ", JSON.stringify(result, null, 2));
			if (result && result.id > 0) {
				// Need to wait for a backgrounf call to onRecords (table has changed !!!) and potential
				// unwanted call to onRecord by a connected source widget
				setTimeout(() => {
					f = geojsonFeatures.find(item => item.properties.id === result.id );
					ChangeCurrentRow(result.id);
					// The new record may not be valid
					if (f) ChangeMapSelection(f);
      	}, 500); // adjust delay if needed
			}
		}
  }  catch (err) {
    internalAddRow = false; // creation unsuccessfull
    console.error(widgetRootMsg+"Error adding row:", err);
  }
}
// 
//
// API GRIST : ready
///////////////////////////////////////////////////////////////////////////////////////////////////////////
grist.ready({   
  requiredAccess: 'full',
  columns: [
    {
      name: "Titre",
      title: "Libellé",
      optional: false,
      description: "Valeur ou libellé de l'objet géoréférencé", // Ne s'affiche pas si multiple
      allowMultiple: false // Permet l'attribution de plusieurs colonnes.
    },
    {
      name: "Latitude",
      title: "Latitude",
      optional: false,
      type: "Numeric", // Quel type de colonne nous attendons.
      description: "Latitude", // Description du champ.
      allowMultiple: false // Permet l'attribution de plusieurs colonnes.
    },
    {
      name: "Longitude",
      title: "Longitude",
      optional: false,
      type: "Numeric", // Quel type de colonne nous attendons.
      description: "Longitude", // Description du champ.
      allowMultiple: false // Permet l'attribution de plusieurs colonnes.
    }
  ],
  allowSelectBy: true // Permet de choisir ce widget comme input d'un autre widget
});
// Log version once on load
if (debug) console.log(widgetRootMsg+"loaded");
//
// API GRIST : onOptions
grist.onOptions((options,settings) => {
if (debug) console.log(widgetRootMsg+"settings:"+JSON.stringify(settings, null, 2));
if (debug) console.log(widgetRootMsg+"options:"+JSON.stringify(options, null, 2));
});
//
// API GRIST : onRecords
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
grist.onRecords((table, colMapping) => {
if (debug) console.log(widgetRootMsg+"onRecords : "+table.length);

  // reset geojsonFeatures
  geojsonFeatures.length=0;

	// detect the removal of a record
	recordRemoval = currentRecords && currentRecords.length > table.length;	

  // reset currentRecords and recordLookup
  currentRecords = table;
  recordLookup = {};

  //reset mapping
  mapping = colMapping;
if (debug) console.log(widgetRootMsg+"onRecords column mapping: "+mapping);


  // Definition de la Bouding Box des données et de la liste de features
  table.forEach ( record => {

    // On récupère les colonnes mappées
    const mapped = grist.mapColumnNames(record);

    // Utilisation des données du reccord ...
    if ( mapped && mapped.Longitude && mapped.Latitude && mapped.Titre && record.id ) {

      geojsonFeatures[geojsonFeatures.length] = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [mapped.Longitude, mapped.Latitude] },
        properties: { id: record.id, title: mapped.Titre }
      }; 
      
    }
    else console.warn(widgetRootMsg+"Skipped record [id="+record.id+", Titre="+mapped.Titre+", Lat="+mapped.Latitude+", Lon="+mapped.Longitude+"]");

		// Add the record to the lookup: will skip record not having a valid title and id
		if ( mapped ) addRecord2Lookup(record.id, mapped.Titre, mapped.Latitude, mapped.Longitude);
  
	});

  BoundingBox(geojsonFeatures);

  if ( !BBox || !BBox[0] || !BBox[1] || !BBox[2] || !BBox[3]) {
    console.warn(widgetRootMsg+": Bounds not fully defined ["+BBox[0]+", "+BBox[1]+", "+BBox[2]+", "+BBox[3]+"]");
    return;
  }

// DEBUG
// Send widget location info to the console...
if (debug) console.log(widgetRootMsg+"href: "+window.location.href);
if (debug) console.log(widgetRootMsg+"origin: "+window.location.origin);
if (debug) console.log(widgetRootMsg+"pathname: "+window.location.pathname);
// END DEBUG

	//
  // Init dialog Box and context Menu
	//
	// Parameters Box
  if (!modal) {
    modal = document.getElementById('widgetParameters');
  }
	// Row Box
  if (!newRowDialog) {
    newRowDialog = document.getElementById('widgetNewRow');
  }
	// Context Menu : Init
	if (!contextMenu) {
		contextMenu = document.getElementById('contextMenu');
	}
  
  // When the map does not exists : need to create it
  if (!map ) {

    //
    // Création de la carte
    map = new maplibregl.Map({
      container: 'map', // id du conteneur de la carte
      style: CarteFacile.mapStyles.simple, // style de carte
      maxZoom: highestZoomLevel
    });
    // Ajout d'un contrôle de navigation
    map.addControl(new maplibregl.NavigationControl);
    // Ajout d'une échelle
    map.addControl(new maplibregl.ScaleControl);
    // Pas de bouton de Geolocalisation car l'objectif est de visualiser les données de la table
    // Ajout d'un sélecteur de carte
    map.addControl(new CarteFacile.MapSelectorControl({
  		styles: ['simple', 'aerial'],
  		overlays: ['administrativeBoundaries', 'cadastre', 'levelCurves']
	}));
if (debug) console.log("CarteFacile LayerGroup:\n"+CarteFacile.LayerGroup);
		// Ajout de la fonction de recherche Carte Facile
    map.addControl(new CarteFacile.SearchControl({
  		placeholder: 'Rechercher une adresse…',
  		debounceMs: 300,    // Délai avant déclenchement (ms)
  		minChars: 3,        // Nombre minimum de caractères
  		maxResults: 6      // Nombre maximum de résultats affichés
	}));
	// SearchControl recommended parameters : to be confirmed
	//the ability to defined them with CDN
	// ({
  	//	placeholder: 'Rechercher une adresse…',
  	//	debounceMs: 300,    // Délai avant déclenchement (ms)
  	//	minChars: 3,        // Nombre minimum de caractères
  	//	maxResults: 5,      // Nombre maximum de résultats affichés
	//	})
	  

	      // Création d'un contrôle personnalisé pour les fonctionnalités du widget GRIST
    class WidgetControl {
      //private _container: HTMLElement;
      onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        // fit-bounds-btn => Driver mode
        let button = document.createElement('button');
        button.className = 'maplibregl-ctrl-icon fit-bounds-btn';
        button.type = 'button';
        button.title = 'Toutes les lignes';
        button.onclick = () => {
          FitBounds();
        };
        this._container.appendChild(button);
        // Bouton Mode Driven : Zoom sur le marker sélectionné
        button = document.createElement('button');
        button.className = 'maplibregl-ctrl-icon one-row-btn'; 
        button.type = 'button';
        button.title = 'Ligne sélectionnée';
        button.onclick = () => {
          ChangeMapFocus(geojsonFeatures.find(
            item => item.properties.id === currentRowId
          ));
        };
        this._container.appendChild(button);
        // Bouton ajout d'une ligne
        button = document.createElement('button');
        button.className = 'maplibregl-ctrl-icon add-row-btn';
        button.type = 'button';
        button.title = "Ajout d'une ligne";
				button.id = 'AddRowBtn';
		    button.onclick = () => {
					disableBtn('AddRowBtn');
          // Add the control to the top-left corner
          instructionControl = new InstructionControl('Cliquez sur la position de la nouvelle ligne ou pressez ESC pour annuler');
          map.addControl(instructionControl,'top-left');
          // Use a dedicated cursor shape
          map.getCanvas().style.cursor = svgCursorUri;
		  // Ensure controls keep their normal pointer
		  document.querySelectorAll('.maplibregl-ctrl button').forEach(btn => {
  			btn.style.cursor = 'pointer';
		  });
          // Listen for click events or ESC key
          map.on('click', handleNewRowClick);
          document.addEventListener('keydown', handleNewRowEscKey);
          // ... and ensure the mouse cursor remains
          document.addEventListener('mousemove', handleNewRowMouseMove, true);
        };
        this._container.appendChild(button);
        // Bouton paramètres
        button = document.createElement('button');
        button.className = 'maplibregl-ctrl-icon parameters-btn';
        button.type = 'button';
        button.title = 'Paramètres';
        //button.textContent = '⚙️'; // 
        button.onclick = () => {
          document.getElementById('clusterRadius').value = clusterRadius;
          modal.style.display = 'block';
        };
        this._container.appendChild(button);
        return this._container;
      }
      onRemove() {
        this._container?.remove();
        this._container = null;
        this._map = undefined;
      }
    }
    map.addControl(new WidgetControl(), 'top-right');

    // Custom control class
    class InstructionControl {
      constructor(message) {
        this.message = message;
      }
      onAdd(map) {
        this.map = map;
        this.container = document.createElement('div');
        this.container.className = 'maplibregl-ctrl instruction-control';
        this.container.textContent = this.message;
        return this.container;
      }
      onRemove() {
        // Remove only this control's container
        this.container?.remove();
        this.map = undefined;
      }
    }

    document.getElementById('cancelNewRow').addEventListener('click', () => {
			// Stop listener
			document.removeEventListener("change", handleRecordSelectChange);
			newRowDialog.style.display = 'none';
    	document.getElementById('newRowRecord').value = '';
      document.getElementById('newRowTitle').value = '';
      document.getElementById('newRowLat').value = '';
      document.getElementById('newRowLon').value = '';
    });
    document.getElementById('saveNewRow').addEventListener('click', async () => {
			// Stop listener
			document.removeEventListener("change", handleRecordSelectChange);
      newRowDialog.style.display = 'none';
			if ( Object.hasOwn(recordLookup, document.getElementById('newRowRecord').value) ) {
      	await addOrUpdateRow(recordLookup[document.getElementById('newRowRecord').value].id,
					document.getElementById('newRowTitle').value,
          Number(document.getElementById('newRowLat').value),
          Number(document.getElementById('newRowLon').value)
      	);
			}
			else {
      	await addOrUpdateRow(0,
					document.getElementById('newRowTitle').value,
          Number(document.getElementById('newRowLat').value),
          Number(document.getElementById('newRowLon').value)
      	);
			}
      document.getElementById('newRowRecord').value = '';
      document.getElementById('newRowTitle').value = '';
      document.getElementById('newRowLat').value = '';
      document.getElementById('newRowLon').value = '';
    });
    document.getElementById('cancelSettings').addEventListener('click', () => {
      modal.style.display = 'none';
    });
    document.getElementById('saveSettings').addEventListener('click', () => {
      modal.style.display = 'none';
      if ( Number(document.getElementById('clusterRadius').value) < 0 ) return;
      if ( clusterRadius !== Number(document.getElementById('clusterRadius').value) ) {
        clusterRadius = Number(document.getElementById('clusterRadius').value) ;
        if (map.getSource('markers')) {
          // Remove layers first (in reverse order of how they were added)
          if (map.getLayer('unclustered-point')) map.removeLayer('unclustered-point');
          if (map.getLayer('cluster-count')) map.removeLayer('cluster-count');
          if (map.getLayer('clusters')) map.removeLayer('clusters');
          map.removeSource('markers');
        }
        AddGristTable2Map ();
      }
      
    });
    // Close modal diag when clicking outside content
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
      if (event.target === newRowDialog) {
				// Stop listener
				document.removeEventListener("change", handleRecordSelectChange);
        newRowDialog.style.display = 'none';
    		document.getElementById('newRowRecord').value = '';
      	document.getElementById('newRowTitle').value = '';
      	document.getElementById('newRowLat').value = '';
      	document.getElementById('newRowLon').value = '';
      }
    });
    //
    //
    // Chargement de la carte
    map.on('load', () => {

      // Focus on the BBox of table rows
      FitBounds();

      AddGristTable2Map ();

      // inspect a cluster on click
      map.on('click', 'clusters', async (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });
        if ( !features.length ) return;

        const zoom = await map.getSource('markers').getClusterExpansionZoom(features[0].properties.cluster_id);
        // Click event is sometimes intercepted for the clusters layer when clicking a
        // feature of the unclustered-point layer. zoom may be Nan in this case...
        if ( isNaN(zoom) ) return;
        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom
        });
      
      });

      // When a click event occurs on a feature in the unclustered-point layer
      map.on('click', 'unclustered-point', (e) => {       
        if ( !e || e.features[0].properties.id == currentRowId ) return;
        // Change current row
        ChangeCurrentRow(e.features[0].properties.id);
        ChangeMapSelection(e.features[0]);
      });

      // Check popup visibility on every render
      map.on('render', () => {
        if (!currentRowId || !map.getLayer('unclustered-point') ) return;

        // Query features with currentRow
        // This query returns features with approximayte coordinates, but
        // the goal is to check whether the feature is rendered or not
        const features = map.queryRenderedFeatures(undefined, {
         layers: ['unclustered-point'],
         filter: ['==', ['get', 'id'], currentRowId]
        });
        
        // Sync visibility of Popup and the unclustered point of the feature   
        if ( features && features[0] ) {
          // if activePopup is null, the unclustered point is visible again 
          // => the pop up needs to be created
          // create the popup with the coordinates from geojsonFeatures which as better the one retrieved by the queryRenderFeatures
          if ( !activePopup ) activePopup = NewActiveFeaturePopup(geojsonFeatures.find(item => item.properties.id === currentRowId));
        }
        else {
          // if the unclustered point is not visible, the active pop up
          // has to be removed
          if ( activePopup ) {
            activePopup.remove();
            activePopup = null;
          }
          
        }
      });

      map.on('mouseenter', 'unclustered-point', (e) => {
        if ( e.features[0].properties.id != currentRowId ) {
          map.getCanvas().style.cursor = 'pointer';
          hoverPopup
            .setLngLat(e.features[0].geometry.coordinates.slice())
            .setHTML(e.features[0].properties.title)
            .addTo(map);
        } 
      });

      map.on('mouseleave', 'unclustered-point', () => {
        map.getCanvas().style.cursor = '';
        hoverPopup.remove();
      });

      map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
      });  

			//
			// ContextMenu
			//
			// Intercept right-click
  		map.on('contextmenu', (e) => {
    		e.preventDefault(); // Prevent default browser menu
    		clickedLngLat = e.lngLat;
    		// Position the menu at mouse location
    		contextMenu.style.left = e.point.x + 'px';
    		contextMenu.style.top = e.point.y + 'px';
    		contextMenu.style.display = 'block';
				// TBD : Grey Update record contexte menu item if there isn't 
				// any record marker at this location
  		});
  		// Hide menu on map click or move
  		map.on('click', () => contextMenu.style.display = 'none');
 		 	map.on('movestart', () => contextMenu.style.display = 'none');
  		// Action 1: Add record to table
			// TBD : Use NewRecord Dialog Box throug a generic function managing
			// this action, action 2 and the action related to add row from the widget control
  		document.getElementById('contextMenuAdd').addEventListener('click', () => {
				alert("Mise en oeuvre en cours de l'ajout d'une ligne au point ("+clickedLngLat.lat.toFixed(5)+","+clickedLngLat.lng.toFixed(5)+")");
    		contextMenu.style.display = 'none';
  		});
			// Action 2: Update Record (TBD: See action 1)
  		document.getElementById('contextMenuUpdate').addEventListener('click', () => {
				alert("Mise en oeuvre en cours de la mise à jour d'une ligne au point ("
							+clickedLngLat.lat.toFixed(5)
							+","
							+clickedLngLat.lng.toFixed(5)
							+")"
				);
    		contextMenu.style.display = 'none';
  		});
  		// Action 3: Show coordinates
			// TBD : Enhance presentation possibly using a Dialog Box
  		document.getElementById('contextMenuShow').addEventListener('click', () => {
    		alert(`Latitude: ${clickedLngLat.lat.toFixed(5)}\nLongitude: ${clickedLngLat.lng.toFixed(5)}`);
    		contextMenu.style.display = 'none';
  		});
  		// Hide menu if clicking outside
			// TBD : check whether this event does not already exist
  		document.addEventListener('click', (e) => {
    		if (!contextMenu.contains(e.target)) {
      		contextMenu.style.display = 'none';
    		}
  		});
   
    }); // end map.on load
		
  } // if (!map)

  // when there is already a map :
  else { 

      // 1) Need to recompute BBox in case of further click to fit-bounds-btn
      BoundingBox(geojsonFeatures);

      // ... but no call to FitBounds (user would not undertand  
      // a focus change due to changes in the source data)

      // 2) Need to update the data
      const src = map.getSource('markers');
      if (src) src.setData({
        type: 'FeatureCollection',
        features: [...geojsonFeatures] // Again, need to clone the data
      });

			// In case of record removal, it seems more appropriate
			// to relocate the map to an overview of the table records
			// and to select the first valid record
		  if ( recordRemoval ) {
		  	FitBounds();
      	ChangeCurrentRow(geojsonFeatures[0].properties.id);
      	ChangeMapSelection(geojsonFeatures[0]);
			}

  }    

});
//
// API GRIST : onRecord
// Few cases :
//     (a) There is no feature with this id yet (record data where not yet valid) => new feature
//     (b) There is already a feature with this id and its geometry and/or its properties have significantly changed, 
//     (c) There is a feature with this id and its content has not changed significantly => Nothing to do (same as (1))
// (1) This widget has change the focus on the selected Row => Nothing to do
// (2) The content of the record has been changed by another process (but the record.id is the same as currentRowId )
//     (a) There is no feature with this id yet (record data where not yet valid) => new feature
//     (b) There is a feature with this id and its content has changed possibly, its geometry and/or its properties
//     (c) There is a feature with this id and its content has not changed significantly => Nothing to do (same as (1))
// (3) The focus on the selected row has been changed by another process
//     (a) There is no feature with this id yet (record data where not yet valid)  => new feature
//     (b) There is a feature with this id and its content has changed possibly, its geometry and/or its properties
//     (c) There is a feature with this id and its content has not changed significantly => Nothing to do (same as (1))
grist.onRecord(record => {
  let geometryChange = false;
  let propertyChange = false;
  let newRecord = false;
  let skippedRecord = false;

  // Nothing to do until a record is provided
  if ( !record ) return;

if (debug) console.log(widgetRootMsg+"onRecord : id="+record.id+", internalCursorPos="+internalCursorPos+", currentRowId="+currentRowId);

  // Detect onRecord call related to internal setCursorPos
  if (internalCursorPos) {
    internalCursorPos = false;
    // check matching id in case external change arises before internal Curpos
    if ( record.id != currentRowId ) {
      // Expecting the map is ready
      ChangeMapSelection(geojsonFeatures.find(item => item.properties.id === record.id));
    }
    return;
  } // On ne va pas plus loin si l'appel onrecord est consicutif à SetCurPos du widget.
  
  // Ensure map is ready
  // Just change the currentRowId if not ready
  // This a a way to get the current row from a source widget before 
  // the map loading and the intialization of the Geojson features
  if ( !mapReady ) {
if(debug) console.log(widgetRootMsg+"onRecord map is not ready - record.id: "+record.id)
    SetCurrentRow(record.id);
    // map is not ready yet: no need to ChangeMapFocus
    lateMapFocus = true;
    return;
  }

  // Try to find a feature with a matching id property
  let recordFeature = geojsonFeatures.find(
    item => item.properties.id === record.id
  );
  // Retrieve Mapped columns for the record
  const mapped = grist.mapColumnNames(record);

  // The record has invalid data
  //////////////////////////////
  if ( !mapped || !mapped.Longitude || !mapped.Latitude || !mapped.Titre ) {
    // Send a warning to the console
    console.warn("WIDGET Cartes.gouv : Skipped record [id="+record.id+", Titre="+mapped.Titre+", Lat="+mapped.Latitude+", Lon="+mapped.Longitude+"]");
    // need to retrive the feature from geojsonFeatures if the record was valid before the change
    if ( recordFeature ) {
      geojsonFeatures = geojsonFeatures.filter(item => item.properties.id === record.id);
      skippedRecord = true;
      recordFeature = null; // Intentionally, record is not valid
    }

  }

  // Having a valid record info, let update the geojsonFeatures
  ////////////////////////////////////////////////////////
  // Case (b) or (c) : There is a feature with this id
  else if ( recordFeature ) {
    // Identify geometry changes and ajust recordFeature
    if (recordFeature.geometry.coordinates[0] !== mapped.Longitude || recordFeature.geometry.coordinates[1] !== mapped.Latitude) {
      recordFeature.geometry.coordinates = [mapped.Longitude, mapped.Latitude];
      geometryChange = true; 
    }
    // Identify property changes and ajust recordFeature
    if (recordFeature.properties.title !== mapped.Titre) {
      recordFeature.properties.title =  mapped.Titre;
      propertyChange = true;
    }
  }
  // Case (a) There is no feature with this id yet
  else {
    // create the recordFeature and had it to the geojsonfeatures list
    recordFeature = {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [mapped.Longitude, mapped.Latitude] },
          properties: { id: record.id, title: mapped.Titre }
        }; 
    geojsonFeatures[geojsonFeatures.length] = recordFeature;
    newRecord = true;
  }

  // When there has been changes...
  if (  geometryChange || propertyChange || newRecord || skippedRecord ) {

    // ... Update of Map Source
    const src = map.getSource('markers');
    if (src) src.setData({
      type: 'FeatureCollection',
      features: [...geojsonFeatures] // Again, need to clone the data
     });

    // ...Update BBox when geometry has changed (or a feature has been skipped)
    // in case of further click on fit-bounds-btn
    if ( geometryChange || skippedRecord) {
      BoundingBox(geojsonFeatures);
      // ... but no call to FitBounds (user would not undertand  
      // a focus change due to changes in the source data)
    }


  }

    // ... Change map focus (selection with zoom in)  except if the additional Row has been created by the widget
  if ( internalAddRow ) {
    ChangeCurrentRow(record.id);
    ChangeMapSelection(recordFeature);
  }
  else {
    SetCurrentRow(record.id);
    ChangeMapFocus(recordFeature); // null if skippedrecord
  }
  
});
//
//  Management of NewRecord Dialog Box
//
// To manage styling of record select input (greyed when empty)
// Browsers don’t automatically update the value attribute when
// the user changes selection — they update the property, not the
// HTML attribute. So pure CSS trick doesn't work without this
// JavaScript sync .
function handleRecordSelectChange() {
	const saveNewRowBtn = document.getElementById('saveNewRow');
	const newRowTitle = document.getElementById('newRowTitle');
  if (newRecordSelect.value === "") {
    newRecordSelect.style.color = "#888"; // grey
		saveNewRowBtn.textContent = "Ajouter";
  } else {
    newRecordSelect.style.color = "#000"; // normal
		saveNewRowBtn.textContent = "Actualiser";
		// Set newRowTitle with the title of the selected Record
		newRowTitle.value = recordLookup[newRecordSelect.value].title;
  }
}
//
// Apply to both modals
document.addEventListener("DOMContentLoaded", function() {
	makeDraggable("widgetParameters");
	makeDraggable("widgetNewRow");		
});
//
// Reusable function to make any modal draggable
function makeDraggable(modalId) {
  const content = document.getElementById(`${modalId}Content`);
  const header = document.getElementById(`${modalId}Header`);
  let offsetX = 0, offsetY = 0, isDragging = false;

  header.addEventListener("mousedown", function(e) {
    isDragging = true;
	content.style.transform = ""; // remove centering transform
    offsetX = e.clientX - content.offsetLeft;
    offsetY = e.clientY - content.offsetTop;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  function onMouseMove(e) {
    if (!isDragging) return;
    content.style.left = (e.clientX - offsetX) + "px";
    content.style.top = (e.clientY - offsetY) + "px";
  }

  function onMouseUp() {
    isDragging = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }
}
//
/// END  OF FILE
/// For future use :

//
// @EditDialogBox : Functions for the management of the Dialog Box used to Add new
//  Table Rows and Update the mapped columns


















