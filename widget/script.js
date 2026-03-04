//
// Widget Carte Facile
// 
// Increment last figure when testing a new change
const widgetVersion = "1.0.4"
const widgetRootMsg = `Grist Widget Carte Facile v${widgetVersion} `;
// 
// Known issues :
// 1) When clicking on a selected feature, the activePopup disappears
// 2) Issues related to source linked widget
//    a) Since Carte Facile widget calls setCursorPos, GRIST does not send
//       onRecords whan changing the filters of the source widget
//    b) Selection of records via Carte Facile widget are not reflected on
//       the source widget if there is no cross-linking. Cross-linking seems
//       to work better, even if clinking on the selected record in the source
//       widget will not generate a Map Focus (GRIST does not send a call
//       to onRecord on the currentRow to avoid infinit loops). Another record 
//       has to be selected first...
//

// Pour afficher les données des lignes d'une table GRIST sous forme de Markers sur
// un fond cartes.gouv
//
// Chaque ligne "valide" de la table source est associé à un objet de la collection
// (FeatureCollection) "geojsonFeatures". Chaque objet comprend :
// - une géométrie représentée par un couple de coordonnées provenant des colonnes mappées
//   "Longitude" et "Latitude" ;
// - des propriétés :
//     o id correspondant à l'identifiant de la ligne du tableau ;
//     o title correspondant à la colonne mappée "Titre".
// La ligne est considéréparame valide lorsque les 3 colonnes mappées contiennent bien une valeur.
// Pour la longitude et la latitude, ont fait bien la différence entre la valeur 0 qui est 
// valide est la valeur null (pas de valeur) qui n'est pas valide. La colonne mappée "Titre"
// doit également contenir un texte non vide pour que la ligne soit valide. Un message de 
// type warning est transmis à la console pour signaler les objets invalides. Par exemple, la
// ligne identifié 4 a une latitude nulle ('Invalid record' est bien la valeur de "Titre") :
// > WIDGET Cartes.gouv : Skipped record [id=4, Titre=Invalid record, Lat=null, Lon=1.5]
// S'il n'y a pas de ligne valide, un message de type warning est transmis à la console
// pour indiquer que le rectangle englobant n'est pas complètement défini :
// > WIDGET Cartes.gouv : Bounds not fully defined [null, null, null, null]
// En pratique, la carte n'est pas créée tant qu'il n'y a pas de ligne valide.
//
// La visualiation cartographique du widget est assurée au travers de la variable globale "map" 
// qui représente une carte MapLibre dans le style "CarteFacile.mapStyles.simple". CarteFacile
// est un service de représentation cartographique souveraine compatible avec les données IGN
// et OpenStreetMap. Le style "simple" correspond aux données IGN.
// La carte MapLibre comprend :
// - les contrôles suivants :
//     o Navigation (NavigationControl) et Gestion de l'échelle (ScaleControl) de MapLibre ;
//     o Sélecteur de carte (MapSelectControl) du service CarteFacile permettant de basculer
//       sur le fond OSM ou d'afficher des données complémentaires ;
//     o un contrôle spécifique à ce widget de recentrage de la carte sur les objets
//       de la table GRIST source.
// - une unique source de données "markers" consituée de la collection d'objets
//   "geojsonFeatures". L'option "cluster" est activée ; elle permet d'agréger les objets 
//   dans les zones denses à certaines échelles (jusqu'à un facteur de zoom définit par 
//   la variable "clusterMaxZoom").
// - les couches de données suivantes construites à partir de la source "markers" :
//     o 'clusters' regroupent les objets agrégés créés à partir de la source markers pour
//       représenter les objets dans les zones trop denses. Les objets agrégés sont représentés
//       par un cercle dont le rayon et la couleur dépend du nombre d'objets agrégés ;
//     o 'cluster-count' permet de représenter, sous forme de labels superposées aux objets
//       agrégés, le nombre d'objets agrégés. Pour que la superposition du label sur le cercle
//       soit effective, il faut que la couche 'cluster-count' soit créée après la couche
//      'clusters" ;
//     o 'unclustered-point' regroupe les objets réellement dérivés de la table source. Ils sont
//       représentés par un symbole de localisation (de type "PinPoint) dont la couleur peut
//       changer pour indiquer la sélection d'un objet. Voir les variables "selectedColor" et 
//       "defaultColor" pour connaître la définition des couleurs de ces symboles.
// - Lors de la sélection d'un objet sur la carte, un Pop-up est affiché ; il contient la valeur
//   de la propriété "title" de l'objet. Il disparaît lorsque un nouvel objet est sélectionné ou
//   lorsque l'objet est agrégé suite à un zoom arrière. Ce Pop-up fait l'objet de la variable
//   "activePopup. 
//
// En tant que widget GRIST :
// - le paramètre "allowSelectBy" est positionné à "true" lors de l'appel à grist.ready pour
//   permettre d'utiliser le widget comme source d'un autre widget. Dans ce cadre, la variable
//   currentRowId contient l'identifiant de la ligne en cours. 
// - la création de la carte est de l'ensemble de son contenu est réalisé lors de l'appel à 
//   grist.onRecords. Cet appel intervient notamment lors de l'initialisation du widget et 
//   dès qu'il y a des changements dans les données de la tables. Le contenu de la variable
//   "geojsonFeatures" est donc redéfini à chaque appel de gris.onRecords, de même que length
//   rectangle engloblant "BBox" utilisé par le contrôle de recentrage sur les données. La 
//   carte est créée lors du premier appel ; lors de appels suivants ont se contente de redéfinir
//   les données de la source "markers" à partir du nouveau contenu de "geojsonFeatures" ;
// - il peut être associé à un widget source ce qui ne change rien sur le comportement de
//   grist.onrecords mais nécessite un traitement particulier via la fonction grist.onRecord
//   qui est invoqué à chaque fois qu'une nouvelle ligne du tableau est sélectionné ou que le
//   contenu d'une ligne est changé dans le widget source. Le widget réagit par un zoom sur 
//   l'objet de la nouvelle ligne sélectionné (si elle différente de la ligne courante) et 
//   analyse les évolutions du contenu de la ligne qui peut dans l'absolu être :
//     o devenue invalide, ce qui suppose de l'enlever de geojsonFeatures ;
//     o nouvelle, ce qui suppose au contraire de l'ajouter à geojsonFeatures ;
//     o un changement de géométrie ou sémantique (propriété title de l'objet) qui implique
//       d'ajuster l'objet correspondant de geojsonFeatures.
//   Notons que le widget génère lui aussi des appels à onRecord lorsque l'utilisateur
//   sélectionne un objet sur la carte. Pour éviter une boucle infinie, il ne faut donc pas
//   que le widget répercute un changement de ligne lorsque l'appel à onRecord vient de lui.
//  
// Le cycle de vie de la sélection est importante à comprendre :
// - Lorsque le widget est connecté à un widget source, il reçoit des appels à grist.onRecord
//   avant même que la carte ait pu créer et donc avant qu'il y ait eu le moindre appel
//   à grist.onRecords. Dans ce cas, on prend bien la peine d'initialiser la variable
//   currentRowId pour connaître l'objet à représenter sélectionnée lorsque la carte sera
//   initialisé. Mais évidemment, on agit pas sur la carte puisqu'elle n'existe pas ;
// - Lors du premier appel à onRecords on crée la carte. S'il y a un widget source connecté,
//   currentRowId est différent de null et on va représenter l'objet correspondant comme
//   étant sélectionné et on affiche son Popup. Sinon, currentRowId est null et on 
//   lui associé lors l'id de la première ligne de la table de manière à ce que l'objet
//   correspondant soit représenté sélectionné avec son Popup.
// - l'utilisateur peut alors sélectionné un autre objet sur la carte mais dans ce cas
//   on se contente de changer la sélection sans opérer de zoom. On laisse l'utilisteur
//   naviguer dans la carte et opérer lui-même les zooms que les objets qu'ils souhaitent
//   examiner ;
// - l'utilisateur peut alors décider d'agir sur le widget source connecté. On choisit alors
//   de répercuter les changements de ligne active dans le widget source par la sélection
//   de l'objet correspondant sur la carte mais cette fois-ci en faisant un zoom avant sur
//   l'objet concerné car le principe d'avoir cette connexion sur le widget source est bien
//   de mettre le focus sur l'objet dans le widget cartes.gouv. Le widget source sert alors 
//   au piloages de la navigation spatiale dans le widget cartes.gouv...
// - lorsque l'utilisateur veut revenir à une navigation spatiale pilotée par le widget cartes.gouv
//   il peut utiliser le bouton de recentrage pour appréhender les objets de la table dans leur
//   ensemble.
// - lors des zooms arrières, l'objet sélectionné peut disparaître et être remplacé par un objet
//   agrégé, mais il reste l'objet sélectionné. On se contente de faire temporairement disparaitre
//   son Popup. Lorsque l'objet sélectionné réapparaît, on réaffiche son Popup.
// - lorsque l'utilisateur sélectionne une ligne "invalide" de la table, il n'y a plus d'objets
//   sélectionné dans la carte mais la variable currentRowId contient bien l'identifiant de la
//   ligne "invalide". On opère pas non plus de zoom avant pour mettre le focus sur l'objet
//   de la carte puisqu'il n'en existe pas... Il y aura de nouveau un objet sélectionné dès que
//   l'utilisateur aure cliqué sur un objet de la carte ou sur une ligne valide au sein du 
//   widget source.
// 
//
// Variables Globales
/////////////////////////////////////////////////////////////////////////////////////////////////
// Debug management
//
// Cette variable est destinée à gérer des messages de la console destinée au debogage lors de
// l'évolution du widget. Cela se fait comme cela :
//       if (debug) console.log("Message de debogage");
// Le paramètre debug vaut true lorsque l'on debogue pour que les messages s'affichent. Il 
// permet de repérer très vite les lignes de debogage avant de passer le code en production.
// Lors du passage en production, on passe debug à false au cas où il resterait des messages...
const debug = true;
//
// Gestion de l'aspect des Markers
// L'URL du marker utilisé
const iconUrl = "marker.png";
const defaultColor = '#0070C0';   // bleu par défaut
const selectedColor = '#548235';  // vert lorsque sélectionné
// La hauteur nominale du marker.png est 82 pixels
// On le réduit avec le facteur de mise à l'échelle markerIconSize
const markerIconSize = 0.25;
const popupOffset = 13; // 2/3 de la hauteur du marker après mise à l'échelle//
// Gestion des zoom
// In MapLibre GL JS (and Mapbox GL JS), the zoom value is a floating‑point number where:
// 0 = whole world view
// ~5–7 = country level
// ~10–12 = city level
// ~14–16 = street/block level
// ~17–19 = building level
// 20+ = very close, individual building details (if tiles support it)
// Highest zoom level recommended for cartes.gouv is 18.9
const highestZoomLevel = 18.9;
// Cluster max zoom level for clusters
const clusterMaxZoom = 14;
// Set the Zoom to focus on a specific feature just above the clusterMawZoom
// to ensure that the feature marker will be visible
const focusZoom = clusterMaxZoom + 0.1;
//
// Les variables de gestion du Widget
//
// Id de la ligne sélectionnée du tableau (celle du marker sélectionné) et le Popup associé (actif)
let currentRowId = null;
let activePopup = null;
let hoverPopup = null;
//
// Detection of internal serCursorPos
let internalCursorPos = false;
//
// Variable globale pour la carte
let map = null;
// Déclaration d'un tableau pour y stocker les données de la table GRIST
// Chaque ligne est représentée par un feature Map Libre car dans une premiere mise
// en oeuvre les données étaient affichés en tant que Layer GeoJson
let geojsonFeatures = [];
// Le rectangle englobant
let BBox = [];
// Flag set to true when map has been loaded. 
// It is used in onRecord to avoid style changes when the map is not yet loaded
let mapReady = false;
//
// In Selected mode, the map is nor ready the first time on Record is called. So,
// the focus on the selected record can't be achieved. This flag is set to true
// in this case, so the focus be made later when loadinf the map...
//let lateMapFocus = false;
//
// Gestion des paramètres
const modal = document.getElementById('widgetParameters');
let clusterRadius = 30;
//
//
// Utilities function
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// The Active Popup of the selected feature is created in different contexts consistently
function NewActiveFeaturePopup(f) {
  return new maplibregl.Popup({
      offset: popupOffset,   // Ancrage au centre du cercle du marker
      className: 'maplibregl-popup'
    })
    .setLngLat(f.geometry.coordinates)
    .setHTML(`${f.properties.title}`)
    .addTo(map);
}
// Change of the current row happens also in different contexts
function ChangeCurrentRow(id) {
  if (id !== currentRowId) {
    currentRowId = id;
    internalCursorPos = true;
    grist.setCursorPos?.({rowId: id}).catch(() => {});
  }
}
//
// Change Map Selection and flyTo the selected feature
function ChangeMapFocus(f) {
if (debug) console.log(widgetRootMsg+"ChangeMapFocus : f: "+f);
  // Zoon in a the focus record when it is valid in "selected" widget mode
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
// Change the color of the marker corresponding to the current row,
// delete the previous Popup and create a new on using the data of feature f
function ChangeMapSelection(f) {

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
// Return the BoundingBox of a set of features
// A feature is expected to be a GeoJson objects.
// It should have a geometry composed of a valid couple of coordinates (Lon,Lat)
function BoundingBox(features) {
   // Initialisation des coordonnées de la Bouding Box avec une valeur improbable
  let westLng  = null;
  let southLat = null;
  let eastLng  = null;
  let northLat = null;

  if (!features) return;

  // ... calcul de la bounding box
  features.forEach(f => {
      if ( westLng == null || westLng > f.geometry.coordinates[0] ) {
        westLng = f.geometry.coordinates[0];
      }
      if ( southLat == null || southLat > f.geometry.coordinates[1] ) {
        southLat = f.geometry.coordinates[1];
      }
      if ( eastLng == null || eastLng < f.geometry.coordinates[0] ) {
        eastLng = f.geometry.coordinates[0];
      }
      if ( northLat == null || northLat < f.geometry.coordinates[1] ) {
        northLat = f.geometry.coordinates[1];
      } 
  });

  // Use the nullish coalescing operator (??) To keep a valid BBox when source data are emptied, 
  BBox[0] = westLng ?? BBox[0]; // BBox[0] set to westlng only if westLng is not null and defined
  BBox[1] = southLat ?? BBox[1]; 
  BBox[2] = eastLng ?? BBox[2];
  BBox[3] = northLat ?? BBox[3];

}
//
// Calcul dynamique du padding pour le recentrage en fonction de la BBoc
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
// Map data initializing based onclusterRadius
function CreateMap () {

  // Clustered Source
  if (clusterRadius> 0) {

    if (!map.getSource('markers')) {
      map.addSource('markers', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [...geojsonFeatures] // Need to clone geojsonFeatures instead of passing it by reference
        },
        cluster: true,
        clusterMaxZoom: clusterMaxZoom, // Maximum zoom level to cluster
        clusterRadius: clusterRadius // Radius of each cluster in pixels
        // 50 est trop grand 
      });
    }

    // Add a layer to display clusters:
    map.addLayer({
      id: 'clusters', 
      type: 'circle',
      source: 'markers',
      filter: ['has', 'point_count'], // important !!!
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

    //Add a layer for cluster labels
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

  } 
  //
  // Unclustered source
  else {
      map.addSource('markers', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [...geojsonFeatures] // Need to clone geojsonFeatures instead of passing it by reference
        },
        cluster: false
      });
  } //  if (clusterRadius > 0)

  //Add a layer for unclustered points...;
  //const iconUrl = "https://corsproxy.io/?https://lesagnic.github.io/grist-widget-cartefacile/widget/marker.png";
  if (!map.hasImage('custom-marker')) {
    
  /*  fetch(iconUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load marker.txt: ${response.statusText}`);
        }
        return response.text();
      })
      .then(rawBase64 => {
        // Ensure we have a proper data URL
        const markerBase64 = `data:image/png;base64,${rawBase64.trim()}`;

        // Load the image from the Base64 string
        map.loadImage(markerBase64, (err, image) => {
          if (err) {
            console.error("Failed to load marker image from Base64", err);
            return;
          }

          // Add the image to the map if not already present
          map.addImage('custom-marker', image, { sdf: true });
          console.log("Custom marker image added from marker.txt");
        });
      })
      .catch(err => console.error(err));
*/

    fetch(iconUrl)
      .then(res => res.blob())
      .then(blob => createImageBitmap(blob))
      .then(imageBitmap => {
        map.addImage('custom-marker', imageBitmap, { sdf: true });
      });
  }
     
  let iconColor = defaultColor;
  // apply selectedColor when id=currentRowId or defaultColor
  if ( !currentRowId ) iconColor = [
    'case',
    ['==', ['coalesce', ['get', 'id'], ''], ['literal', currentRowId || '']],
    selectedColor, // Selected point color
    defaultColor  // Default color
  ];
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

  
  // Map is now ready for style changes through onRecord
  mapReady = true;
if(debug) console.log("Map is ready!!!");

  // Select first line of the Grist table when creating the map
  // if it has not been set first by a call of onRecord...
  if ( currentRowId==null ) {
      ChangeCurrentRow(geojsonFeatures[0].properties.id);
      ChangeMapSelection(geojsonFeatures[0]);
  }

  //
  // Deal with the late Map Focus on the first onRecord call
  //if ( lateMapFocus ) {
    // Put the focus of the features related to the cirrentRowId
  //  ChangeMapFocus(geojsonFeatures.find(
  //    item => item.properties.id === currentRowId
  //  ));
  //  lateMapFocus = false; // late Map Focus is done once
  //}

  // Create Add hoverPopup
  if ( !hoverPopup ) hoverPopup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: popupOffset, // Ancrage au centre du cercle du marker
    className: 'maplibregl-popup'
  });

}
// 
//
// API GRIST : ready
///////////////////////////////////////////////////////////////////////////////////////////////////////////
grist.ready({   
  requiredAccess: 'read table',
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
console.log(widgetRootMsg+"loaded");
//
// API GRIST : onOptions
grist.onOptions((options,settings) => {
  if (debug) console.log(widgetRootMsg+"settings:"+JSON.stringify(settings, null, 2));
  if (debug) console.log(widgetRootMsg+"options:"+JSON.stringify(options, null, 2));
});
//
//
// API GRIST : onRecords
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
grist.onRecords(table => {
if (debug) console.log(widgetRootMsg+"onRecords : "+table.length);
  // reset geojsonFeatures
  geojsonFeatures.length=0;
  //
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
  });

  BoundingBox(geojsonFeatures);

  if ( !BBox || !BBox[0] || !BBox[1] || !BBox[2] || !BBox[3]) {
    console.warn(widgetRootMsg+": Bounds not fully defined ["+BBox[0]+", "+BBox[1]+", "+BBox[2]+", "+BBox[3]+"]");
    return;
  }

// DEBUG
if (debug) console.log(widgetRootMsg+"href: "+window.location.href);
if (debug) console.log(widgetRootMsg+"origin: "+window.location.origin);
if (debug) console.log(widgetRootMsg+"pathname: "+window.location.pathname);
// END DEBUG

  if (!map ) {

    //
    // Création la carte
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
    map.addControl(new CarteFacile.MapSelectorControl);
    // Création d'un contrôle personnalisé de recentrage sur les données de la table
    class FitBoundsControl {
      onAdd(map) {
        this._map = map;
        // Conteneur du groupe de boutons
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        // Bouton style natif
        const button = document.createElement('button');
        button.className = 'maplibregl-ctrl-icon fit-bounds-btn';
        button.type = 'button';
        button.title = 'Recentrer sur les données';
        button.onclick = () => {
          map.fitBounds(
            BBox, 
            { 
              padding: getDynamicPadding(),
              duration: 1000 
            }
          );
        };
        this._container.appendChild(button);
        return this._container;
      }
      onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
      }
    }
    map.addControl(new FitBoundsControl(), 'top-right');

    class ParametersControl {
      //private _container: HTMLElement;
      onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        // Bouton style natif
        const button = document.createElement('button');
        button.className = 'maplibregl-ctrl-icon parameters-btn';
        button.type = 'button';
        button.title = 'Paramètres';
        button.textContent = '⚙️'; // 
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
    map.addControl(new ParametersControl(), 'top-right');
    document.getElementById('cancelSettings').addEventListener('click', () => {
      modal.style.display = 'none';
    });
    document.getElementById('saveSettings').addEventListener('click', () => {
      modal.style.display = 'none';
      if ( document.getElementById('clusterRadius').value < 0 ) return;
      if ( clusterRadius !== Number(document.getElementById('clusterRadius').value) ) {
        clusterRadius = Number(document.getElementById('clusterRadius').value) ;
        if (map.getSource('markers')) {
          // Remove layers first (in reverse order of how they were added)
          if (map.getLayer('unclustered-point')) map.removeLayer('unclustered-point');
          if (map.getLayer('cluster-count')) map.removeLayer('cluster-count');
          if (map.getLayer('clusters')) map.removeLayer('clusters');
          map.removeSource('markers');
        }
        CreateMap ();
      }
      
    });
        // Close modal when clicking outside content
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
    //
    //
    // Chargement de la carte
    map.on('load', () => {

      // Fit the map to the bounding box with padding
      map.fitBounds(BBox, {
        padding: getDynamicPadding(),   // pixels
        maxZoom: highestZoomLevel,   // prevent zooming in too far
        duration: 1000 // animation duration in ms
      });

      CreateMap ();

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

        // Query features with currentRowId
        const features = map.queryRenderedFeatures(undefined, {
          layers: ['unclustered-point'],
          filter: ['==', ['get', 'id'], currentRowId]
        });
if (debug) console.log(widgetRootMsg+"on render f: "+features.length);
        // Sync visibility of Popup and the unclustered point of the feature   
        if ( features && features[0] ) {
          // if activePopup is null, the unclustered point is visible again 
          // => the pop up needs to be created
          if ( !activePopup ) activePopup = NewActiveFeaturePopup(features[0]);
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
   
    }); // end map.on
  } // if (!map)
  else {
      // Need to recompute BBox in case of further click on FitBoundsControl
      BoundingBox(geojsonFeatures);
      // ... but no FitBounds update since the user would not understand a focus change
      // due to changes in the source data
      // Need to update the data
      const src = map.getSource('markers');
      if (src) src.setData({
        type: 'FeatureCollection',
        features: [...geojsonFeatures] // Again, need to clone the data
      });
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

if (debug) console.log(widgetRootMsg+"onRecord : "+record.id);

  // Detect onRecord call related to internal setCursorPos
  if (internalCursorPos) {
    internalCursorPos = false;
    // check matching id in case external change arises before internal Curpos
    if ( record.id == currentRowId ) return;
  }
  // Ensure map is ready
  // Just change the currentRowId if not ready
  // This a a way to get the current row from a source widget before 
  // the map loading and the intialization of the Geojson features
  if ( !mapReady ) {
if(debug) console.log(widgetRootMsg+"onRecord map is not ready - record.id: "+record.id)
    //ChangeCurrentRow(record.id);
    // map is not ready yet: no need to ChangeMapFocus
    //lateMapFocus = true;
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

  // Having a valid record, let update the geojsonFeatures
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

    // ...Update BBox when geometry has change (or a feature has been skipped)
    // in case of further click on FitBoundsControl
    if ( geometryChange || skippedRecord) {
      BoundingBox(geojsonFeatures);
      // ... but no FitBounds update since the user would not understand 
      // a focus change due to changes in the source data
    }


  }

  // Zoom in to the record feature when onRecord is not related to an internal change of Row
//  if ( recordFeature && 
//       (currentRowId !== record.id || geometryChange || newRecord || propertyChange) ) {
    
    // Fit the map to the record
//    map.easeTo({
//      center: recordFeature.geometry.coordinates,
//      zoom: focusZoom
//    });
//
//  }
  
    ChangeCurrentRow(record.id);
     // ... Change map focus (selection with zoom in)  
    ChangeMapFocus(recordFeature); // null if skippedrecord

 

});
