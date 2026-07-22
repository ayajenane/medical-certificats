import rateLimit from 'express-rate-limit';

// limite les tentatives de login pour ralentir le brute-force sur les mots de passe
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // fenêtre de 15min
  max: 10, // 10 essais max par IP sur la fenêtre, anti brute-force
  message: { success: false, message: 'Trop de tentatives de connexion, réessayez dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// limite les actions sensibles liées aux comptes (création d'admin, reset/changement de mot de passe) :
// moins strict que le login puisqu'elles nécessitent déjà d'être authentifié, mais on évite
// qu'un token compromis serve à spammer ces routes.
export const accountActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Trop de tentatives, réessayez dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// limiteur général appliqué à toute l'API, pour éviter qu'un client (script, bug frontend en boucle...)
// ne sature le serveur. Volontairement large car l'app fait de la pagination/recherche fréquente.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Trop de requêtes, réessayez plus tard' },
  standardHeaders: true,
  legacyHeaders: false,
});
