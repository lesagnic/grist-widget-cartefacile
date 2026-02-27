Il faut d'abord souhaiter documenter un référentiel Github ou faire évoluer 
la documentation d'un reférentiel Github existant avec une page telle que celle-ci.

Techniquement, il est recommandé que les fichiers du produit objet du référentiel à documenter 
soient placés dans un répertoire ad hoc différents de assets pour s'assurer qu'il n'y a pas de 
conflits avec les fichiers nécessaires à la documentations. Notamment, le référentiel à documenter ne 
peut pas avoir de fichier index.html à sa racine. Les fichiers suivants sont servent à la documentation :
* [assets/img/logo.png][logo-url] est à remplacer par le logo du produit faisant
l'objet de référentiel Github à documenter ;
* [assets/img/screenshot.png][screenshot-url] est à remplacer par un aperçu du produit 
faisant l'objet dur référentiel à documenter ;
* [assets/css/style.scss][style.css-url] contrôle les styles de la documentation. 
Il peut être modifié pour ajuster les styles de la page de documentation. Par contre, si le produit
contient du contenu HTML nécessitant des instructions CSS, il est recommandé de stocker ses instructions
dans un autre fichier CSS qui pourra ainsi être plus facilement déployé.

[logo-url]: assets/img/logo.png
[screenshot-url]: assets/img/screenshot.png
[style.css-url]: assets/css/style.scss
