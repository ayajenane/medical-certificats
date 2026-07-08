const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const LICENSE_TYPES = ['ATPL', 'CPL', 'PPL', 'ATCO', 'Autre'];
const MEDICAL_CLASSES = ['1', '2', '3', '4'];

export const isValidEmail = (email) => EMAIL_REGEX.test(email);

// en mode partial (update), on ne râle pas si un champ requis est juste absent du body
export const validatePilotInput = (data, { partial = false } = {}) => {
  const errors = [];

  // nom requis en création, optionnel en update tant qu'il n'est pas fourni
  if (!partial || data.name !== undefined) {
    if (!data.name || !data.name.trim()) {
      errors.push('Le nom du pilote est requis.');
    } else if (data.name.trim().length < 2) {
      errors.push('Le nom du pilote doit contenir au moins 2 caractères.');
    }
  }

  // même logique pour la date d'expiration: requise sauf en update partiel où elle est absente
  if (!partial || data.expiryDate !== undefined) {
    if (!data.expiryDate) {
      errors.push("La date d'expiration est requise.");
    } else if (Number.isNaN(new Date(data.expiryDate).getTime())) {
      errors.push("La date d'expiration est invalide.");
    }
  }

  // email toujours optionnel, mais s'il est fourni il doit être valide
  if (data.email && !isValidEmail(data.email)) {
    errors.push('Adresse email invalide.');
  }

  if (data.medicalClass !== undefined && !MEDICAL_CLASSES.includes(String(data.medicalClass))) {
    errors.push('La classe médicale doit être 1, 2, 3 ou 4.');
  }

  if (data.licenseType !== undefined && !LICENSE_TYPES.includes(data.licenseType)) {
    errors.push('Le type de licence est invalide.');
  }

  return errors;
};

// validation d'un certificat: toujours en création complète, pas de mode partiel ici
export const validateCertificateInput = (data) => {
  const errors = [];

  if (!data.pilotId) {
    errors.push('Le pilote associé est requis.');
  }

  if (!data.certificateNumber || !String(data.certificateNumber).trim()) {
    errors.push('Le numéro de certificat est requis.');
  }

  if (!data.issueDate || Number.isNaN(new Date(data.issueDate).getTime())) {
    errors.push("La date d'émission est requise et doit être valide.");
  }

  if (!data.expiryDate || Number.isNaN(new Date(data.expiryDate).getTime())) {
    errors.push("La date d'expiration est requise et doit être valide.");
  }

  // vérif de cohérence seulement si les deux dates sont déjà valides individuellement
  if (
    data.issueDate &&
    data.expiryDate &&
    !Number.isNaN(new Date(data.issueDate).getTime()) &&
    !Number.isNaN(new Date(data.expiryDate).getTime()) &&
    new Date(data.expiryDate) <= new Date(data.issueDate)
  ) {
    errors.push("La date d'expiration doit être postérieure à la date d'émission.");
  }

  if (data.medicalClass !== undefined && !MEDICAL_CLASSES.includes(String(data.medicalClass))) {
    errors.push('La classe médicale doit être 1, 2, 3 ou 4.');
  }

  return errors;
};
