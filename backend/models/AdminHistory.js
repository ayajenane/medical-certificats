import mongoose from 'mongoose';

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
      type: String,
      enum: ['ADMIN_CREATED', 'ADMIN_UPDATED', 'ADMIN_PASSWORD_RESET', 'ADMIN_DELETED'],
      required: true,
    },
    oldData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    performedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      username: { type: String, default: 'Système' },
      email: { type: String, default: null },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

adminHistorySchema.index({ createdAt: -1 });
adminHistorySchema.index({ action: 1 });
adminHistorySchema.index({ adminName: 'text', adminEmail: 'text' });

const AdminHistory = mongoose.model('AdminHistory', adminHistorySchema);

export default AdminHistory;
