import mongoose from 'mongoose';

const pilotHistorySchema = new mongoose.Schema(
  {
    pilotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pilot',
      required: true,
    },
    pilotName: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: [
        'PILOT_CREATED',
        'PILOT_UPDATED',
        'PILOT_ARCHIVED',
        'PILOT_RESTORED',
        'PILOT_RENEWED',
        'PILOT_EXPIRED',
        'PILOT_DELETED',
      ],
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

pilotHistorySchema.index({ createdAt: -1 });
pilotHistorySchema.index({ action: 1 });
pilotHistorySchema.index({ pilotName: 'text' });

const PilotHistory = mongoose.model('PilotHistory', pilotHistorySchema);

export default PilotHistory;
