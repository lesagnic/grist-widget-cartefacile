### Fonctionnalités cartographiques

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
