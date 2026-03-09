Un [template GRIST Carte Facile](https://grist.numerique.gouv.fr/o/sandbox-carte-facile/uD2ywACTtUMB/Template) est mis à votre disposition pour facilement mettre en oeuvre un document GRIST disposant de fonctionnalités cartographiques. Il propose un exemple minimal de table de données localisées et une page pour chacun des 4 cas d'usages du Widget Carte Facile décrit ci-dessous : [Cartographie](#cartographie), Localisation, Exploration et Localisation/Exploration combinées.

### Cartographie

Toutes les lignes sont représentées par un marqueur de localisation bleu (<img src="assets/img/widget-marker.png" height="12" style="filter: brightness(0) saturate(100%) invert(27%) sepia(99%) saturate(747%) hue-rotate(179deg) brightness(95%) contrast(97%)" alt="marker-default"/>) sauf l'unique ligne sélectionnée (première ligne valide du tableau par défaut) qui est représentée par un marqueur vert (<img src="assets/img/widget-marker.png" height="12" style="filter: brightness(0) saturate(100%) invert(38%) sepia(21%) saturate(1180%) hue-rotate(53deg) brightness(92%) contrast(88%)" alt="marker-default"/>). Le libellé s'affiche dans un popup lorsque la souris passe sur le marqueur. Il est alors possible de changer la sélection en cliquant sur le marqueur ; son popup devient fixe mais peut-être supprimé.

L'outil Map libre fournit les fonctions de navigation de base tels que :
* le déplacement (en bougeant la souris après un clic maintenu sur la carte),
* le bouton <img height="12" src="assets/img/widget-control-zoom.png" alt="zoom"/> pour le zoom avant,
* le bouton <img height="12" src="assets/img/widget-control-dezoom.png" alt="dezoom"/> pour le zoom arrière,
* le bouton <img height="12" src="assets/img/widget-control-orientation.png" alt="orientation"/> pour l'orientation,
* le bouton <img height="12" src="assets/img/widget-control-selection.png" alt="selection"/> pour sélectionner les données du fond Carte Facile.
* l'indicateur d'échelle <img height="16" src="assets/img/widget-control-echelle.png" alt="échelle"/>.

Le widget Carte facile propose en complément :
* le bouton <img height="12" src="assets/img/widget-control-all-rows.svg" alt="vue d'ensemble"/> pour une vue d'ensemble des marqueurs de toutes les lignes de la table,
* le bouton <img height="12" src="assets/img/widget-control-one-row.svg" alt="focus"/> pour se déplacer sur le marqueur de la ligne sélectionnée,
* le bouton <img height="12" src="assets/img/widget-control-parameters.svg" alt="paramètres"/> pour modifier les paramètres du widget.

Il est alors possible d'utiliser les contrôles suivant :
* le contrôle de **Navigation** et le contrôle de **Gestion de l'échelle** de Map Libre;
* le **sélecteur de carte** du service CarteFacile permettant de basculer sur le fond OSM ou d'afficher des données complémentaires ;
* un contrôle spécifique de **recentrage** de la carte sur les objets de la table GRIST source.

Les fonctionnalités de zoom et de déplacement fournies par Mal Libre permettent de naviguer dans la carte et de sélectionner les lignes valides de la table. Un popup contenant le libellé de la ligné est affiché lors du passage sur la représentation d'un ligne ou lorsque la ligne est sélectionnée.

Les points correspondants aux lignes de la table GRIST sont clusterisées, c'est à dire que des cercles de taille variable contenant un nombre, permettent de représenter de manière agrégée les points dans les zones denses. Le nombre indique la quantité d'objets agrégréss.En cliquant sur un de ces cercles, Map Libre va zoomer de manière à désagrager les points concernés. 

### Connection d'un widget tiers

Toute vue de la page dans laquelle se trouve le widget Carte Facile peut lui être connecté. Dans ce cas, chaque ligne sélectionnée au travers du widget Carte facile sera visualisée dans la vue connectée. Une vue de type Fiche permettra typiquement de visualiser les valeurs des différentes colonnes de la ligne sélectionnée dans le widget Carte Facile.

### Connection du widget Carte Facile

Le widget Carte Facile réagit de deux manières à la vue à laquelle il est connecté :
- les filtres appliquées dans la vue à laquelle le widget Carte Facile est connecté seront répercutées sur la cartographie :
- si une ligne est sélectionnées dans la vue à laquelle le widget Carte Facile est connecté, le widget Carte Facile se déplacera et zoomera sur le point correspondant sur la carte.

Ces fonctionnalités fonctionnent très bien avec la vue de type Table ou avec le widget Explorateur.
