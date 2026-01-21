# Spécifications Backend - Gestion des États des Participants

## 📋 Vue d'ensemble

Ce document décrit les champs et comportements que le backend DOIT implémenter pour que la logique de gestion des états des participants fonctionne correctement.

## 🗄️ Structure de la Base de Données

La table `ParticipantConversation` DOIT contenir les colonnes suivantes :

### Champs Booléens (toujours présents, `false` par défaut)
- `hasLeft` : `BOOLEAN DEFAULT FALSE` - Le participant a quitté une 1ère fois
- `hasDefinitivelyLeft` : `BOOLEAN DEFAULT FALSE` - Le participant a quitté définitivement (2ème départ)
- `hasCleaned` : `BOOLEAN DEFAULT FALSE` - La conversation a été supprimée localement par l'utilisateur
- `isAdmin` : `BOOLEAN DEFAULT FALSE` - Le participant est administrateur
- `isDeleted` : `BOOLEAN DEFAULT FALSE` - Le participant a quitté (marqué supprimé)

### Champs de Dates (optionnels, `NULL` par défaut)
- `recreatedAt` : `DATETIME NULL` - Date de réintégration
- `recreatedBy` : `INTEGER NULL` - ID de l'utilisateur qui a réintégré
- `leftAt` : `DATETIME NULL` - Date du 1er départ
- `leftBy` : `INTEGER NULL` - ID de l'utilisateur qui a quitté (1er départ)
- `definitivelyLeftAt` : `DATETIME NULL` - Date du 2ème départ définitif
- `definitivelyLeftBy` : `INTEGER NULL` - ID de l'utilisateur qui a quitté définitivement

## 🔌 API `/participantConversation/getByCriteria`

### Description
Retourne tous les participants d'une conversation avec leurs états complets.

### Requête
```json
{
  "user": 1,
  "isSimpleLoading": false,
  "data": {
    "conversationId": 2
  }
}
```

### Réponse Attendue
```json
{
  "hasError": false,
  "status": { "code": "200", "message": "OK" },
  "count": 3,
  "items": [
    {
      "id": 4,
      "conversationId": 2,
      "userId": 1,
      "isAdmin": true,
      "isDeleted": false,
      "hasLeft": false,
      "hasDefinitivelyLeft": false,
      "hasCleaned": false,
      "recreatedAt": null,
      "recreatedBy": null,
      "leftAt": null,
      "leftBy": null,
      "definitivelyLeftAt": null,
      "definitivelyLeftBy": null,
      "userNom": "sekongo",
      "userPrenoms": "moussa"
    }
  ]
}
```

### ⚠️ IMPORTANT
- **TOUS** les champs d'état doivent être présents dans la réponse, même s'ils sont `null` ou `false`
- Ne pas omettre les champs - le frontend s'attend à les trouver

## 🔌 API `/participantConversation/delete`

### Description
Supprime (fait quitter) un participant d'une conversation. Met à jour les champs d'état selon le contexte.

### Requête
```json
{
  "user": 1,
  "datas": [
    {
      "conversationId": 2,
      "userId": 1
    }
  ]
}
```

### Logique à Implémenter

#### Cas 1 : Premier départ (participant actif)
```java
if (!participant.hasLeft) {
    // 1er départ
    participant.hasLeft = true;
    participant.leftAt = new Date();
    participant.leftBy = requestingUserId;
    participant.isDeleted = true;
}
```

#### Cas 2 : Deuxième départ (participant réintégré)
```java
if (participant.hasLeft && participant.recreatedAt != null && !participant.hasDefinitivelyLeft) {
    // 2ème départ (définitif)
    participant.hasDefinitivelyLeft = true;
    participant.definitivelyLeftAt = new Date();
    participant.definitivelyLeftBy = requestingUserId;
    // hasLeft reste true, leftAt et leftBy conservent les valeurs du 1er départ
}
```

#### Cas 3 : Participant déjà définitivement parti
```java
if (participant.hasDefinitivelyLeft) {
    // Erreur : ne peut pas quitter à nouveau
    throw new Error("Participant a déjà quitté définitivement");
}
```

### Réponse Attendue (1er départ)
```json
{
  "hasError": false,
  "status": { "code": "200", "message": "OK" },
  "count": 1,
  "items": [
    {
      "id": 4,
      "conversationId": 2,
      "userId": 1,
      "hasLeft": true,
      "hasDefinitivelyLeft": false,
      "leftAt": "20/01/2026 14:30:00",
      "leftBy": 1,
      "recreatedAt": null,
      "recreatedBy": null,
      "definitivelyLeftAt": null,
      "definitivelyLeftBy": null,
      "isDeleted": true
    }
  ]
}
```

### Réponse Attendue (2ème départ - définitif)
```json
{
  "hasError": false,
  "status": { "code": "200", "message": "OK" },
  "count": 1,
  "items": [
    {
      "id": 4,
      "conversationId": 2,
      "userId": 1,
      "hasLeft": true,
      "hasDefinitivelyLeft": true,
      "leftAt": "20/01/2026 14:30:00",
      "leftBy": 1,
      "definitivelyLeftAt": "20/01/2026 16:00:00",
      "definitivelyLeftBy": 1,
      "recreatedAt": "20/01/2026 15:00:00",
      "recreatedBy": 2,
      "isDeleted": true
    }
  ]
}
```

## 🔌 API `/participantConversation/create`

### Description
Ajoute un participant à une conversation. Si le participant a déjà quitté, le réintègre.

### Requête
```json
{
  "user": 2,
  "datas": [
    {
      "conversationId": 2,
      "userId": 1,
      "isAdmin": false
    }
  ]
}
```

