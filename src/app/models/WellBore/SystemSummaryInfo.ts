export class SystemSummaryInfo {
    totalSurveys: number = 0;
    totalAutoRejectedSurveys: number = 0;
    totalAutoApprovedSurveys: number = 0;
    totalUserApprovedSurveys: number = 0;
    totalUserRejectedSurveys: number = 0;
    totalUnknownSurveys: number = 0;
}

export interface PieChartData {
  serviceCompany: string;
  totalSurveys: number;
  autoApproved: number;
  userApproved: number;
  autoRejected: number;
  userRejected: number;
  unknown: number;
}
