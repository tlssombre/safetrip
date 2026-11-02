<?php
// Copier ce fichier en "config.php" (dans le même dossier, sur le serveur) puis remplir les valeurs.
// Ne jamais publier config.php ni le mettre dans un dépôt.
return [
    // cPanel > "Bases de données MySQL" : nom complet = prefixe_nom
    'db_host' => 'localhost',
    'db_name' => 'cpaneluser_safetrip',
    'db_user' => 'cpaneluser_safetrip',
    'db_pass' => 'MOT_DE_PASSE_DE_LA_BASE',

    // Hash du mot de passe admin. Générer avec :
    //   php -r "echo password_hash('VOTRE_MOT_DE_PASSE', PASSWORD_DEFAULT);"
    'admin_password_hash' => '',
];
