import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Centralized logging service for the application.
 * In production, logs can be sent to a remote logging service.
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  
  private isProduction = environment.envMode === 'production';
  private isLogEnabled = environment.isLogEnabled;

  /**
   * Log informational messages
   */
  info(message: string, ...args: any[]): void {
    if (this.isLogEnabled && !this.isProduction) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, ...args: any[]): void {
    if (this.isLogEnabled && !this.isProduction) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * Log error messages
   */
  error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args);
    // In production, send to remote logging service (e.g., AppInsights, Sentry)
    if (this.isProduction) {
      // TODO: Implement remote error logging
      this.sendToRemoteLogger('error', message, args);
    }
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, ...args: any[]): void {
    if (this.isLogEnabled && !this.isProduction) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Send logs to remote logging service
   */
  private sendToRemoteLogger(level: string, message: string, args: any[]): void {
    // TODO: Implement integration with Application Insights or similar
    // Example: this.appInsights.trackException({ message, properties: { level, args } });
  }
}
