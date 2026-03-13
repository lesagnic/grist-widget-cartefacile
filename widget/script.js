// Widget identification
//
const widgetName = "Grist Widget Carte Facile";
const widgetVersion = "1.0.16" // Increment at least last figure for new release
//
// Features
//
//	@GristAPI: Grist widget event handlers
//		@GristReady: set mapped columns (@MappedColumns), requiredAccess, allowSelectBy
//		@GristOnOptions: debug trace
//		@GristOnRecords: set recordLookup (@Recordlookup), BBox (@BoundingBox)
//		@GristOnRecord
//	@RecordBox: Record Dialog Box to edit the records of the GRIST Table)
//	TBD : make these variable local to the DOMContentLoaded event listener whiche means
//	to move all functions refering to DOM element inside the listener
let recordBox = null;
let addRecordBtn = null;
let updateRecordBtn = null;
let deleteRecordBtn = null;
let editRecordSelect = null;
//		@RecordBoxSelector : select input for records
//	@ParameterBox: Dialog Box to edit widget parameters
let parameterBox = null;
//	@ContextMenu: Context menu (on right click)
let contextMenu = null; // context Menu HTML element
let clickedLngLat = null; // geographic location of the right click event
//		@AddRecord
//		@UpdateRecord
//		@ShowCoordinates
//	@InstructionControl: Display user instructions in a 'top'left Map Libre Control
let instructionControl = null;
//		SetInstruction: Display a (new) instruction
//		UnsetInstruction: Remove the (last) instruction
//	@WidgetControl : Management of GRIST Widget main Control
//		@WcBtnMngt: Disable/Enable a Button
//		@HandleEditRecordClick 
//		@HandleEditRecordEscKey
//		@FitBoundsBtn => @FitBounds
//		@MapFocusBtn => @MapFocus
//		@AddRowBtn => @HandleEditRecordClick, @HandleEditRecordEscKey
//		@ParameterBtn => ... TBD
//	@Recordlookup : Easy access to record data from record key
let recordLookup = {};
//	@BoundingBox : Bounding Box of valid rows ([0]=>west, [1]=>south, [2]=>east, [3] = north)
let BBox = [];
//	@MapLibre : management of of the map
let mapLibre = null; // reference to the map
//		@FitBounds : Zoom on the BBox (@BoundingBox)
//		@NavigationControl: Navigation Built-in Map Libre Control
//		@ScaleControl: Scale Built-in Map Libre Control
//		@MapSelectorControl: Built-in Carte Facile Control (select style and overlay to display)
//		@SearchControl: new Built-in Carte Facile Control (find a place by name)
//		@Marker : each record a represented on the map with a marker symbol
//		@Cluster: Agregation of records in high density area
//		@SelectedMarker: Highlight the marker of the selected record with a different color
//		@SelectedPopup: Display the selected record title in a Popup
//		@HoverPopup: Display the record title on a Popup when the cursor is hover a record marker
//	@CursorShape
//	@OutsideClick
//		
//
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
// Styling of markers (@Marker)
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
// Styling of Popup (@HoverPopup, @SelectedPopup)
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
// When onRecord is called before the mapLibre is ready, lateMapFocus is set to true
// in order to ChangeMapFocus as soon as the mapLibre is ready
let lateMapFocus = false;
// Detect removal of a row
let recordRemoval = false;
// Columns Mapping for AddRows
let mapping = {};
// 
// Mapping management
//
// list of features corresponding to valid rows
let geojsonFeatures = [];
// It is used in onRecord to avoid style changes when the mapLibre is not yet loaded
// Cluster radius (0=>no cluster) in pixels. This can be changed by the users
// via the widget buttons to fit the feature density.
let clusterRadius = 30;
// Flag set to true when mapLibre has been loaded. 
let mapReady = false;
//
//
// SetCursorPos expect a position in the table not the record.id : keep track of the records to determine the position from the id.
let currentRecords = [];
//

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
	.addTo(mapLibre);
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
		mapLibre.flyTo({
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
    mapLibre.setPaintProperty('unclustered-point', 'icon-color', [
      'case',
      ['==', ['coalesce', ['get', 'id'], ''], ['literal', currentRowId || '']],
      selectedColor,
      defaultColor
    ]);
  }
  else { // no selection
    mapLibre.setPaintProperty('unclustered-point', 'icon-color', defaultColor);
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
	mapLibre.fitBounds(BBox, {
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
		if ( !mapLibre.getSource('markers') ) {
			mapLibre.addSource('markers', {
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
		mapLibre.addLayer({
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
		mapLibre.addLayer({
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
		mapLibre.addSource('markers', {
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
	if ( !mapLibre.hasImage('custom-marker') ) {   
		const img = new Image();
		img.onload = () => {
			mapLibre.addImage('custom-marker', img, { sdf: true });
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
	mapLibre.addLayer({
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
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// @InstructionControl : Display user instructions in a 'top'left Map Libre Control
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// InstructionControl class
class InstructionControl {
	constructor(message) {
		this._message = message;
	}
	onAdd(mapLibre) {
		this._map = mapLibre;
		this._container = document.createElement('div');
		this._container.className = 'maplibregl-ctrl instruction-control';
		this._container.textContent = this._message;
		return this._container;
	}
	onRemove() {
		this._container?.remove();
		this._map = undefined;
	}
}
//
function SetInstruction(message) {
	if ( instructionControl ) UnsetInstruction();
	// Add the control to the top-left corner
	instructionControl = new InstructionControl('Cliquez sur la position de la nouvelle ligne ou pressez ESC pour annuler');
	if (mapLibre && instructionControl) mapLibre.addControl(instructionControl,'top-left');
}
// @UnsetInstruction
function UnsetInstruction() {
	if (mapLibre && instructionControl) mapLibre.removeControl(instructionControl);
	instructionControl = null;
}
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// @WidgetControl: Management of GRIST Widget main Control
// This control exposes a set of buttons, each of them supporting a basic feature of the widget
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Widget Control class
class WidgetControl {
	// onAdd
	onAdd(mapLibre) {
		this._map = mapLibre;
		this._container = document.createElement('div');
		this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
		// @FitBoundsBtn
		let button = document.createElement('button');
		button.className = 'maplibregl-ctrl-icon fit-bounds-btn';
		button.type = 'button';
		button.title = 'Toutes les lignes';
		button.onclick = () => {
			FitBounds(); // @FitBounds
		};
		this._container.appendChild(button);
		// @MapFocusBtn
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
		// @AddRowBtn
		button = document.createElement('button');
		button.className = 'maplibregl-ctrl-icon add-row-btn';
		button.type = 'button';
		button.title = "Ajout d'une ligne";
		button.id = 'AddRowBtn';
		button.onclick = () => {
			disableBtn('AddRowBtn');
			// Help the user
			SetInstruction('Cliquez sur la position de la nouvelle ligne ou pressez ESC pour annuler');
			// Use a dedicated cursor shape
			mapLibre.getCanvas().style.cursor = svgCursorUri;
			// Ensure controls keep their normal pointer
			document.querySelectorAll('.maplibregl-ctrl button').forEach(btn => {
  				btn.style.cursor = 'pointer';
			});
			// Listen for click events or ESC key
			mapLibre.on('click', handleEditRecordClick);
			document.addEventListener('keydown', handleEditRecordEscKey);
			// ... and ensure the mouse cursor remains
			document.addEventListener('mousemove', handleEditRecordMouseMove, true);
		};
		this._container.appendChild(button);
        // @ParameterBtn
		button = document.createElement('button');
		button.className = 'maplibregl-ctrl-icon parameters-btn';
		button.type = 'button';
		button.title = 'Paramètres';
		button.onclick = () => {
			document.getElementById('clusterRadius').value = clusterRadius;
    		parameterBox.style.display = 'block';
		};
		this._container.appendChild(button);
		return this._container;
	} // End onAdd()
	onRemove() {
		this._container?.remove();
        this._container = null;
        this._map = undefined;
	} // End onRemove()
}
//
// @WcBtnMngt: Disable a Button
// TBD : Determine whether disableBtn/enableBtn should not be WidgetControl class methods
function disableBtn ( btnId ) {
	const btn = document.getElementById(btnId);
	if ( btn ) {
		btn.disabled = true;
		btn.classList.add('disabled');
	}
}
// @WcBtnMngt: Enable a Button
function enableBtn ( btnId ) {
	const btn = document.getElementById(btnId);
	if ( btn ) {
		btn.disabled = false;
		btn.classList.remove('disabled');
	}
}
// 
// @WidgetControl, @HandleEditRecordClick
// After a click event related to this function, it :
function handleEditRecordClick(e) {
	//
	// 1. Gets the geograpohic coordinates of the click
	const lng = e.lngLat.lng.toFixed(6);
	const lat = e.lngLat.lat.toFixed(6);
	//
	// 2. Prepares the Add/Update Dialog Box
	// 2.1 : Set Dialog box Lon/Lat inputs using the coordinates of the click
	if (document.getElementById('editRecordLat')) document.getElementById('editRecordLat').value = lat;
	if (document.getElementById('editRecordLon')) document.getElementById('editRecordLon').value = lng;
	// 2.2 Hide update and delete button, show add button
	addRecordBtn.disabled = false;
	updateRecordBtn.disabled = true;
	deleteRecordBtn.disabled = true;
	//
	// 3. Restore the context before Add row Button click @AddRowBtn
	//
	// 3.1. Remove listeners
	mapLibre.off('click', handleEditRecordClick);
	document.removeEventListener('keydown', handleEditRecordEscKey);
	document.removeEventListener('mousemove', handleEditRecordMouseMove, true);
	// 3.2 Restore default cursor
	mapLibre.getCanvas().style.cursor = '';
	// 3.4 Remove instruction control
	UnsetInstruction();
	// 3.5 Enable AddRowBtn button again
	enableBtn('AddRowBtn'); // 
	//
	// 4. Display the Add/Update Dialog Box
	//
	// Only need change the display styling of the Dialog Box div
	recordBox.style.display = 'block';
}
//
// @WidgetControl, @HandleEditRecordEscKey : ESC key handler
// Run in parallel to handleEditRecordClick to stop listening to a click on te map
function handleEditRecordEscKey(e) {
	if (e.key === 'Escape') {
		mapLibre.off('click', handleEditRecordClick);
		document.removeEventListener('keydown', handleEditRecordEscKey);
		document.removeEventListener('mousemove', handleEditRecordMouseMove, true);
		mapLibre.getCanvas().style.cursor = '';
		UnsetInstruction(); // Remove instruction control
		enableBtn('AddRowBtn'); // Enable the button again
		// No recordBox display => need to reset the form fields before leaving
		document.getElementById('editRecordSelect').value = '';
		document.getElementById('editRecordTitle').value = '';
		document.getElementById('editRecordLat').value = '';
		document.getElementById('editRecordLon').value = '';
	}
}
//
// To avoid external cursor changes while chosing the new row location
function handleEditRecordMouseMove(e) {
	e.target.style.cursor = svgCursorUri;
}
//
// @EditTable : Add a new row using mapped names
async function addOrUpdateRow(id,titre,lat,lon) {
if (debug) console.log(widgetRootMsg+"addOrUpdateRow: id"+id+
					  ", titre="+titre+
					  ", lat="+lat+
					  ", lon="+lon
);	
	// Check mappings
	if (!mapping.Longitude || !mapping.Latitude || !mapping.Titre) {
		console.error(widgetRootMsg+"Column Mapping not ready");
		return;
	}
	// Build the record object using real column IDs
	// TBD : clarifiy whether titre, lon, lat have to checked
	// At this stage, titre can't be reset which may be a useless constraint
	// for the user 
	let fields = {};
	fields[mapping.Titre] = titre;
	if ( lat==="" ) fields[mapping.Latitude]="";
	else fields[mapping.Latitude] = Number(lat);
	if ( lon==="" ) fields[mapping.Longitude] = "";
	else fields[mapping.Longitude] = Number(lon);
	//
	// Proceed to Table update with error catching
	//
	try {
		//
		// Option 1 : Update row when a valid id is provided	
		if ( id > 0 ) {
			// 1.1 Call GRIST API for update
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
		// 
		//	Option 2 : Add row
		} else {
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
			} // end of if result
		} // end of option 2
	//
	// If not successfull
  	} catch (err) {
    	internalAddRow = false; // creation unsuccessfull
    	console.error(widgetRootMsg+"Error adding row:", err);
	}
} // end of function addOrUpdateRow
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// API GRIST : ready
// @GristAPI, @GristReady
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
			allowMultiple: false // Permet l'attribution de plusieurs colonnes
		}
	],
	allowSelectBy: true // Permet de choisir ce widget comme input d'un autre widget
});
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// GRIST Contexte when it is ready
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Log version once on load
if (debug) console.log(widgetRootMsg+"Widget is ready");
// Send widget location info to the console...
if (debug) console.log(widgetRootMsg+"href: "+window.location.href);
if (debug) console.log(widgetRootMsg+"origin: "+window.location.origin);
if (debug) console.log(widgetRootMsg+"pathname: "+window.location.pathname);
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// AT THIS STAGE, NEED TO WAIT FOR DOM CONTENT TO BE LOADED
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Apply to all modal Dialog Boxes
document.addEventListener("DOMContentLoaded", function() {
	//
	// Init dialog Box and context Menu
	// @ParameterBox : init
	parameterBox = document.getElementById('widgetParameters');
	// @RecordBox : init
	recordBox = document.getElementById('widgetEditRecord');
	cancelRecordBtn = document.getElementById('cancelEditRecord');
	addRecordBtn = document.getElementById('addRecord');
	updateRecordBtn = document.getElementById('updateRecord');
	deleteRecordBtn = document.getElementById('deleteRecord');
	editRecordSelect = document.getElementById('editRecordSelect');
	handleRecordSelectChange();
	// ...and whenever selection changes


	// @ContextMenu : init
	contextMenu = document.getElementById('contextMenu');
	//
	// RecordBox elements listeners
	//
	editRecordSelect.addEventListener("change", handleRecordSelectChange);
	cancelRecordBtn.addEventListener('click', () => {
				// Stop listener
				//document.removeEventListener("change", handleRecordSelectChange);
		recordBox.style.display = 'none';
		document.getElementById('editRecordSelect').value = '';
		document.getElementById('editRecordTitle').value = '';
		document.getElementById('editRecordLat').value = '';
		document.getElementById('editRecordLon').value = '';
	});
	addRecordBtn.addEventListener('click', async () => {
		recordBox.style.display = 'none';
		await addOrUpdateRow(0,
			document.getElementById('editRecordTitle').value,	
			document.getElementById('editRecordLat').value,
			document.getElementById('editRecordLon').value
		);
		document.getElementById('editRecordSelect').value = '';
		document.getElementById('editRecordTitle').value = '';
		document.getElementById('editRecordLat').value = '';
		document.getElementById('editRecordLon').value = '';
	});
	updateRecordBtn.addEventListener('click', async () => {
		recordBox.style.display = 'none';
		if ( Object.hasOwn(recordLookup, document.getElementById('editRecordSelect').value) ) {
			await addOrUpdateRow(recordLookup[document.getElementById('editRecordSelect').value].id,
				document.getElementById('editRecordTitle').value,
				document.getElementById('editRecordLat').value,
				document.getElementById('editRecordLon').value
			);
		}
		else console.log(widgetRootMsg+"Can't update record: "+document.getElementById('editRecordSelect').value);
		document.getElementById('editRecordSelect').value = '';
		document.getElementById('editRecordTitle').value = '';
		document.getElementById('editRecordLat').value = '';
		document.getElementById('editRecordLon').value = '';
	});
	deleteRecordBtn.addEventListener('click', async () => {
		recordBox.style.display = 'none';
		if ( Object.hasOwn(recordLookup, document.getElementById('editRecordSelect').value) ) {
			//await addOrUpdateRow(recordLookup[document.getElementById('editRecordSelect').value].id,
			//	document.getElementById('editRecordTitle').value,
			//	Number(document.getElementById('editRecordLat').value),
			//	Number(document.getElementById('editRecordLon').value)
			//);
			alert("La fonctionnalité de suppression est en cours de mise en oeuvre");
		}
		else console.error(widgetRootMsg+"Can't delete record: "+document.getElementById('editRecordSelect').value);
		document.getElementById('editRecordSelect').value = '';
		document.getElementById('editRecordTitle').value = '';
		document.getElementById('editRecordLat').value = '';
		document.getElementById('editRecordLon').value = '';
	});						 
	//
	makeDraggable("widgetParameters");
	makeDraggable("widgetEditRecord");		
	//
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	// API GRIST : onOptions
	// @GristAPI, @GristOnOptions
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	grist.onOptions((options,settings) => {
if (debug) console.log(widgetRootMsg+"settings:"+JSON.stringify(settings, null, 2));
if (debug) console.log(widgetRootMsg+"options:"+JSON.stringify(options, null, 2));
	});
	//
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	// API GRIST : onRecords
	// @GristAPI, @GristOnRecords
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	grist.onRecords((table, colMapping) => {
if (debug) console.log(widgetRootMsg+"onRecords : "+table.length);
		//
		// 0. Init
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
		// ... and replace Dialog Box labels with mapped column names @UserContext
		document.getElementById('editRecordLabelTitle').textContent = mapping.Titre;
		document.getElementById('editRecordLabelLatitude').textContent = mapping.Latitude;
		document.getElementById('editRecordLabelLongitude').textContent = mapping.Longitude;
		//
		// 1. Definition de la Bouding Box des données et de la liste de features
		table.forEach ( record => {
			// Get mapped columns (@MappedColumns)
			const mapped = grist.mapColumnNames(record);
			// Add a geojsonFeature from record data
			if ( mapped && mapped.Longitude && mapped.Latitude && mapped.Titre && record.id ) {
				geojsonFeatures[geojsonFeatures.length] = {
					type: 'Feature',
					geometry: { type: 'Point', coordinates: [mapped.Longitude, mapped.Latitude] },
					properties: { id: record.id, title: mapped.Titre }
				};
			}
			else console.warn(widgetRootMsg+
							  "Skipped record [id="+record.id+
							  ", Titre="+mapped.Titre+
							  ", Lat="+mapped.Latitude+
							  ", Lon="+mapped.Longitude+"]");
			// Add the record to the recordLookup (@Recordlookup)
			if ( mapped ) addRecord2Lookup(record.id, mapped.Titre, mapped.Latitude, mapped.Longitude);
		}); // End table.forEach
		//
		// Update editRecordSelect input of recordBox with new recordLookup
		SetEditRecordSelect();
		//
		// 2. Compute BBox (@BoundingBox)
		BoundingBox(geojsonFeatures);
		if ( !BBox || !BBox[0] || !BBox[1] || !BBox[2] || !BBox[3]) {
			console.warn(widgetRootMsg+": Bounds not fully defined ["+BBox[0]+", "+BBox[1]+", "+BBox[2]+", "+BBox[3]+"]");
   	 	return;
  		}
		//
		// 3. Set the map if if does not existe yet (@MapLibre)
		if ( !mapLibre ) {
			// Create Map Libre map
			mapLibre = new maplibregl.Map({
				container: 'map', // id du conteneur de la carte
				style: CarteFacile.mapStyles.simple, // style de carte
				maxZoom: highestZoomLevel
			});
			// @NavigationControl: Add control
			// TBD: It is 'top-right' placed by default. Should the placement be made explicit ?
	  	  	mapLibre.addControl(new maplibregl.NavigationControl);
			// @ScaleControl: Ajout d'une échelle
			// TBD: It is 'bottom-left' placed by default. Should the placement be made explicit ?
			mapLibre.addControl(new maplibregl.ScaleControl);
			// Pas de bouton de Geolocalisation car l'objectif est de visualiser les données de la table
			// @MapSelectorControl: Ajout d'un sélecteur de carte
			// TBD: It is 'top-right' placed by default. Should the placement be made explicit ?
			mapLibre.addControl(new CarteFacile.MapSelectorControl({
  				styles: ['simple', 'aerial'],
  				overlays: ['administrativeBoundaries', 'cadastre', 'levelCurves']
			}));
			// The styles and the overlays listed in MapSelectorControl parameter are made available
			// but are not displayed except 'simple' style. I understand that the function CarteFacile.hideLayer
			// and Cartefacile.showLayer can be used to hide and show layers considering that an overlay and style
			// involve each many layers displays at different scales... At this stage :
			//CarteFacile.showLayer(mapLibre, [
			//	'boundaries_commune',
			//	'boundaries_epcis',
			//	'boundaries_departments',
 			//	'boundaries_regions',
			//	'boundaries',
			//	'buildings',
			//	'streets',
			//	'street_labels'
			//]);
			// TBD: test whether the addOverlay function of Carte Facile is public
			// There is also a removeOverlay function
			CarteFacile.addOverlay(mapLibre, 'administrativeBoundaries');
			// CarteFacile.LayerGroup is used below in debug mode to display the layer groups available.
			// This will help to ajuts the list of layers to show
if (debug) console.log("CarteFacile LayerGroup:\n"+JSON.stringify(CarteFacile.LayerGroup, null, 2));
			// @SearchControl : new carte facile built-in control for Mal Libre
			// TBD: It is 'top-left' placed by default. Should the placement be made explicit ?
			mapLibre.addControl(new CarteFacile.SearchControl({
				placeholder: 'Rechercher une adresse…',
				debounceMs: 300,    // Délai avant déclenchement (ms)
				minChars: 3,        // Nombre minimum de caractères
				maxResults: 6      // Nombre maximum de résultats affichés
			}));
			// @WidgetControl : add internal WidgetControl class instance to map
			mapLibre.addControl(new WidgetControl(), 'top-right');
			document.getElementById('cancelSettings').addEventListener('click', () => {
				parameterBox.style.display = 'none';
			});
			document.getElementById('saveSettings').addEventListener('click', () => {
				parameterBox.style.display = 'none';
				if ( Number(document.getElementById('clusterRadius').value) < 0 ) return;
				if ( clusterRadius !== Number(document.getElementById('clusterRadius').value) ) {
					clusterRadius = Number(document.getElementById('clusterRadius').value) ;
					if (mapLibre.getSource('markers')) {
						// Remove layers first (in reverse order of how they were added)
						if (mapLibre.getLayer('unclustered-point')) mapLibre.removeLayer('unclustered-point');
						if (mapLibre.getLayer('cluster-count')) mapLibre.removeLayer('cluster-count');
						if (mapLibre.getLayer('clusters')) mapLibre.removeLayer('clusters');
						mapLibre.removeSource('markers');
					}
					AddGristTable2Map ();
				}
			}); // End click listener saveSettings
			// Close parameterBox when clicking outside content
			window.addEventListener('click', (event) => {
	      		if (event.target === parameterBox) {
					parameterBox.style.display = 'none';
				}
				if (event.target === recordBox) {
					// Stop listener
					document.removeEventListener("change", handleRecordSelectChange);
					recordBox.style.display = 'none';
					document.getElementById('editRecordSelect').value = '';
					document.getElementById('editRecordTitle').value = '';
					document.getElementById('editRecordLat').value = '';
				document.getElementById('editRecordLon').value = '';
	   	   		}
			}); // end click listener on window
			//
			//
			// Chargement de la carte
			mapLibre.on('load', () => {
				//
				// Focus on the BBox
				FitBounds();
				AddGristTable2Map ();
				//
				// Inspect a cluster on click (@ClusterZoomIn)
				mapLibre.on('click', 'clusters', async (e) => {
					const features = mapLibre.queryRenderedFeatures(e.point, {
						layers: ['clusters']
					});
					if ( !features.length ) return;
					const zoom = await mapLibre.getSource('markers').getClusterExpansionZoom(features[0].properties.cluster_id);
					// Click event is sometimes intercepted for the clusters layer when clicking a
					// feature of the unclustered-point layer. zoom may be Nan in this case...
					if ( isNaN(zoom) ) return;
					mapLibre.easeTo({
						center: features[0].geometry.coordinates,
						zoom: zoom
					});
				}); // End on clusters click
				//
				// Inspect a uncluster-point click
				mapLibre.on('click', 'unclustered-point', (e) => {       
					if ( !e || e.features[0].properties.id == currentRowId ) return;
					// Change current row
					ChangeCurrentRow(e.features[0].properties.id);
					ChangeMapSelection(e.features[0]);
				});
				//
				// Check popup visibility on every render
				mapLibre.on('render', () => {
					if (!currentRowId || !mapLibre.getLayer('unclustered-point') ) return;
					// Query features with currentRow
					// This query returns features with approximayte coordinates, but
					// the goal is to check whether the feature is rendered or not
					const features = mapLibre.queryRenderedFeatures(undefined, {
						layers: ['unclustered-point'],
						filter: ['==', ['get', 'id'], currentRowId]
					});
					// Sync visibility of Popup and the unclustered point of the feature   
					if ( features && features[0] ) {
						// if activePopup is null, the unclustered point is visible again 
						// => the pop up needs to be created
						// create the popup with the coordinates from geojsonFeatures which 
						// are better that the one retrieved by the queryRenderFeatures
   	       			if ( !activePopup ) activePopup = NewActiveFeaturePopup(geojsonFeatures.find(item => item.properties.id === currentRowId));
					} else {
						// if the unclustered point is not visible, the active pop up
						// has to be removed
						if ( activePopup ) {
							activePopup.remove();
							activePopup = null;
						}
					}
				}); // End of on render
				//
				// Inspect mouseenter unclustered point to change cursor 
				// and display popup (@HoverPopup)
				mapLibre.on('mouseenter', 'unclustered-point', (e) => {
					if ( e.features[0].properties.id != currentRowId ) {
						mapLibre.getCanvas().style.cursor = 'pointer';
						hoverPopup
							.setLngLat(e.features[0].geometry.coordinates.slice())
							.setHTML(e.features[0].properties.title)
							.addTo(mapLibre);
					} 
				});
				//
				// Inspect mouseleave unclustered point to restore default cursor 
				// and remove popup (@HoverPopup)
				mapLibre.on('mouseleave', 'unclustered-point', () => {
					mapLibre.getCanvas().style.cursor = '';
					hoverPopup.remove();
				});
				//
				// Inspect mouse enter on a cluster (@Cluster) to change cursor (@CursorShape)
				mapLibre.on('mouseenter', 'clusters', () => {
					mapLibre.getCanvas().style.cursor = 'pointer';
				});
				//
				// Inspect mouse leave on a cluster (@Cluster) to restore cursor (@CursorShape)
				mapLibre.on('mouseleave', 'clusters', () => {
					mapLibre.getCanvas().style.cursor = '';
				});  
				//
				// @ContextMenu listeners
				//
				// Intercept right-click to show context menu (@ContextMenu)
				mapLibre.on('contextmenu', (e) => {
					e.preventDefault(); // Prevent default browser menu
					clickedLngLat = e.lngLat;
					// Position the menu at mouse location
					contextMenu.style.left = e.point.x + 'px';
					contextMenu.style.top = e.point.y + 'px';
					contextMenu.style.display = 'block';
					// TBD : Grey Update record context menu item if there isn't 
					// any record marker at this location
	  			});
				//
				// Hide menu on map click or move (@ContextMenu)
				mapLibre.on('click', () => contextMenu.style.display = 'none');
 			 	mapLibre.on('movestart', () => contextMenu.style.display = 'none');
				//
  				// On click on action 1 (@AddRecord) : Add record to table (@ContextMenu)
				// TBD : Use NewRecord Dialog Box throug a generic function managing
				// this action, action 2 and the action related to add row from the widget control
				document.getElementById('contextMenuAdd').addEventListener('click', () => {
					alert("Mise en oeuvre en cours de l'ajout d'une ligne au point ("+
						  clickedLngLat.lat.toFixed(6)+
						  ","+
						  clickedLngLat.lng.toFixed(6)+")");
					contextMenu.style.display = 'none';
				});
				// 
				// On click on Action 2 (@UpdateRecord): Update Record (@ContextMenu)
				// TBD: See action 1
				document.getElementById('contextMenuUpdate').addEventListener('click', () => {
					alert("Mise en oeuvre en cours de la mise à jour d'une ligne au point ("
								+clickedLngLat.lat.toFixed(6)
								+","
								+clickedLngLat.lng.toFixed(6)
								+")"
					);
					contextMenu.style.display = 'none';
				});
				//
				// On click on Action 3 (@ShowCoordinated): Show coordinates (@ContextMenu)
				// TBD : Enhance presentation possibly using a Dialog Box
				document.getElementById('contextMenuShow').addEventListener('click', () => {
					alert(`Latitude: ${clickedLngLat.lat.toFixed(6)}\nLongitude: ${clickedLngLat.lng.toFixed(6)}`);
					contextMenu.style.display = 'none';
				});
				//
				// Hide menu if clicking outside (@OutsideClick)
				// TBD : check whether this event does not already exist
				document.addEventListener('click', (e) => {
					// @ContextMenu cancel
					if (contextMenu && !contextMenu.contains(e.target)) {
						contextMenu.style.display = 'none';
					}
				});
			}); // end mapLibre.on load	
		} // if (!mapLibre)
		else { // when there is already a mapLibre :
			//
			// 1) Need to recompute BBox in case of further click to fit-bounds-btn
			BoundingBox(geojsonFeatures);
			// ... but no call to FitBounds (user would not undertand  
			// a focus change due to changes in the source data)
			//
			// 2) Need to update the data
			const src = mapLibre.getSource('markers');
			if (src) src.setData({
				type: 'FeatureCollection',
				features: [...geojsonFeatures] // Again, need to clone the data
			});
			//
			// In case of record removal, it seems more appropriate
			// to relocate the map to an overview of the table records
			// and to select the first valid record
			if ( recordRemoval ) {
				FitBounds();
				ChangeCurrentRow(geojsonFeatures[0].properties.id);
				ChangeMapSelection(geojsonFeatures[0]);
			}
		}  // end else if (!mapLibre)  
	});	  // End of onRecords
// Temporary end of clean-up
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
      // Expecting the mapLibre is ready
      ChangeMapSelection(geojsonFeatures.find(item => item.properties.id === record.id));
    }
    return;
  } // On ne va pas plus loin si l'appel onrecord est consicutif à SetCurPos du widget.
  
  // Ensure mapLibre is ready
  // Just change the currentRowId if not ready
  // This a a way to get the current row from a source widget before 
  // the mapLibre loading and the intialization of the Geojson features
  if ( !mapReady ) {
if(debug) console.log(widgetRootMsg+"onRecord map is not ready - record.id: "+record.id)
    SetCurrentRow(record.id);
    // mapLibre is not ready yet: no need to ChangeMapFocus
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

    // ... Update of Map Libre Source
    const src = mapLibre.getSource('markers');
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
	function SetEditRecordSelect () {
		if ( !editRecordSelect ) return;
		editRecordSelect.innerHTML = "";
		// Create the placeholder option
		const placeholder = document.createElement("option");
		placeholder.textContent = "Choisissez une ligne à mettre à jour..."; // visible text
		placeholder.value = "";                          // empty value
		placeholder.selected = true;                     // selected by default
		editRecordSelect.appendChild(placeholder);
		// Add new option for each identified record in recordLookup key alphabetic order
		// (more or less in record.id order)
		// TBD : Ensure a formatting of recordLookup Keys ensuring id numeric order 
		Object.keys(recordLookup)
  			.sort((a, b) => a.localeCompare(b)) // localeCompare handles case & accents
  			.forEach(key => {
				const option = document.createElement("option");
  				option.value = key;
  				option.textContent = key;
				editRecordSelect.appendChild(option);
			});
	}
	//
	// To manage styling of record select input (greyed when empty)
	// Browsers don’t automatically update the value attribute when
	// the user changes selection — they update the property, not the
	// HTML attribute. So pure CSS trick doesn't work without this
	// JavaScript sync .
	function handleRecordSelectChange() {
		const editRecordTitle = document.getElementById('editRecordTitle');
		if (editRecordSelect.value === "") {
			editRecordSelect.style.color = "#888"; // grey
			addRecordBtn.disabled = false;
			updateRecordBtn.disabled = true;	
		} else {
			editRecordSelect.style.color = "#000"; // normal
			addRecordBtn.disabled = true;
			updateRecordBtn.disabled = false;	
			// Set editRecordTitle with the title of the selected Record
			editRecordTitle.value = recordLookup[editRecordSelect.value].title;
	  	}
	}
//
// Reusable function to make any modal Dialog Boxes draggable
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


});
//
/// END  OF FILE
/// For future use :

//
// @EditDialogBox : Functions for the management of the Dialog Box used to Add new
//  Table Rows and Update the mapped columns




































