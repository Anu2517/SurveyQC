import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { MessageService } from 'primeng/api';
import { LoggerService } from './logger.service';

/**
 * SignalR service for real-time communication with backend
 * Manages WebSocket connection and event subscriptions
 */
@Injectable({
  providedIn: 'root',
})
export class SignalrService {
  private connectionEstablishedSubject = new BehaviorSubject<boolean>(false);
  connectionEstablished$ = this.connectionEstablishedSubject.asObservable();

  public isServerConnectedSubject = new BehaviorSubject<boolean>(false);
  isServerConnected$ = this.isServerConnectedSubject.asObservable();

  public surveyCountNofitication = new Subject<any>();
  public wellboreProcessState = new Subject<any>();
  public wellboreSurveysCounts = new Subject<any>();

  private connection!: HubConnection;
  public signalRUrl: string = environment.signalRUrl;

  private reconnecting: boolean = false;

  constructor(
    private message: MessageService,
    private logger: LoggerService
  ) {
    this.createConnection();
    this.startConnection();
  }

  /**
   * Create SignalR connection instance
   * @private
   */
  private createConnection() {
    this.isServerConnectedSubject.next(true);
    this.connection = new HubConnectionBuilder()
      .withUrl(this.signalRUrl)
      .build();

    this.connection.onclose(error => {
      this.logger.warn('SignalR disconnected. Reconnecting...');
      this.handleDisconnect();
    });
  }

  /**
   * Handle connection disconnection and schedule reconnection
   * @private
   */
  private handleDisconnect() {
    this.logger.info('Handling SignalR disconnection');
    this.connectionEstablishedSubject.next(false);
    this.isServerConnectedSubject.next(false);

    setTimeout(() => this.startConnection(), 60000);
  }

  /**
   * Start SignalR connection
   * @private
   */
  private async startConnection(): Promise<void> {
    if (this.connection.state !== HubConnectionState.Disconnected || this.reconnecting) {
      return;
    }

    this.reconnecting = true;

    try {
      this.logger.info('Starting SignalR connection');
      this.connection.serverTimeoutInMilliseconds = 100000;
      await this.connection.start();
      this.logger.info('SignalR connection established');
      this.setupConnection();
    } catch (error) {
      this.logger.error('Error establishing SignalR connection:', error);
      this.handleDisconnect();
    } finally {
      this.reconnecting = false;
    }
  }

  /**
   * Setup connection state and event listeners
   * @private
   */
  private setupConnection() {
    this.connectionEstablishedSubject.next(true);
    this.isServerConnectedSubject.next(true);
    this.setupEventListeners();
  }

  /**
   * Setup SignalR event listeners
   * @private
   */
  private setupEventListeners() {
    
    this.connection.on("OnSurveyCount", count => {
      this.surveyCountNofitication.next(count);
    });

    this.connection.on("OnWellboreProcessState", wellState => {
      this.wellboreProcessState.next(wellState);
    });

    this.connection.on("SystemSummaryInformation", (wellboreId: string, value: any) => {
      const obj = { wellboreId, value };
      this.wellboreSurveysCounts.next(obj);
    });
    this.connection.on("OnSurveysUpdated",wellId =>{
      this.showNotification('success', 'MSA Updated for '+ wellId, '');
      this.logger.debug('OnSurveysUpdated received', wellId);
    });
  }

  /**
   * Show notification using PrimeNG toast
   * @param status - Notification severity
   * @param title - Notification title
   * @param subtitle - Notification detail
   */
  showNotification(status:"success" | "info" | "warning" | "error" | "blank", title:string, subtitle:string){
    this.message.add({
    severity: status,
    summary: title,
    detail: subtitle
  });
  }
  
}