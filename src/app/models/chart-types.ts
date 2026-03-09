import { EChartsOption } from 'echarts';

export interface ErrorItem {
  surveyErrorEnum: number;
  count: number;
  dataMissing?: number;
}

export interface ErrorSummaryData {
  errorSummary: ErrorItem[];
  errorSummaryPerServiceProvider: Record<string, ErrorItem[]>;
}

export interface ProviderApproval {
  totalSurveys: number;
  autoApprovedSurveys: number;
  gyroSurveys?: number;
  percentageAutoApproved?: string;
}

export interface ProviderReport {
  providerName: string;
  errors: { label: string; count: number; percentage: string }[];
  approvalSummary: ProviderApproval | null;
  missingDataErrors: { label: string }[];
  chartOption: EChartsOption;
}

export type PdfOptions = Record<string, unknown>;