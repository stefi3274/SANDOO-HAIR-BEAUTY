# Sandoo Hair Beauty — Site web

École de coiffure & beauté · Cap-Haïtien. Site statique (HTML/CSS/JS) avec
inscriptions enregistrées dans Supabase + espace admin.

## Pages
- index.html — Accueil
- formations.html — Les 6 formations
- galerie.html — Réalisations des élèves
- a-propos.html — L'école, mission, valeurs
- inscription.html — Préinscription (enregistre en base + ouvre WhatsApp)
- contact.html — Coordonnées + message (→ WhatsApp)
- mentions-legales.html — Mentions légales
- admin.html — Espace admin (réservé, voir les inscriptions)

## Dossiers
- css/style.css — design (couleurs dans :root)
- js/main.js — interactions + numéro WhatsApp (constante WA)
- js/supabase-config.js — clés Supabase + ENTREPRISE_SLUG (déjà configuré)
- js/inscription.js — enregistre l'inscription en base + WhatsApp
- js/admin.js — espace admin (connexion, liste, traité, suppression)
- img/ — logo.png, icon.png

## Supabase (déjà configuré)
- Projet partagé multi-entreprises. Cette école = slug "sandoo".
- L'admin se connecte sur /admin.html avec l'email/mot de passe créé dans
  Supabase (Authentication) et relié à l'entreprise "sandoo".
- Les règles RLS garantissent que l'admin ne voit QUE les inscriptions de Sandoo.

## Déploiement (VS Code → GitHub → Vercel)
1. Ouvrir ce dossier dans VS Code.
2. Le publier sur un dépôt GitHub (Source Control → Publish).
   ⚠️ C'est un site SÉPARÉ de SteFi : nouveau dépôt + nouveau projet Vercel.
3. Sur Vercel : New Project → importer le dépôt → Framework "Other" → Deploy.
4. Tester : faire une inscription, puis se connecter à /admin.html.

## Reste à personnaliser
- Photos réelles (galerie + hero utilisent des emojis pour l'instant).
