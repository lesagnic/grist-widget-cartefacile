//
// Increment last figure when testing a new change
const widgetVersion = "1.0.2"
const widgetRootMsg = `Grist Widget Carte Facile v${widgetVersion} `;
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
// La ligne est considérée valide lorsque les 3 colonnes mappées contiennent bien une valeur.
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
const iconUrl = "https://lesagnic.github.io/grist-widget-cartefacile/widget/marker.png";
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
let clusterRadius = 30;
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
    grist.setSelectedRows([currentRowId]);
  }
}
// Change the color of the marker corresponding to the current row,
// delete the previous Popup and create a new on using the data of feature f
function ChangeMapFocus(f) {

  // Update paint property of the layer dynamically to highlighth the marker of the currentRow
  map.setPaintProperty('unclustered-point', 'icon-color', [
      'case',
      ['==', ['coalesce', ['get', 'id'], ''], ['literal', currentRowId || '']],
      selectedColor,
      defaultColor
    ]);
    
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
console.log(`Grist Widget Carte Facile v${widgetVersion} loaded`);
//
// API GRIST : onOptions
grist.onOptions((options, settings) => {
 if (debug) console.log(widgetRootMsg+"settings:"+JSON.stringify(settings, null, 2));
 if (debug) console.log(widgetRootMsg+"options:"+JSON.stringify(options, null, 2));
});
//
//
// API GRIST : onRecords
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
grist.onRecords(function(table, viewMeta) {
  // Need to Reset geojsonFeatures
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
    else console.warn("WIDGET Cartes.gouv : Skipped record [id="+record.id+", Titre="+mapped.Titre+", Lat="+mapped.Latitude+", Lon="+mapped.Longitude+"]");
  });

  BoundingBox(geojsonFeatures);

  if ( !BBox || !BBox[0] || !BBox[1] || !BBox[2] || !BBox[3]) {
    console.warn("WIDGET Cartes.gouv : Bounds not fully defined ["+BBox[0]+", "+BBox[1]+", "+BBox[2]+", "+BBox[3]+"]");
    return;
  }

// DEBUG
if (debug) console.log(window.location.href);
if (debug) console.log(window.location.origin);
if (debug) console.log(window.location.pathname);
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

    // Select first line of the Grist table when creating the map
    // if it has not been set first by a call of onRecord...
    if ( currentRowId==null ) {
      // It is safe to reset first the selection
      grist.setSelectedRows([]);
      ChangeCurrentRow(geojsonFeatures[0].properties.id);
      // map is not ready yet: no need to ChangeMapFocus
    }
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

      // Add a source based on the GRIST Table data
      if (!map.getSource('markers')) map.addSource('markers', {
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

      //Add a layer for unclustered points...;
      //const iconUrl = "https://corsproxy.io/?https://lesagnic.github.io/grist-widget-cartefacile/widget/marker.png";
      fetch(iconUrl)
        .then(res => res.blob())
        .then(blob => createImageBitmap(blob))
        .then(imageBitmap => {
          map.addImage('custom-marker', imageBitmap, { sdf: true });
        });
      //const img = new Image();
      //img.onload = () => {
      //  map.addImage('custom-marker', img, { sdf: true });
      //};
      //img.src = 'data:image/png;base64,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ZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNC40LjAtRXhpdjIiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIgogICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgeG1sbnM6R0lNUD0iaHR0cDovL3d3dy5naW1wLm9yZy94bXAvIgogICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iCiAgIHhtcE1NOkRvY3VtZW50SUQ9ImdpbXA6ZG9jaWQ6Z2ltcDo1NmM3N2FiZS01NGIzLTQxYzgtOTdiNy01ODU5NTUzMDRmMTUiCiAgIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MmQ1M2VkNWUtMzg4Yy00MzM1LTg5OWYtMTg0OGZlMmUxOGIzIgogICB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6NWU0ZmRkN2QtNGY4Zi00MjExLWIxZTItNjg1OTZjNzYyM2FjIgogICBkYzpGb3JtYXQ9ImltYWdlL3BuZyIKICAgR0lNUDpBUEk9IjIuMCIKICAgR0lNUDpQbGF0Zm9ybT0iV2luZG93cyIKICAgR0lNUDpUaW1lU3RhbXA9IjE3NzEyNTg5NTYwMDYyODIiCiAgIEdJTVA6VmVyc2lvbj0iMi4xMC4zMiIKICAgdGlmZjpPcmllbnRhdGlvbj0iMSIKICAgeG1wOkNyZWF0b3JUb29sPSJHSU1QIDIuMTAiCiAgIHhtcDpNZXRhZGF0YURhdGU9IjIwMjY6MDI6MTZUMTc6MjI6MjYrMDE6MDAiCiAgIHhtcDpNb2RpZnlEYXRlPSIyMDI2OjAyOjE2VDE3OjIyOjI2KzAxOjAwIj4KICAgPHhtcE1NOkhpc3Rvcnk+CiAgICA8cmRmOlNlcT4KICAgICA8cmRmOmxpCiAgICAgIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiCiAgICAgIHN0RXZ0OmNoYW5nZWQ9Ii8iCiAgICAgIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6YzcwMDJiNjYtYjY4Ny00MTU5LWJiYjgtYTNjOWMwM2RlYzA1IgogICAgICBzdEV2dDpzb2Z0d2FyZUFnZW50PSJHaW1wIDIuMTAgKFdpbmRvd3MpIgogICAgICBzdEV2dDp3aGVuPSIyMDI2LTAyLTE2VDE3OjIyOjM2Ii8+CiAgICA8L3JkZjpTZXE+CiAgIDwveG1wTU06SGlzdG9yeT4KICA8L3JkZjpEZXNjcmlwdGlvbj4KIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAKPD94cGFja2V0IGVuZD0idyI/PgiKmg4AAAAGYktHRAAAAAAAAPlDu38AAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfqAhAQFiPzC/FuAAACyklEQVRYw72YP2gTURzHP+/ZW0RQaIcs1ggBR9PVCIaAdNMDt04Vgosg56SLEHRysghd5MBO0kVIugXhmoLp2jgKEWtcOlhIQFxS7zn4rk3/3Lt36SW/LeR77/v9/Xnv/X5PYGmV6rAIuEAZuBMD2wJaQD3wnY7NusKC2AVqwE3S2RegFvhOfSwBleowD6wZvLW1LWA58J1dawGV6rAM1IHLZGMDwA18p3XyD3kG+TKwmSE5eq1NvXZ8BHSh7TBZWxgtUDFCfgXoANcmLOAHUAx8p38yBbUpkKM5ascioCv+e9wXpQVB8Yag2VZ0fyrj6oWrgsWSoPNV0d4xYq8HvrM7o394JuS3Hrx6fEEA7P1Sqt0J+fhJsbf/nyA3K3hwV1AqSnJzQrwDlp4dqIRIeIAXCXBNyL19RbcXqsK8FLk5cVg33V6oAArzUnx4fYTv9kL16OXfpFS4gDejw5+Y++b2aYcK81LYYs+qhUp1mJdA3gadkM9xsXmpL5dEi9KQhOv2QhXVhoWVZZr90+6oTDDGo9hkuVmRCWZsAYslKbLAnBTQsgGWFuzXTYFtSaBv5f0t+2ClwPajo9hYOZcuwsZb59Ct6DRstpUO+9EpGGHuPRmq33/M7IHviOgkbAD3Y0NalGwAzXaoPndClp4fHN9664rV9ZAXqwfqdlGyWJKiVJQ0t0MTf2P0MvKAN6bKTrG3bb95GvjOSpSsetIhlNYsvqkfbkPdMDaYnjWiJnW0XFemKGAlridsZdCGJ7bpge+U407C2hS8rxnngglH4Zj3cXfBsh4ksraBXtt8GenqnEQqameNZ6bZMMtUnAq9zXXsZpSKganplYaLoq/btcE5ycvRFJS6IdEznHcOAV7SQ4VV56Cn2vcpyR8GvrN27heSMUVYkacSkEKENXlqARYiUpGPJSDmCSf2CWYiAkZeUyJv3bhHqCT7B5E3FISW3IfmAAAAAElFTkSuQmCC';       
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
//         'icon-color': defaultColor
          'icon-color': [
            'case',
            ['==', ['coalesce', ['get', 'id'], ''], ['literal', currentRowId || '']],
            selectedColor, // Selected point color
            defaultColor  // Default color
          ]
        }
      });

      // Need to create an active Popup for the currentRowId if it does not exist yet
      if ( currentRowId && !activePopup ) activePopup = NewActiveFeaturePopup(geojsonFeatures[0]);
      if ( !hoverPopup ) hoverPopup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: popupOffset, // Ancrage au centre du cercle du marker
        className: 'maplibregl-popup'
      });

      // Map is now ready fo style changes through onRecord
      mapReady = true;

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

      // When a click event occurs on a feature in the unclustered-point layer ...
      map.on('click', 'unclustered-point', (e) => {       
        if ( !e || e.features[0].properties.id == currentRowId ) return;
        // Change current row
        ChangeCurrentRow(e.features[0].properties.id);
        ChangeMapFocus(e.features[0]);
      });

      // Check popup visibility on every render
      map.on('render', () => {
        if (!currentRowId) return;

        // Query features with currentRowId
        const features = map.queryRenderedFeatures(undefined, {
          layers: ['unclustered-point'],
          filter: ['==', ['get', 'id'], currentRowId]
        });

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
        map.getCanvas().style.cursor = 'pointer';

        if ( e.features[0].properties.id != currentRowId ) {
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
  if ( !record ) return;

  // Ensure map is ready
  // Just change the currentRowId if not ready
  // This a a way to get the current row from a source widget before 
  // the map loading and the intialization of the Geojson features
  if ( !mapReady ) {
    ChangeCurrentRow(record.id);
    // map is not ready yet: no need to ChangeMapFocus
    return;
  }

  // Try to find a feature with a matching id property
  let recordFeature = geojsonFeatures.find(item => item.properties.id === record.id);

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
      recordFeature = null; // Intentionally, the Map focus will be set on this null recordFerature
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
      // ... but no FitBounds update since the user would not understand a focus change
      // due to changes in the source data
    }


  }

  // Zoom in to the record feature when onRecord is not related to an internal change of Row
  if ( recordFeature && 
       (currentRowId !== record.id || geometryChange || newRecord || propertyChange) ) {
    
    // Fit the map to the record
    map.easeTo({
      center: recordFeature.geometry.coordinates,
      zoom: focusZoom
    });

  }
  
  // ... Change current row if needed
  if (currentRowId !== record.id) {
     ChangeCurrentRow(record.id);
     // ... Change map focus
    ChangeMapFocus(recordFeature); // null if skippedrecord
  }

 

});



