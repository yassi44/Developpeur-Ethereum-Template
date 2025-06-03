# Tests Unitaires - Contrat Voting

Description
Les tests ont été effectués avec Hardhat.

Tests Implémentés
Les tests couvrent l'ensemble des fonctionnalités du contrat (normalement :D):
Déploiement : Vérification de l'initialisation correcte du contrat
Enregistrement des votants : Tests des permissions et validations
Gestion du workflow : Transitions d'états et événements émis
Propositions : Ajout et validation des propositions
Vote : Processus de vote et restrictions
Décompte : Calcul du gagnant et gestion des égalités
Getters : Accès aux données avec restrictions


Structures des Tests
Utilisation de fixtures pour éviter la duplication de code
Tests des cas de succès et des cas d'échec
Vérification des events émis
Validation des reverts avec messages d'erreur

Pour lancer les tests : 
```shell
npx hardhat test
```
