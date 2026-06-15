import * as pilotService from '../services/pilotService.js';
import * as certificateService from '../services/certificateService.js';
import * as pilotHistoryService from '../services/pilotHistoryService.js';

export const getStats = async (req, res) => {
  try {
    await pilotService.syncPilotStatuses();

    const [statusCounts, certificatesThisMonth, recentActivity] = await Promise.all([
      pilotService.getStatusCounts(),
      certificateService.countCertificatesThisMonth(),
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
