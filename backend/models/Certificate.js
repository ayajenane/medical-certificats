import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
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
    certificateNumber: {
      type: String,
      required: [true, 'Le numéro de certificat est requis'],
      trim: true,
    },
    medicalClass: {
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
      type: String,
      enum: ['active', 'expiring', 'expired'],
      default: 'active',
    },
    formData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    generatedBy: {
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
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

certificateSchema.index({ pilotId: 1, createdAt: -1 });
certificateSchema.index({ certificateNumber: 'text', pilotName: 'text' });

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;
