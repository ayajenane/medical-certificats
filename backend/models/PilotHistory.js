import mongoose from 'mongoose';

// journal d'audit des actions sur les pilotes et leurs certificats
const pilotHistorySchema = new mongoose.Schema(
  {
    pilotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pilot',
      required: true,
    },
    pilotName: {
      // dupliqué depuis Pilot pour que l'historique reste lisible même si le pilote est supprimé
      type: String,
      required: true,
    },
    action: {
      // type d'événement tracé dans l'audit trail du pilote
      type: String,
      enum: [
        'PILOT_CREATED',
        'PILOT_UPDATED',
        'PILOT_ARCHIVED',
        'PILOT_RESTORED',
        'PILOT_RENEWED', // renouvellement de certificat, distinct d'un simple PILOT_UPDATED
        'PILOT_EXPIRED',
        'PILOT_DELETED',
        'CERTIFICATE_GENERATED',
      ],
      required: true,
    },
    oldData: {
      // état avant modification, null si création
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    performedBy: {
      // 'Système' par défaut pour les actions automatiques (ex: expiration détectée par un job)
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      username: {
        type: String,
        default: 'Système',
      },
      email: {
        type: String,
        default: null,
      },
    },
  },
  {
    // pas d'updatedAt, un log d'historique ne se modifie jamais
    timestamps: { createdAt: true, updatedAt: false },
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

// index pour trier par date récente et filtrer/rechercher par action ou par pilote
pilotHistorySchema.index({ createdAt: -1 });
pilotHistorySchema.index({ action: 1 });
pilotHistorySchema.index({ pilotName: 'text' });

const PilotHistory = mongoose.model('PilotHistory', pilotHistorySchema);

export default PilotHistory;
