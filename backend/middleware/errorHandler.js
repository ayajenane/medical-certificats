// middleware d'erreur centralisé, dernier maillon de la chaîne Express (voir app.js).
// Les contrôleurs appellent next(error) au lieu de répondre eux-mêmes, ce qui garantit un
// format de réponse uniforme et évite de renvoyer au client des messages internes
// (erreurs Mongoose/driver Mongo, stack traces...) sur les erreurs 500.
export const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode && error.statusCode < 500 ? error.statusCode : 500;

  if (statusCode === 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Erreur interne du serveur' : error.message,
  });
};
