# Analyse des Boutons dans InfoGroupe.tsx

## 📋 Vue d'ensemble

Ce document liste tous les boutons dans `InfoGroupe.tsx` et explique ce qu'ils font concrètement.

---

## 🔘 Bouton Principal : "Informations du groupe" (icône info)

**Localisation** : En-tête de la conversation (visible dans ChatHeader)

**Fonction** : 
- Ouvre le panneau latéral droit avec les informations du groupe
- Affiche : titre, date de création, liste des participants, actions du groupe

**Action** : `handleShowGroupeInfo()` → Met `isOpen` à `true`

---

## 🔘 Bouton "Fermer" (dans le panneau)

**Localisation** : En-tête du panneau latéral (coin supérieur droit)

**Fonction** :
- Ferme le panneau d'informations du groupe
- Peut aussi être fermé en cliquant sur l'overlay (fond sombre)

**Action** : `handleClose()` → Met `isOpen` à `false`

---

## 🔘 Bouton "Actions du groupe" (menu déroulant)

**Localisation** : Dans le panneau d'informations, section "Actions du groupe"

**Fonction** :
- Ouvre/ferme un menu déroulant avec les actions disponibles
- Affiche différentes options selon si l'utilisateur est admin ou non

**Action** : `setShowDropdown(!showDropdown)` → Affiche/cache le menu

---

## 🔘 Option Menu : "Ajouter un participant" 

**Localisation** : Menu déroulant "Actions du groupe" (visible seulement si ADMIN)

**Fonction** :
- Ouvre la modale `AddParticipantsModal`
- Permet d'ajouter de nouveaux participants au groupe
- Permet aussi de réintégrer des participants qui ont quitté une fois

**Action** :
1. `setShowDropdown(false)` → Ferme le menu
2. `setShowAddModal(true)` → Ouvre la modale d'ajout

**Résultat** :
- Si nouveau participant → Crée un nouveau `ParticipantConversation` avec `hasLeft=false`
- Si participant qui avait quitté → Réintègre (met `recreatedAt`, `recreatedBy`, `hasLeft=true`, `isDeleted=false`)
- Recharge la liste des participants après succès

---

## 🔘 Option Menu : "Retirer un participant"

**Localisation** : Menu déroulant "Actions du groupe" (visible seulement si ADMIN)

**Fonction** :
- Ouvre la modale `RemoveParticipantModal`
- Permet de retirer (supprimer) des participants du groupe

**Action** :
1. `setShowDropdown(false)` → Ferme le menu
2. `setShowRemoveModal(true)` → Ouvre la modale de retrait

**Résultat** :
- Appelle `deleteParticipant()` API
- Si 1er départ : Met `hasLeft=true`, `leftAt`, `leftBy`, `isDeleted=true`
- Si 2ème départ (après réintégration) : Met `hasDefinitivelyLeft=true`, `definitivelyLeftAt`, `definitivelyLeftBy`, `hasCleaned=true`
- Retire le participant de la liste affichée
- Recharge la liste des participants après succès

---

## 🔘 Option Menu : "Quitter le groupe"

**Localisation** : Menu déroulant "Actions du groupe" (visible pour TOUS les membres)

**Fonction** :
- Permet à l'utilisateur connecté de quitter le groupe lui-même
- Différent de "Retirer un participant" (qui est fait par un admin)

**Action** : `handleLeaveGroup()` → Appelle directement `deleteParticipant()`

**Logique** :
1. Vérifie si l'utilisateur peut quitter (`canLeaveGroup()`)
2. Si réintégré → Affiche avertissement "2ème départ = définitif"
3. Confirmation avec `window.confirm()`
4. Appelle `deleteParticipant()` avec `userId = currentUserId`

**Résultat** :
- Si 1er départ : `hasLeft=true`, `leftAt`, `leftBy`, `isDeleted=true`
- Si 2ème départ : `hasDefinitivelyLeft=true`, `definitivelyLeftAt`, `definitivelyLeftBy`, `hasCleaned=true`
- Recharge la page après succès (`window.location.reload()`)

---

## 🔘 Bouton "⋮" (trois points) sur chaque participant

**Localisation** : À droite de chaque participant dans la liste (visible seulement si ADMIN)

**Fonction** :
- Ouvre un menu contextuel pour gérer le statut admin de ce participant
- Visible seulement si :
  - L'utilisateur connecté est admin (`currentUserIsAdmin = true`)
  - Ce n'est pas lui-même (`!isOwnParticipant`)

**Action** : `setOpenAdminMenuId(participant.id)` → Affiche le menu pour ce participant

---

## 🔘 Option Menu Participant : "Nommer admin"

