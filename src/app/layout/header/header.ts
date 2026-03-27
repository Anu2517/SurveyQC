import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonService } from '../../services/common-service';
import { CommunicationService } from '../../services/communication-service';
import { SignalrService } from '../../services/signalr-service';
import { LoggerService } from '../../services/logger.service';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Checkbox, CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { finalize, take } from 'rxjs';
import { EmailConfiguration } from '../../models/WellBore/EmailConfiguration';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { PasswordModule } from 'primeng/password';
import { PopoverModule } from 'primeng/popover';
import { WitsmlConnection } from '../../models/WellBore/WitsmlConnection';
import { Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { FacLimit } from '../../models/WellBore/FacLimit';
import { ToastModule } from 'primeng/toast';
import { ProcessConfiguration } from '../../models/WellBore/ProcessConfiguration';
import { InputGroupModule } from 'primeng/inputgroup';
import { SelectModule } from 'primeng/select';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const DEFAULT_WITSML_TIMEOUT = 60000;

@Component({
  selector: 'app-header',
  imports: [CommonModule,
    FormsModule,
    Checkbox,
    ButtonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    PasswordModule,
    PopoverModule,
    CheckboxModule,
    TooltipModule,
    ToastModule,
    InputGroupModule,
    SelectModule
  ],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit {
  public commonService = inject(CommonService);
  private communicationService = inject(CommunicationService);
  private signalrService = inject(SignalrService);
  private message = inject(MessageService);
  private logger = inject(LoggerService);
  public environment = environment;
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  public surveyQueue: number = 0;
  public showAdvancedSettings = signal<boolean>(false);
  public isWitsmlConnectionActive: boolean = false;
  public witsmlConnection!: WitsmlConnection;
  public facLimitsForm!: FormGroup;
  public processConfigForm!: FormGroup;
  private originalProcessConfigData!: ProcessConfiguration;
  public originalFacLimitsData: any;

  public layoutOptions = [
    { label: 'Card', value: 'Card' },
    { label: 'Grid', value: 'Grid' },
    { label: 'Map', value: 'Map' }
  ];

  public ngOnInit(): void {
    this.updateEmailConfigForm();
    this.checkWitsmlConnectionStatus();
    this.loadFacLimitsForm();
    this.updateFacLimitsData();
    this.loadProcessConfigForm();
    this.loadProcessConfigurationData();
    // Subscribe once to survey count stream; never re-subscribe on WITSML reconnect
    this.updateSurveyCount();

    this.commonService.emitWitsmlStatus
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: boolean) => {
        if (data) {
          this.getSurveyQueue();
        }
      });
  }

  getSurveyQueue(): void {
    this.communicationService.getSurveyQueue().pipe(take(1)).subscribe((data: number) => {
      this.surveyQueue = data;
    });
  }

  updateSurveyCount(): void {
    this.signalrService.surveyCountNofitication
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: number) => {
        this.surveyQueue = data;
      });
  }

  updateSidebar() {
    this.commonService.isSidebarCollapsed = !this.commonService.isSidebarCollapsed
  }

  showNotification(type: 'success' | 'error', title: string, message: string): void {
    this.message.add({
      severity: type,
      summary: title,
      detail: message
    });
  }

  public witsmlAuthForm = this.fb.group({
    url: ['', [Validators.required, Validators.pattern(/^(http|https):\/\/[^ "]+$/)]],
    userName: ['', Validators.required],
    password: ['', Validators.required],
    timeout: [DEFAULT_WITSML_TIMEOUT, Validators.required],
    version: [1, Validators.required],
    acceptInvalidCertificate: [false],
    proxyAddress: [''],
    proxyPort: [0, Validators.min(0)],
    proxyUserName: [''],
    proxyPassword: [''],
    preAuthenticate: [false],
    isAuthenticationBasic: [false],
  });

  public emailConfigForm = this.fb.group({
    from: ['', [Validators.required, Validators.email]],
    smtpServer: ['', Validators.required],
    port: [0, Validators.required],
    userName: ['', Validators.required],
    password: ['', Validators.required],
  });

  updateEmailConfigForm(): void {
    this.communicationService.getEmailConfiguration()
      .pipe(take(1))
      .subscribe({
        next: (data: EmailConfiguration) => {
          if (!data) return;

          this.emailConfigForm.patchValue({
            from: data.from,
            smtpServer: data.smtpServer,
            port: data.port,
            userName: data.userName,
            password: data.password
          });

          this.emailConfigForm.markAsPristine();
          this.emailConfigForm.updateValueAndValidity();
        },
        error: (err) => {
          this.logger.error('Failed to load email config', err);
        }
      });
  }

  submitEmailConfigForm(): void {

  if (this.emailConfigForm.invalid) {
    this.emailConfigForm.markAllAsTouched();
    return;
  }

  showLoader(true, 'Updating Email Configuration');

  this.communicationService
    .updateEmailConfiguration(this.emailConfigForm.getRawValue() as EmailConfiguration)
    .pipe(
      finalize(() => showLoader(false))
    )
    .subscribe({
      next: () => {
        this.emailConfigForm.markAsPristine();
        this.showNotification("success", 'Email configuration updated', '');
      },
      error: () => {
        this.showNotification("error", 'Email configuration failed to update', '');
      }
    });
}

  toggleAdvancedSettings() {
    this.showAdvancedSettings.update(value => !value);
  }

  getWitsmlConnectionStatus(): void {
    this.communicationService.getWitsmlConnection()
      .pipe(take(1))
      .subscribe((data: WitsmlConnection) => {
        this.witsmlConnection = data;
        this.setFormData(data);
      });
  }

  private buildWitsmlPayload() {
    const formValues = { ...this.witsmlAuthForm.value };

    return {
      Id: this.witsmlConnection?.id || this.commonService.randomUUID(),
      URL: formValues.url,
      Username: formValues.userName,
      Password: formValues.password,
      Timeout: formValues.timeout,
      Version: formValues.version,
      AcceptInvalidCertificate: formValues.acceptInvalidCertificate,
      IsAuthenticationBasic: formValues.isAuthenticationBasic,
      PreAuthenticate: formValues.preAuthenticate,
      JsonWebToken: null,
      Proxy: {
        ProxyAddress: formValues.proxyAddress,
        ProxyPort: formValues.proxyPort,
        ProxyUserName: formValues.proxyUserName,
        ProxyPassword: formValues.proxyPassword,
      },
    };
  }

  setFormData(data: WitsmlConnection): void {
    if (!data) return;

    this.witsmlAuthForm.patchValue({
      url: data.url ?? '',
      userName: data.username ?? '',
      password: data.password ?? '',
      timeout: data.timeout ?? DEFAULT_WITSML_TIMEOUT,
      version: data.version ?? 1,
      acceptInvalidCertificate: data.acceptInvalidCertificate ?? false,
      proxyAddress: data.proxyAddress ?? '',
      proxyPort: data.proxyPort ?? 0,
      proxyUserName: data.proxyUserName ?? '',
      proxyPassword: data.proxyPassword ?? '',
      preAuthenticate: data.preAuthenticate ?? false,
      isAuthenticationBasic: data.isAuthenticationBasic ?? false,
    });

    this.witsmlAuthForm.markAsPristine();
    this.witsmlAuthForm.markAsUntouched();
  }

  checkWitsmlConnectionStatus(): void {
    this.communicationService.isWitsmlConnectionValid()
      .pipe(take(1))
      .subscribe({
        next: (data: boolean) => {
          this.commonService.emitWitsmlStatus.next(data);
          if (data) {
            this.isWitsmlConnectionActive = data;
            this.getWitsmlConnectionStatus();
          }
        },
        error: () => {
          this.commonService.emitWitsmlStatus.next(false);
        }
      });
  }

  submitForm(): void {
    if (this.witsmlAuthForm.invalid) {
      this.witsmlAuthForm.markAllAsTouched();
      this.showNotification('error', 'Validation Error', 'Please fill out the form correctly.');
      return;
    }

    showLoader(true, 'Processing WITSML Configuration...');

    this.communicationService
      .updateWitsmlConnection(this.buildWitsmlPayload())
      .pipe(finalize(() => showLoader(false)))
      .subscribe({
        next: (response: boolean) => {
          if (response) {
            this.commonService.emitWitsmlStatus.next(true);
            this.showNotification('success', 'Success', 'WITSML connection updated successfully!');
          }
        },
        error: () => {
          this.showNotification('error', 'Error', 'Failed to update WITSML connection. Please try again.');
        }
      });
  }

  testConnection(): void {
    if (this.witsmlAuthForm.invalid) {
      this.witsmlAuthForm.markAllAsTouched();
      this.showNotification('error', 'Validation Error', 'Please fill out the form correctly.');
      return;
    }

    showLoader(true, 'Verifying WITSML Configuration...');

    this.communicationService
      .testWitsmlConnection(this.buildWitsmlPayload())
      .pipe(finalize(() => showLoader(false)))
      .subscribe({
        next: (response: boolean) => {
          if (response) {
            this.showNotification('success', 'Connection Successful', 'WITSML connection tested successfully!');
          } else {
            this.showNotification('error', 'Connection Failed', 'Unable to establish a WITSML connection. Please check your inputs.');
          }
        },
        error: (error) => {
          this.logger.error('API error:', error);
          this.showNotification('error', 'Error', 'An error occurred while testing the WITSML connection.');
        }
      });
  }

  resetForm(): void {
    this.witsmlAuthForm.reset();
    this.setFormData(this.witsmlConnection);
    this.witsmlAuthForm.markAsPristine();
    this.witsmlAuthForm.markAsUntouched();
  }

  routeToVendorCharts(): void {
    this.router.navigateByUrl('vendors-charts')
  }

  routeToErrorSummary() {
    this.router.navigate(['error-summary']);
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    if (!/[0-9.]/.test(event.key)) {
      event.preventDefault();
    }
  }

  loadFacLimitsForm(): void {
    this.facLimitsForm = this.fb.group({
      azimuthQCLimits: [0.1, Validators.required],
      inclinationQCLimits: [0.1, Validators.required],
      bTotalQCLimits: [0.1, Validators.required],
      gTotalQCLimits: [0.1, Validators.required],
      dipQCLimits: [0.1, Validators.required],
    });
  }

  updateFacLimitsData(): void {
    this.communicationService.getFacLimits().subscribe({
      next: (data: FacLimit) => {
        if (!data) {
          return;
        }

        this.commonService.facConfiguration = data;

        const thresholds = this.mapToThresholds(data);
        this.facLimitsForm.patchValue(thresholds, { emitEvent: false });
        this.createOriginalCopyOfFACLimits(data);
        this.facLimitsForm.markAsPristine();
      },
      error: (err) => {
        this.logger.error('Failed to fetch FAC Limits:', err);
      }
    });
  }

  private mapToThresholds(data: FacLimit) {
    return {
      azimuthQCLimits: data.azimuthQCLimits?.threshold ?? 0,
      inclinationQCLimits: data.inclinationQCLimits?.threshold ?? 0,
      bTotalQCLimits: data.bTotalQCLimits?.threshold ?? 0,
      gTotalQCLimits: data.gTotalQCLimits?.threshold ?? 0,
      dipQCLimits: data.dipQCLimits?.threshold ?? 0,
    };
  }

  createOriginalCopyOfFACLimits(data: FacLimit): void {
    this.originalFacLimitsData = this.mapToThresholds(data);
  }

  submitFacLimits(): void {
    showLoader(true, 'Updating FAC Limits');

    const values = this.facLimitsForm.value as {
      azimuthQCLimits: number;
      inclinationQCLimits: number;
      bTotalQCLimits: number;
      gTotalQCLimits: number;
      dipQCLimits: number;
    };

    const updatedFacLimits: FacLimit = {
      ...this.commonService.facConfiguration,
      azimuthQCLimits: {
        ...this.commonService.facConfiguration.azimuthQCLimits,
        threshold: values.azimuthQCLimits
      },
      inclinationQCLimits: {
        ...this.commonService.facConfiguration.inclinationQCLimits,
        threshold: values.inclinationQCLimits
      },
      bTotalQCLimits: {
        ...this.commonService.facConfiguration.bTotalQCLimits,
        threshold: values.bTotalQCLimits
      },
      gTotalQCLimits: {
        ...this.commonService.facConfiguration.gTotalQCLimits,
        threshold: values.gTotalQCLimits
      },
      dipQCLimits: {
        ...this.commonService.facConfiguration.dipQCLimits,
        threshold: values.dipQCLimits
      },
    };

    this.communicationService.updateFacLimits(updatedFacLimits)
    .pipe(finalize(() => showLoader(false)))
      .subscribe({
        next: () => {
          this.showNotification('success', 'FAC Limits updated', '');
          this.createOriginalCopyOfFACLimits(updatedFacLimits);
          this.facLimitsForm.markAsPristine();
        },
        error: (err) => {
          this.logger.error('FAC Limits update failed:', err);
          this.showNotification('error', 'FAC Limits failed to update', '');
        }
      });

    this.facLimitsForm.updateValueAndValidity();
  }

  resetfacLimitsForm(): void {
    this.updateFacLimitsData();
    this.facLimitsForm.markAsDirty();
  }


  loadProcessConfigForm(): void {
    this.processConfigForm = this.fb.group({

      autoRejectSurveys: [false],
      allowAllWellbores: [false],
      autoApproveMissingGBSurveys: [false],

      usedDeclinationReference: this.fb.group({
        checkThreshold: [false],
        threshold: [0, Validators.required],
        unit: ['dega']
      }),

      usedMagneticReference: this.fb.group({
        checkThreshold: [false],
        threshold: [0, Validators.required],
        unit: ['nT']
      }),

      usedDipReference: this.fb.group({
        checkThreshold: [false],
        threshold: [0, Validators.required],
        unit: ['dega']
      }),

      surveyResolutionDepth: this.fb.group({
        checkThreshold: [false],
        threshold: [0, Validators.required],
        unit: ['ft']
      }),

      checkGravityRange: this.fb.group({
        checkRangeLimits: [false],
        lowLimit: [0, Validators.required],
        highLimit: [0, Validators.required],
        unit: ['g']
      }),

      checkGravityReferenceRange: this.fb.group({
        checkRangeLimits: [false],
        lowLimit: [0, Validators.required],
        highLimit: [0, Validators.required],
        unit: ['g']
      }),

      checkMagneticRange: this.fb.group({
        checkRangeLimits: [false],
        lowLimit: [0, Validators.required],
        highLimit: [0, Validators.required],
        unit: ['nT']
      }),

      checkMagneticReferenceRange: this.fb.group({
        checkRangeLimits: [false],
        lowLimit: [0, Validators.required],
        highLimit: [0, Validators.required],
        unit: ['nT']
      })

    });
  }

  private loadProcessConfigurationData(): void {
    this.communicationService.getProcessConfiguration()
      .subscribe({
        next: (data: ProcessConfiguration) => {
          if (!data) return;

          this.processConfigForm.patchValue(data);
          this.processConfigForm.markAsPristine();
        },
        error: (err) => {
          this.logger.error('Failed to load process configuration', err);
        }
      });
  }

  submitProcessConfigForm(): void {
    if (this.processConfigForm.invalid) {
      this.processConfigForm.markAllAsTouched();
      return;
    }

    const payload: ProcessConfiguration = this.processConfigForm.value;

    this.communicationService.updateProcessConfiguration(payload)
      .subscribe({
        next: () => {
          this.showNotification('success', 'Process configuration updated', '');
        },
        error: () => {
          this.showNotification('error', 'Update failed', '');
        }
      });
  }

  private createOriginalCopyOfProcessConfig(data: ProcessConfiguration): void {
    this.originalProcessConfigData = JSON.parse(JSON.stringify(data));
  }

  resetProcessConfigForm(): void {
    if (!this.originalProcessConfigData) return;

    this.processConfigForm.reset();
    this.processConfigForm.patchValue(this.originalProcessConfigData);
    this.processConfigForm.markAsPristine();
  }


  onLayoutChange(layout: string): void {
    this.commonService.selectedDashboardLayout = layout;
    this.commonService.applyFilters(true);
    if (layout === 'Map') {
    }
  }

}
