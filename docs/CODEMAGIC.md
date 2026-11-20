# InvestLens : IPA iOS avec Codemagic

Ce workflow construit une IPA signée pour **App Store Connect / TestFlight**.
Il ne soumet pas l'application à Apple et ne la publie pas automatiquement.
Il conserve la fiche Apple existante et son identifiant : `app.replit.investlensmobile`.

## Prérequis du compte Codemagic

1. Ajouter le dépôt GitHub InvestLens comme application, puis sélectionner
   **codemagic.yaml**, branche `main`, workflow **InvestLens - signed iOS IPA**.
2. Dans les réglages sécurisés de l'équipe Codemagic, configurer la connexion
   **Developer Portal** avec une clé App Store Connect autorisée pour cette app.
   Ne jamais déposer de fichier `.p8`, `.p12`, de clé privée ou de mot de passe
   dans GitHub.
3. Dans **Code signing identities**, ajouter un certificat **Apple Distribution**
    avec sa clé privée et un profil **App Store** pour `app.replit.investlensmobile`.
   Un certificat généré ailleurs ne peut pas être récupéré avec sa clé privée
   depuis Apple. Il faut l'importer avec sa clé ou en générer un nouveau dans
   Codemagic, sans révoquer les certificats existants.
4. Créer un groupe de variables **investlens_mobile** :

   | Nom | Contenu |
   | --- | --- |
   | `EXPO_PUBLIC_DOMAIN` | Nom d'hôte du serveur de production, sans `https://` ni chemin |
   | `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` | Clé **publique du SDK iOS** RevenueCat pour InvestLens |
   | `IOS_BUILD_NUMBER` | Facultatif : numéro entier supérieur aux builds Apple existants |

   Les deux variables `EXPO_PUBLIC_*` sont intégrées à l'application. Ne jamais
   leur donner une clé serveur, une clé Apple privée ou un secret.
   Aucune variable de développement Replit n'est transférée automatiquement.

## Lancement et récupération

Après vérification des réglages ci-dessus, lancer manuellement le workflow.
Un build macOS consomme le quota/minutes du compte Codemagic.
Une fois le build réussi, télécharger le fichier `.ipa` depuis **Artifacts**.
Les logs Xcode sont conservés pour diagnostiquer un échec.

La numérotation automatique commence à `100 + BUILD_NUMBER`. Si un build de
numéro supérieur existe déjà dans App Store Connect, définir `IOS_BUILD_NUMBER`
avant le lancement et l'augmenter pour chaque nouveau build.

## Structure du dépôt

L'application Expo est dans `artifacts/investlens-mobile` et utilise le client
partagé `lib/api-client-react`. Conserver la structure du monorepo et son fichier
`pnpm-lock.yaml`. Le workflow utilise pnpm 10.26.1 et génère le projet Xcode sur
le Mac Codemagic ; aucun Mac ou iPhone local n'est nécessaire pour produire l'IPA.

Une IPA App Store n'est pas installable directement sur un iPhone : les tests
sur appareil passent par TestFlight après son transfert dans App Store Connect.