**Localisation** : Menu contextuel du bouton "⋮" sur un participant (visible si participant n'est PAS admin)

**Fonction** :
- Donne les droits d'administration à un participant

**Action** : `handlePromoteAdmin(participant.userId)` → Appelle `promoteAdmin()` API

**Résultat** :
- Met `isAdmin=true` pour ce participant
- Recharge la liste des participants après succès

**API utilisée** : `POST /participantConversation/promoteAdmin` avec `isAdmin=true`

---

## 🔘 Option Menu Participant : "Retirer admin"

**Localisation** : Menu contextuel du bouton "⋮" sur un participant (visible si participant EST admin)

**Fonction** :
- Retire les droits d'administration d'un participant

**Action** : `handleRemoveAdmin(participant.userId)` → Appelle `promoteAdmin()` API

**Résultat** :
- Met `isAdmin=false` pour ce participant
- Recharge la liste des participants après succès

**API utilisée** : `POST /participantConversation/promoteAdmin` avec `isAdmin=false`

---

## 📊 Résumé des Actions par Type d'Utilisateur

### 👤 Utilisateur Normal (non-admin)

**Peut faire** :
- ✅ Voir les informations du groupe
- ✅ Voir la liste des participants
- ✅ Quitter le groupe

**Ne peut PAS faire** :
- ❌ Ajouter des participants
- ❌ Retirer des participants
- ❌ Promouvoir/rétrograder des admins

---

### 👑 Administrateur

**Peut faire** :
- ✅ Toutes les actions d'un utilisateur normal
- ✅ Ajouter des participants (nouveaux ou réintégration)
- ✅ Retirer des participants
- ✅ Promouvoir un membre en admin
- ✅ Retirer le statut admin d'un membre

**Ne peut PAS faire** :
- ❌ Se retirer lui-même du statut admin (nécessite qu'un autre admin le fasse)
- ❌ Retirer/Quitter s'il est le dernier admin (selon logique backend)

---

## 🔄 Flux des Actions

### Flux 1 : Ajouter un participant

```
1. Admin clique "Actions du groupe" → "Ajouter un participant"
2. Modale AddParticipantsModal s'ouvre
3. Liste des contacts disponibles (exclut : actifs, réintégrés, définitivement partis)
4. Admin sélectionne des contacts
5. Clic "Ajouter"
6. Appel API createParticipant()
7. Si succès :
   - Nouveau participant → hasLeft=false
   - Réintégration → hasLeft=true, recreatedAt/recreatedBy remplis
8. Recharge liste des participants
9. Ferme la modale
```

### Flux 2 : Retirer un participant

```
1. Admin clique "Actions du groupe" → "Retirer un participant"
2. Modale RemoveParticipantModal s'ouvre
3. Liste des participants (exclut : utilisateur connecté, définitivement partis)
4. Admin clique sur bouton "🗑️" à côté d'un participant
5. Confirmation avec window.confirm()
6. Appel API deleteParticipant()
7. Si succès :
   - 1er départ → hasLeft=true, leftAt/leftBy remplis, isDeleted=true
   - 2ème départ → hasDefinitivelyLeft=true, definitivelyLeftAt/definitivelyLeftBy remplis, hasCleaned=true
8. Participant retiré de la liste affichée
9. Recharge liste des participants
```

### Flux 3 : Quitter le groupe

```
1. Utilisateur clique "Actions du groupe" → "Quitter le groupe"
2. Vérification : peut quitter ? (canLeaveGroup())
3. Si réintégré → Avertissement "2ème départ = définitif"
4. Confirmation avec window.confirm()
5. Appel API deleteParticipant() avec userId = currentUserId
6. Si succès :
   - 1er départ → hasLeft=true, leftAt/leftBy remplis, isDeleted=true
   - 2ème départ → hasDefinitivelyLeft=true, definitivelyLeftAt/definitivelyLeftBy remplis, hasCleaned=true
7. Recharge la page (window.location.reload())
```

### Flux 4 : Promouvoir/Rétrograder admin

```
1. Admin clique "⋮" à côté d'un participant (non-soi)
2. Menu contextuel s'affiche
3. Si participant non-admin → Option "Nommer admin"
   Si participant admin → Option "Retirer admin"
4. Clic sur l'option
5. Appel API promoteAdmin() avec isAdmin=true/false
6. Si succès :
   - Met à jour isAdmin pour ce participant
7. Recharge liste des participants
8. Menu se ferme automatiquement
```

---

## ⚠️ Validations et Restrictions

### Vérifications avant actions

1. **Ajouter participant** :
   - Vérifie que l'utilisateur est admin
   - Vérifie que le participant n'est pas déjà actif/réintégré/définitivement parti (frontend)
   - Backend vérifie aussi et retourne erreur si nécessaire

2. **Retirer participant** :
   - Vérifie que l'utilisateur est admin
   - Ne permet pas de retirer soi-même (utiliser "Quitter le groupe" à la place)

3. **Quitter le groupe** :
   - Vérifie `canLeaveGroup()` → Ne peut pas quitter si définitivement parti
   - Affiche avertissement si réintégré (2ème départ = définitif)

4. **Promouvoir/Rétrograder admin** :
   - Vérifie que l'utilisateur est admin
   - Ne permet pas de gérer son propre statut admin

---

## 📝 Notes Importantes

1. **Différence "Retirer" vs "Quitter"** :
   - "Retirer" = Admin retire quelqu'un d'autre
   - "Quitter" = Utilisateur se retire lui-même

2. **Validation logique métier** :
   - Toutes les actions loggent dans la console
   - Validation automatique que le backend respecte la logique métier
   - Messages d'erreur clairs si problème

3. **Rechargement automatique** :
   - Liste des participants rechargée après chaque action réussie
   - Page entière rechargée après "Quitter le groupe"

4. **Filtrage des participants** :
   - Participants définitivement partis ne s'affichent pas dans la liste
   - Seuls les participants actifs ou réintégrés sont visibles
