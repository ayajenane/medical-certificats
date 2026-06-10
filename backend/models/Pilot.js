import mongoose from 'mongoose';

const pilotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du pilote est requis'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    licenseNumber: {
      type: String,
      trim: true,
      default: '',
    },
    licenseType: {
      type: String,
      enum: ['ATPL', 'CPL', 'PPL', 'ATCO', 'Autre'],
      default: 'ATPL',
    },
    nationality: {
      type: String,
      trim: true,
      default: '',
    },
    medicalClass: {
      type: String,
      enum: ['1', '2', '3', '4'],
      default: '1',
    },
    expiryDate: {
      type: Date,
      required: [true, "La date d'expiration est requise"],
    },
    archived: {
      type: Boolean,
      default: false,
    },
    lastKnownStatus: {
      type: String,
      enum: ['active', 'expiring', 'expired', 'unknown'],
      default: 'unknown',
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

const Pilot = mongoose.model('Pilot', pilotSchema);

export default Pilot;
