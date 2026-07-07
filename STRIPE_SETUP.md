# 🔐 Configuration Stripe - Equi Saddles

Ce document explique comment configurer correctement Stripe pour votre application e-commerce Equi Saddles.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Configuration des clés API](#configuration-des-clés-api)
3. [Configuration du Webhook (IMPORTANT)](#configuration-du-webhook-important)
4. [Tests en mode développement](#tests-en-mode-développement)
5. [Passage en production](#passage-en-production)
6. [Dépannage](#dépannage)

---

## Prérequis

- Un compte Stripe (test ou live)
- Accès au dashboard Stripe : https://dashboard.stripe.com
- Votre application déployée avec une URL publique (pour le webhook)

---

## Configuration des clés API

### 1. Obtenir les clés Stripe

**Dashboard Stripe > Developers > API keys**

Vous y trouverez :
- **Publishable key** (clé publique) : commence par `pk_test_` ou `pk_live_`
- **Secret key** (clé secrète) : commence par `sk_test_` ou `sk_live_`

### 2. Configurer les variables d'environnement

#### Pour Replit :
1. Ouvrez votre Repl
2. Allez dans **Secrets** (icône cadenas)
3. Ajoutez les secrets suivants :

```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
```

#### Pour Railway :
1. Ouvrez votre projet Railway
2. Allez dans **Variables**
3. Ajoutez les mêmes variables que ci-dessus

⚠️ **ATTENTION** : 
- `STRIPE_SECRET_KEY` ne doit JAMAIS être exposée publiquement
- `VITE_STRIPE_PUBLIC_KEY` peut être exposée (elle est utilisée côté client)

---

## Configuration du Webhook (IMPORTANT)

### Pourquoi un webhook ?

Le webhook permet à Stripe de notifier votre application quand un paiement est complété. C'est **ESSENTIEL** pour :
- Créer automatiquement les commandes après paiement
- Garantir la sécurité (validation des paiements réels)
- Gérer les paiements asynchrones

### Étapes de configuration

#### 1. Créer un endpoint webhook dans Stripe

**Dashboard Stripe > Developers > Webhooks > Add endpoint**

#### 2. Configurer l'URL du webhook

Utilisez l'URL de votre application déployée :

```
https://votre-domaine.com/webhook
```

Exemples :
- Replit : `https://votre-app.replit.app/webhook`
- Railway : `https://votre-app.up.railway.app/webhook`
- Domaine custom : `https://www.equisaddles.com/webhook`

#### 3. Sélectionner les événements

Sélectionnez les événements suivants :
- ✅ `checkout.session.completed` (obligatoire)
- ✅ `checkout.session.async_payment_succeeded` (recommandé)
- ✅ `checkout.session.async_payment_failed` (recommandé)

#### 4. Récupérer le Signing Secret

Après avoir créé le webhook, Stripe vous fournit un **Signing Secret** qui commence par `whsec_`.

**C'est ce secret qu'il faut ajouter à vos variables d'environnement !**

#### 5. Ajouter STRIPE_WEBHOOK_SECRET

**Pour Replit :**
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Pour Railway :**
Ajoutez la même variable dans Variables.

---

## Tests en mode développement

### Option 1 : Stripe CLI (Recommandé)

Le Stripe CLI permet de tester les webhooks localement.

#### Installation :
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x86_64.tar.gz
tar -xvf stripe_linux_x86_64.tar.gz
```

#### Utilisation :
```bash
# 1. Connectez-vous
stripe login

# 2. Forwarder les webhooks vers votre serveur local
stripe listen --forward-to localhost:8080/webhook

# 3. Tester un paiement
stripe trigger checkout.session.completed
```

### Option 2 : Mode développement sans webhook secret

L'application peut fonctionner **temporairement** sans `STRIPE_WEBHOOK_SECRET` en mode développement :
- ⚠️ Un warning sera affiché dans les logs
- ⚠️ Les webhooks ne seront pas validés (NON SÉCURISÉ)
- ✅ Utile uniquement pour les tests rapides

**Ne JAMAIS déployer en production sans webhook secret !**

---

## Passage en production

### Checklist avant le lancement

- [ ] Obtenir les clés **live** Stripe (`pk_live_` et `sk_live_`)
- [ ] Créer un webhook en mode **live** dans Stripe
- [ ] Configurer `STRIPE_WEBHOOK_SECRET` avec le secret live
- [ ] Vérifier que l'URL du webhook est accessible publiquement (HTTPS)
- [ ] Tester un paiement réel (peut-être avec un petit montant)
- [ ] Vérifier que la commande est créée automatiquement dans la base de données

### Différences Test vs Live

| Aspect | Mode Test | Mode Live |
|--------|-----------|-----------|
| Clés API | `pk_test_` / `sk_test_` | `pk_live_` / `sk_live_` |
| Cartes | Cartes de test Stripe | Vraies cartes bancaires |
| Webhooks | Endpoint séparé (optionnel) | Endpoint en HTTPS (obligatoire) |
| Argent | Simulé | Réel |

### Cartes de test Stripe

Pour tester les paiements en mode test :

| Carte | Numéro | Résultat |
|-------|--------|----------|
| Visa | 4242 4242 4242 4242 | ✅ Succès |
| Visa (decline) | 4000 0000 0000 0002 | ❌ Refusé |
| Mastercard | 5555 5555 5555 4444 | ✅ Succès |

**Expiration** : N'importe quelle date future  
**CVV** : N'importe quel 3 chiffres  
**Postal** : N'importe quel code postal valide

---

## Dépannage

### Problème : "Stripe is not configured"

**Cause** : La variable `STRIPE_SECRET_KEY` n'est pas définie.

**Solution** :
1. Vérifiez que la variable est bien dans vos Secrets/Variables
2. Redémarrez votre application
3. Vérifiez les logs : `STRIPE_SECRET_KEY not found`

### Problème : "Webhook signature verification failed"

**Cause** : Le `STRIPE_WEBHOOK_SECRET` est incorrect ou manquant.

**Solution** :
1. Vérifiez que vous avez copié le bon secret depuis Stripe Dashboard
2. Assurez-vous que le secret commence par `whsec_`
3. Redémarrez l'application après avoir ajouté le secret

### Problème : Les commandes ne sont pas créées après paiement

**Causes possibles** :
1. Le webhook n'est pas configuré dans Stripe
2. L'URL du webhook est incorrecte
3. Le webhook secret est manquant ou incorrect
4. Le webhook n'est pas accessible (firewall, HTTPS requis)

**Solution** :
1. Vérifiez dans Stripe Dashboard > Webhooks que l'endpoint est actif
2. Regardez les logs du webhook dans Stripe Dashboard
3. Vérifiez les logs serveur pour voir si le webhook est reçu
4. Testez l'URL manuellement : `curl https://votre-app.com/webhook`

### Problème : "Payment intent creation failed"

**Cause** : Problème avec les données envoyées à Stripe.

**Solution** :
1. Vérifiez que les montants sont positifs
2. Vérifiez que les URLs d'images sont valides (HTTP/HTTPS complets)
3. Regardez les logs serveur pour plus de détails

---

## 📊 Logs et monitoring

### Logs serveur

L'application log les événements Stripe importants :

```
✅ Webhook signature verified
Processing checkout.session.completed: cs_test_xxxxx
✅ Order created for session cs_test_xxxxx
```

### Dashboard Stripe

Surveillez :
- **Events** : Tous les événements webhook reçus
- **Webhooks** : Status et logs des webhooks
- **Payments** : Liste des paiements réussis/échoués

---

## 🔗 Ressources utiles

- [Documentation Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Documentation Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Cartes de test](https://stripe.com/docs/testing)

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs serveur
2. Vérifiez le dashboard Stripe > Events
3. Consultez ce guide de dépannage
4. Contactez le support Stripe si nécessaire

---

**Dernière mise à jour** : 26 Janvier 2025  
**Version de l'application** : 1.0.0