### Logique à Implémenter

#### Cas 1 : Nouveau participant (jamais dans le groupe)
```java
if (!participantExists) {
    // Créer un nouveau participant
    ParticipantConversation newParticipant = new ParticipantConversation();
    newParticipant.conversationId = conversationId;
    newParticipant.userId = userId;
    newParticipant.isAdmin = isAdmin;
    newParticipant.hasLeft = false;
    newParticipant.hasDefinitivelyLeft = false;
    newParticipant.hasCleaned = false;
    // Tous les autres champs null
}
```

#### Cas 2 : Participant a quitté une fois (réintégration)
```java
if (participantExists && participant.hasLeft && !participant.hasDefinitivelyLeft) {
    // Réintégration
    participant.hasLeft = false; // REMIS À FALSE
    participant.recreatedAt = new Date();
    participant.recreatedBy = requestingUserId;
    participant.isDeleted = false;
    // leftAt et leftBy sont CONSERVÉS (ne pas les réinitialiser)
    // Ne pas créer un nouveau participant, réutiliser l'existant
}
```

#### Cas 3 : Participant définitivement parti
```java
if (participantExists && participant.hasDefinitivelyLeft) {
    // Erreur : ne peut pas être réintégré
    throw new Error("Participant a quitté définitivement et ne peut pas être réintégré");
}
```

### Réponse Attendue (Nouveau participant)
```json
{
  "hasError": false,
  "status": { "code": "200", "message": "OK" },
  "count": 1,
  "items": [
    {
      "id": 5,
      "conversationId": 2,
      "userId": 1,
      "isAdmin": false,
      "hasLeft": false,
      "hasDefinitivelyLeft": false,
      "hasCleaned": false,
      "recreatedAt": null,
      "recreatedBy": null,
      "leftAt": null,
      "leftBy": null,
      "definitivelyLeftAt": null,
      "definitivelyLeftBy": null,
      "isDeleted": false
    }
  ]
}
```

### Réponse Attendue (Réintégration)
```json
{
  "hasError": false,
  "status": { "code": "200", "message": "OK" },
  "count": 1,
  "items": [
    {
      "id": 4,
      "conversationId": 2,
      "userId": 1,
      "hasLeft": false,
      "hasDefinitivelyLeft": false,
      "recreatedAt": "20/01/2026 15:00:00",
      "recreatedBy": 2,
      "leftAt": "20/01/2026 14:30:00",
      "leftBy": 1,
      "definitivelyLeftAt": null,
      "definitivelyLeftBy": null,
      "isDeleted": false
    }
  ]
}
```

## 🔌 API `/conversation/delete` (Nettoyage local)

### Description
Lorsqu'un utilisateur "supprime" une conversation, il faut mettre `hasCleaned = true` pour le participant.

### Logique
```java
ParticipantConversation participant = findParticipant(conversationId, userId);
if (participant != null) {
    participant.hasCleaned = true;
    // Les autres champs restent inchangés
}
```

## 📊 Schéma de Flux des États

```
[ACTIF]
hasLeft = false
hasDefinitivelyLeft = false
recreatedAt = null

    ↓ DELETE (1er départ)

[QUITTÉ 1ère FOIS]
hasLeft = true
hasDefinitivelyLeft = false
leftAt = "date"
leftBy = userId
recreatedAt = null

    ↓ CREATE (réintégration par admin)

[RÉINTÉGRÉ]
hasLeft = false ← REMIS À FALSE
hasDefinitivelyLeft = false
recreatedAt = "date"
recreatedBy = adminId
leftAt = "date" ← CONSERVÉ
leftBy = userId ← CONSERVÉ

    ↓ DELETE (2ème départ)

[DÉFINITIVEMENT PARTI]
hasLeft = true
hasDefinitivelyLeft = true ← PASSÉ À TRUE
definitivelyLeftAt = "date"
definitivelyLeftBy = userId
recreatedAt = "date" ← CONSERVÉ
recreatedBy = adminId ← CONSERVÉ
leftAt = "date" ← CONSERVÉ
leftBy = userId ← CONSERVÉ
```

## ✅ Checklist de Validation

- [ ] Base de données : Toutes les colonnes existent
- [ ] GET API : Retourne TOUS les champs d'état (même null/false)
- [ ] DELETE API : Met à jour hasLeft, leftAt, leftBy (1er départ)
- [ ] DELETE API : Met à jour hasDefinitivelyLeft, definitivelyLeftAt, definitivelyLeftBy (2ème départ)
- [ ] CREATE API : Crée un nouveau participant avec hasLeft=false
- [ ] CREATE API : Réintègre un participant existant (hasLeft=false, recreatedAt/recreatedBy remplis)
- [ ] CREATE API : Conserve leftAt et leftBy lors de la réintégration
- [ ] CREATE API : Rejette la réintégration si hasDefinitivelyLeft=true

## 🔍 Tests à Effectuer

1. **Test 1er départ** : Quitter un groupe → Vérifier hasLeft=true, leftAt et leftBy remplis
2. **Test réintégration** : Ajouter un participant qui a quitté → Vérifier hasLeft=false, recreatedAt et recreatedBy remplis
3. **Test 2ème départ** : Quitter après réintégration → Vérifier hasDefinitivelyLeft=true, definitivelyLeftAt et definitivelyLeftBy remplis
4. **Test filtrage** : Vérifier que les participants définitivement partis ne s'affichent plus
5. **Test nettoyage** : Supprimer conversation → Vérifier hasCleaned=true
