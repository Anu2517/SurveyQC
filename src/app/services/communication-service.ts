import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { WellboreInfo } from '../models/WellBore/WellBoreInfoModel';
import { WitsmlConnection } from '../models/WellBore/WitsmlConnection';
import { EmailConfiguration } from '../models/WellBore/EmailConfiguration';
import { FacLimit } from '../models/WellBore/FacLimit';
import { ProcessConfiguration } from '../models/WellBore/ProcessConfiguration';
import { SystemSummaryInfo } from '../models/WellBore/SystemSummaryInfo';

/**
 * Communication service for all HTTP API calls
 * Central service for backend communication
 */
@Injectable({
  providedIn: 'root',
})
export class CommunicationService {

  private http = inject(HttpClient);

  /**
   * Get application version from backend
   * @returns Observable with version string
   */
  public getVersion(): Observable<string> {
    return this.http.get(
      environment.baseUrl + 'version/GetVersion',
      { responseType: 'text' }
    );
  }

  public getSummaryInformation(): Observable<SystemSummaryInfo> {
    return this.http.get<SystemSummaryInfo>(
      environment.baseUrl + 'wells/get-system-summary-information'
    );
  }

  public getSimulationModeStatus(): Observable<boolean> {
    return this.http.get<boolean>(
      environment.witsmlUrl + 'job-manager/is-simulation-mode'
    );
  }

  public startProcessing(): Observable<void> {
    return this.http.get<void>(
      environment.witsmlUrl + 'job-manager/start-processing'
    );
  }

  // wellBore
  public getMonitoredWellbores(): Observable<WellboreInfo[]> {
    return this.http.get<WellboreInfo[]>(
      environment.baseUrl + 'wells/get-monitored-wellbores'
    );
  }

  public getWellboreState(wellboreId: string): Observable<WellboreInfo> {
    const params = new HttpParams({ fromObject: { wellboreId } });
    return this.http.get<WellboreInfo>(
      environment.baseUrl + 'wells/get-wellbore-state',
      { params }
    );
  }

  public getWellboreSurveys(wellboreId: string): Observable<any> {
    const params = new HttpParams({ fromObject: { wellboreId } });
    return this.http.get(
      environment.baseUrl + 'wells/get-wellbore-surveys',
      { params }
    );
  }

  public updateWellboreSurveyStatus(surveys: any): Observable<void> {
    return this.http.post<void>(
      environment.baseUrl + 'wells/update-wellbore-survey-status',
      surveys
    );
  }

  public processWellboreForMSA(wellboreId: string): Observable<boolean> {
    return this.http.post<boolean>(
      environment.baseUrl + 'MSAProcessor/Process-Wellbore-MSA',
      wellboreId
    );
  }

  public getSurveyQueue(): Observable<number> {
    return this.http.get<number>(
      environment.baseUrl + 'process-manager/get-survey-queue'
    );
  }

  // Email
  public getEmailConfiguration(): Observable<EmailConfiguration> {
    return this.http.get<EmailConfiguration>(
      environment.baseUrl + 'configuration-manager/get-email-configuration'
    );
  }

  public updateEmailConfiguration(config: EmailConfiguration): Observable<void> {
    return this.http.post<void>(
      environment.baseUrl + 'configuration-manager/update-email-configuration',
      config
    );
  }

  // Settings
  public getWitsmlConnection(): Observable<WitsmlConnection> {
    return this.http.get<WitsmlConnection>(
      environment.witsmlUrl + 'witsml/get-witsml-connection'
    );
  }

  public isWitsmlConnectionValid(): Observable<boolean> {
    return this.http.get<boolean>(
      environment.witsmlUrl + 'witsml/active-witsml-connection-valid'
    );
  }

  public updateWitsmlConnection(payload: any): Observable<boolean> {
    return this.http.post<boolean>(
      environment.witsmlUrl + 'witsml/update-witsml-connection',
      payload
    );
  }

  public testWitsmlConnection(payload: any): Observable<boolean> {
    return this.http.post<boolean>(
      environment.witsmlUrl + 'witsml/test-witsml-connection',
      payload
    );
  }

  // Overall Summary Charts
  public getErrorSummmary(): Observable<any> {
    return this.http.get(
      environment.baseUrl + 'process-manager/get-error-summary'
    );
  }

  // FacLimits
  public getFacLimits(): Observable<FacLimit> {
    return this.http.get<FacLimit>(
      environment.baseUrl + 'configuration-manager/get-fac-limits'
    );
  }

  public updateFacLimits(config: FacLimit): Observable<void> {
    return this.http.post<void>(
      environment.baseUrl + 'configuration-manager/update-fac-limits',
      config
    );
  }

  public getProcessConfiguration(): Observable<ProcessConfiguration> {
    return this.http.get<ProcessConfiguration>(
      environment.baseUrl + 'configuration-manager/get-process-configuration'
    );
  }

  public updateProcessConfiguration(payload: ProcessConfiguration): Observable<void> {
    return this.http.post<void>(
      environment.baseUrl + 'configuration-manager/update-process-configuration',
      payload
    );
  }
}