import * as pilotService from '../services/pilotService.js';
import * as certificateService from '../services/certificateService.js';
import * as pilotHistoryService from '../services/pilotHistoryService.js';

// agrège les chiffres affichés sur le tableau de bord (cartes + activité récente)
export const getStats = async (req, res) => {
  try {
    // recalcule les statuts (actif/expirant/expiré) avant de sortir les compteurs
    await pilotService.syncPilotStatuses();

    // les 3 sources de données sont indépendantes, on les lance en parallèle
    const [statusCounts, certificatesThisMonth, recentActivity] = await Promise.all([
      pilotService.getStatusCounts(),
      certificateService.countCertificatesThisMonth(),
      // seulement les 5 dernières entrées, la plus récente en premier
      pilotHistoryService.getHistory({ page: 1, limit: 5, sort: 'desc' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPilots: statusCounts.all,
        activeCertificates: statusCounts.active,
        expiringCertificates: statusCounts.expiring,
        expiredCertificates: statusCounts.expired,
        certificatesThisMonth,
        recentActivity: recentActivity.data,
      },
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};
