import mongoose from 'mongoose';

// certificat médical généré pour un pilote (classe 1 à 4), une entrée par génération de PDF
const certificateSchema = new mongoose.Schema(
  {
    pilotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pilot',
      required: true,
    },
    pilotName: {
      // dupliqué depuis Pilot pour garder le nom même si le pilote est archivé/renommé plus tard
      type: String,
      required: true,
    },
    certificateNumber: {
      type: String,
      required: [true, 'Le numéro de certificat est requis'],
      trim: true,
    },
    medicalClass: {
      // classe de certification médicale aéronautique (1 = le plus strict, pilotes de ligne)
      type: String,
      enum: ['1', '2', '3', '4'],
      default: '1',
    },
    issueDate: {
      type: Date,
      required: [true, "La date d'émission est requise"],
    },
    expiryDate: {
      type: Date,
      required: [true, "La date d'expiration est requise"],
    },
    status: {
      // active si >30j avant expiration, expiring si <=30j, expired si dépassé, recalculé côté service
      type: String,
      enum: ['active', 'expiring', 'expired'],
      default: 'active',
    },
    formData: {
      // snapshot brut du formulaire au moment de la génération, pour le PDF
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    generatedBy: {
      // traçabilité de qui a généré le certificat, utile pour l'audit
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      username: {
        type: String,
        default: 'Système',
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      // remplace _id par un champ id lisible côté front, retire le __v technique de mongoose
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// index pour lister rapidement les certificats d'un pilote triés par date
certificateSchema.index({ pilotId: 1, createdAt: -1 });
// index texte pour la recherche multicritère sur numéro/nom
certificateSchema.index({ certificateNumber: 'text', pilotName: 'text' });

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;
