import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class SignalrService {
  private connectionEstablishedSubject = new BehaviorSubject<boolean>(false);
  connectionEstablished$ = this.connectionEstablishedSubject.asObservable();

  public isServerConnectedSubject = new BehaviorSubject<boolean>(false);
  isServerConnected$ = this.isServerConnectedSubject.asObservable();

  public surveyCountNofitication: EventEmitter<any> = new EventEmitter();
  public wellboreProcessState: EventEmitter<any> = new EventEmitter();
  public wellboreSurveysCounts: EventEmitter<any> = new EventEmitter();

  private connection!: HubConnection;
  public signalRUrl: string = environment.signalRUrl;

  private reconnecting: boolean = false;

  constructor(private _message: MessageService) {
    this.createConnection();
    this.startConnection();
    // this.signalRConnector();
  }

  private createConnection() {
    this.isServerConnectedSubject.next(true);
    this.connection = new HubConnectionBuilder()
      .withUrl(this.signalRUrl)
      .build();

    this.connection.onclose(error => {
      console.log("Disconnected. Reconnecting...");
      this.handleDisconnect();
    });
  }

  private handleDisconnect() {
    console.log("Handling disconnection...");
    this.connectionEstablishedSubject.next(false);
    this.isServerConnectedSubject.next(false);
    localStorage.setItem('isServerConnected', 'false');
    this.reconnecting = false;

    setTimeout(() => this.startConnection(), 60000);
  }

  private async startConnection(): Promise<void> {
    if (this.connection.state !== HubConnectionState.Disconnected || this.reconnecting) {
      return;
    }

    this.reconnecting = true;

    try {
      console.log("Starting connection...");
      this.connection.serverTimeoutInMilliseconds = 100000;
      await this.connection.start();
      console.log("Connection established.");
      this.setupConnection();
    } catch (error) {
      console.error('Error while establishing connection:', error);
      this.handleDisconnect();
    } finally {
      this.reconnecting = false;
    }
  }

  private signalRConnector() {
    setInterval(() => {
      if (!this.isConnected()) {
        setTimeout(() => {
          window.location.reload();
        }, 5000);

        this.startConnection();
      }
    }, 5000);
  }

  private isConnected(): boolean {
    return this.connection != null && this.connection.state === HubConnectionState.Connected;
  }

  private setupConnection() {
    this.connectionEstablishedSubject.next(true);
    this.isServerConnectedSubject.next(true);
    localStorage.setItem('isServerConnected', 'true');

    this.setupEventListeners();
  }

  private setupEventListeners() {
    
    this.connection.on("OnSurveyCount", count => {
      this.surveyCountNofitication.emit(count)
    });

    this.connection.on("OnWellboreProcessState", wellState => {
      this.wellboreProcessState.emit(wellState)
    });

    this.connection.on("SystemSummaryInformation", (wellboreId: string, value: any) => {
      const obj = {
        wellboreId,
        value
      };
      this.wellboreSurveysCounts.emit(obj);
    });
    this.connection.on("OnSurveysUpdated",wellId =>{
      this.showNotification('success', 'MSA Updated for '+ wellId, '')
      console.log('OnSurveysUpdated : -',wellId);
    });
  }

  showNotification(status:"success" | "info" | "warning" | "error" | "blank", title:string, subtitle:string){
    this._message.add({
    severity: status,
    summary: title,
    detail: subtitle
  });
  }
  
}
