import mongoose from 'mongoose';

// journal d'audit des actions sur les comptes admin (créé/modifié/supprimé/reset mdp)
const adminHistorySchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    adminName: {
      type: String,
      required: true,
    },
    adminEmail: {
      type: String,
      default: null,
    },
    action: {
      // type d'événement tracé dans l'audit trail admin
      type: String,
      enum: ['ADMIN_CREATED', 'ADMIN_UPDATED', 'ADMIN_PASSWORD_RESET', 'ADMIN_DELETED'],
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
      // qui a déclenché l'action, 'Système' par défaut pour les entrées créées par script/migration
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      username: { type: String, default: 'Système' },
      email: { type: String, default: null },
    },
  },
  {
    // pas d'updatedAt, un log ne se modifie jamais après coup
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

// index pour trier par date récente et filtrer par type d'action rapidement
adminHistorySchema.index({ createdAt: -1 });
adminHistorySchema.index({ action: 1 });
// index texte pour la recherche libre sur le nom/email de l'admin concerné
adminHistorySchema.index({ adminName: 'text', adminEmail: 'text' });

const AdminHistory = mongoose.model('AdminHistory', adminHistorySchema);

export default AdminHistory;
