# Modèles d'e-mails Supabase Auth en français (Flowin Event)

Ces e-mails sont les seuls envoyés par Supabase Auth (compte et sécurité). Ils ne sont pas des messages commerciaux.
Couleur Flowin Event : bleu `#3B5CC4`. Variable de lien : `{{ .ConfirmationURL }}`.

## Où les coller
1. Supabase > projet `ywcqtupgoxfzkddqkztk` > **Authentication > Emails > Templates**.
2. Choisir le modèle (Confirm signup, Magic Link, Reset Password, Change Email Address).
3. Coller le **Subject** puis le **Body** (onglet Source / HTML).
4. **Save changes**. Envoyer un essai depuis l'application vers une adresse de test.
5. Expéditeur (nom, adresse) : Authentication > Emails > SMTP Settings — `[adresse d'expédition à compléter]`.

## 1. Confirm signup

Sujet : `Confirmez votre adresse e-mail - Flowin Event`

```html
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1B3A5C">
  <h2 style="color:#3B5CC4;margin:0 0 12px">Bienvenue sur Flowin Event</h2>
  <p>Confirmez votre adresse e-mail pour activer votre compte.</p>
  <p><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#3B5CC4;color:#fff;padding:12px 22px;border-radius:24px;text-decoration:none;font-weight:bold">Confirmer mon adresse</a></p>
  <p style="font-size:12px;color:#5a6b80">Vous n'êtes pas à l'origine de cette demande ? Ignorez ce message.</p>
</div>
```

## 2. Magic Link

Sujet : `Votre lien de connexion - Flowin Event`

```html
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1B3A5C">
  <h2 style="color:#3B5CC4;margin:0 0 12px">Connexion à Flowin Event</h2>
  <p>Touchez le bouton pour vous connecter. Ce lien ne sert qu'une fois.</p>
  <p><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#3B5CC4;color:#fff;padding:12px 22px;border-radius:24px;text-decoration:none;font-weight:bold">Me connecter</a></p>
  <p style="font-size:12px;color:#5a6b80">Vous n'êtes pas à l'origine de cette demande ? Ignorez ce message.</p>
</div>
```

## 3. Reset Password

Sujet : `Réinitialisez votre mot de passe - Flowin Event`

```html
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1B3A5C">
  <h2 style="color:#3B5CC4;margin:0 0 12px">Nouveau mot de passe</h2>
  <p>Touchez le bouton pour choisir un nouveau mot de passe.</p>
  <p><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#3B5CC4;color:#fff;padding:12px 22px;border-radius:24px;text-decoration:none;font-weight:bold">Choisir mon mot de passe</a></p>
  <p style="font-size:12px;color:#5a6b80">Vous n'avez rien demandé ? Votre mot de passe actuel reste valable.</p>
</div>
```

## 4. Change Email Address

Sujet : `Confirmez votre nouvelle adresse e-mail - Flowin Event`

```html
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1B3A5C">
  <h2 style="color:#3B5CC4;margin:0 0 12px">Changement d'adresse e-mail</h2>
  <p>Confirmez cette nouvelle adresse pour votre compte Flowin Event.</p>
  <p><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#3B5CC4;color:#fff;padding:12px 22px;border-radius:24px;text-decoration:none;font-weight:bold">Confirmer la nouvelle adresse</a></p>
  <p style="font-size:12px;color:#5a6b80">Vous n'êtes pas à l'origine de cette demande ? Ignorez ce message et gardez votre adresse actuelle.</p>
</div>
```
