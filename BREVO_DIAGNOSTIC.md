# 🔍 Diagnostic Brevo - Emails non reçus

## Page de test créée

Accédez à : **https://www.equisaddles.com/email-test**

Cette page permet de tester l'envoi d'emails via l'API Brevo directement.

---

## ✅ Checklist de diagnostic

### 1. Vérifier la clé API dans Railway

```bash
# Dans Railway Dashboard → Variables
BREVO_API_KEY=xkeysib-...
```

**Action** : Vérifier que la variable existe et commence bien par `xkeysib-`

### 2. Vérifier l'email expéditeur dans Brevo

1. Connectez-vous à https://app.brevo.com
2. Allez dans **Senders & IP** 
3. Vérifiez que `equisaddles@gmail.com` est présent et **vérifié** (statut vert)

**Important** : Sans email vérifié, Brevo refuse d'envoyer les emails !

### 3. Vérifier les logs Railway

```bash
# Dans Railway → Deployments → Logs
# Recherchez ces messages :
📧 Sending email via Brevo: { ... }
✅ Brevo API response: { ... }
❌ Brevo API error: { ... }
```

**Ce que vous devez voir** :
- ✅ `Email sent successfully via Brevo API:` → Email envoyé
- ❌ `BREVO_API_KEY not configured` → Clé API manquante
- ❌ `Brevo API error: 401` → Clé API invalide
- ❌ `Brevo API error: 400` → Email expéditeur non vérifié

### 4. Vérifier le dossier spam

**Action** : Vérifier le dossier spam de `equisaddles@gmail.com`

Les emails de test peuvent être marqués comme spam la première fois.

### 5. Vérifier l'activité dans Brevo

1. Dashboard Brevo → **Statistics**
2. Vérifier les **Transactional emails**
3. Rechercher les envois récents

**États possibles** :
- ✅ `Delivered` → Email bien reçu
- ⏳ `Sent` → En cours de livraison
- ❌ `Blocked` → Bloqué par Brevo
- ❌ `Bounced` → Email invalide/rejeté

---

## 🧪 Test manuel via API

Pour tester directement l'API Brevo :

```bash
curl -X POST https://api.brevo.com/v3/smtp/email \
  -H "Content-Type: application/json" \
  -H "api-key: VOTRE_CLE_API" \
  -d '{
    "sender": {"name": "Test", "email": "equisaddles@gmail.com"},
    "to": [{"email": "equisaddles@gmail.com"}],
    "subject": "Test email",
    "htmlContent": "<p>Test</p>"
  }'
```

---

## 📋 Configuration actuelle de l'app

### Emails configurés

| Rôle | Email |
|------|-------|
| Email expéditeur par défaut | `equisaddles@gmail.com` |
| Email destinataire admin | `equisaddles@gmail.com` |
| Email dans templates | `equisaddles@gmail.com` |

### Fichiers concernés

- `server/services/brevo.ts` → Service d'envoi
- `server/routes/chat.ts` → Envoi lors des messages chat
- `server/routes.ts` → Route de test `/api/test-email`

---

## 🚨 Problèmes courants

### Erreur 401 - Unauthorized
**Cause** : Clé API invalide ou mal configurée
**Solution** : Vérifier que `BREVO_API_KEY` dans Railway est correcte

### Erreur 400 - Bad Request
**Cause** : Email expéditeur non vérifié dans Brevo
**Solution** : Vérifier l'email dans Brevo Dashboard → Senders

### Erreur 403 - Forbidden
**Cause** : Compte Brevo suspendu ou limite atteinte
**Solution** : Vérifier le statut du compte Brevo

### Email non reçu mais API retourne 200
**Cause** : Email dans spam ou délai de livraison
**Solution** : 
1. Vérifier le dossier spam
2. Attendre 5-10 minutes
3. Vérifier les logs Brevo Dashboard

---

## 🔧 Actions correctives

### Si l'email expéditeur n'est pas vérifié

1. Dashboard Brevo → **Senders & IP**
2. Cliquer sur **Add a sender**
3. Ajouter `equisaddles@gmail.com`
4. Vérifier via le lien reçu dans l'email

### Si la clé API est invalide

1. Dashboard Brevo → **SMTP & API**
2. Créer une nouvelle clé API
3. Copier la clé (commence par `xkeysib-`)
4. Mettre à jour dans Railway Variables

### Si limite d'envoi atteinte

1. Dashboard Brevo → **Plan & Billing**
2. Vérifier le quota (gratuit = 300 emails/jour)
3. Upgrade si nécessaire

---

## 📊 Monitoring

### Logs à surveiller dans Railway

```
✅ Bon fonctionnement :
[INFO] 📧 Sending email via Brevo: { to: [...], subject: "..." }
[INFO] ✅ Brevo API response: { messageId: "..." }
[INFO] Email sent successfully via Brevo API

❌ Problème :
[ERROR] ❌ Brevo API error: { status: 401, error: {...} }
[ERROR] Error sending email: ...
```

---

## 🆘 Support

Si le problème persiste :

1. Vérifier le statut de Brevo : https://status.brevo.com
2. Contacter le support Brevo : support@brevo.com
3. Vérifier la documentation : https://developers.brevo.com
