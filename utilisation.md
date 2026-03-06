Un [template GRIST Carte Facile](https://grist.numerique.gouv.fr/o/sandbox-carte-facile/uD2ywACTtUMB/Template) est mis à votre disposition pour facilement mettre en oeuvre un document GRIST disposant de fonctionnalités cartoraphiques. Il propose également au travers de 4 pages les 4 d'usages du Widget Carte Facile décrit ci-dessous : Cartographie, Localisation, Exploration et Localisation/Exploration combinées.

### Cartographie

Les lignes sont représentées par un marqueur de localisation bleu sauf pour l'unique ligne sélectionnée (première ligne valide du tableau par défaut) représentée en vert. Un popup s'affiche lorsque la souris passe sur le marqueur. Il est alors possible de changer la sélection en cliquant sur le marqueur. Le Popup devient fixe.

L'outil Map libre fournit les fonctions de navigation de base (déplacement en bougeant la souris après un clic maintenu sur la carte) ainsi que zoom/dézoom/orientation en cliquant respectivement sur les boutons ![Zoom](data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="%23000" viewBox="0 0 24 24"><path d="M6 3.72V6H1.44v2.808l3.648.168c1.992.096 3.72.072 3.84-.048s.144-1.848.048-3.84L8.808 1.44H6zm9.024 1.368c-.096 1.992-.072 3.72.048 3.84s1.848.144 3.84.048l3.648-.168V6H18V1.44h-2.808zm-11.232 9.96-2.352.096V18H6v4.56h2.808l.168-3.624c.072-1.968.096-3.696.024-3.84-.096-.12-.768-.192-1.512-.168s-2.424.096-3.696.12m11.232.024c-.072.144-.072 1.896 0 3.864l.168 3.624H18V18h4.56v-2.88h-1.512c-.84 0-2.496-.072-3.696-.144-1.464-.12-2.208-.072-2.328.096"/></svg>).

L'icône du dessous (3 feuilles supperposées) permet de sélectionner les données du fond Carte Facile.

Les 3 derniers icônes permettent de revenir à une vue d'ensemble des lignes de la table, se déplacer sur la représentation de la ligne sélectionnée et enfin de modifier les paramètres du widet Carte Facile.

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
