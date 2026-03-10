import { Component, DestroyRef, inject, ViewEncapsulation } from '@angular/core';
import { CommonService } from '../../services/common-service';
import { CommunicationService } from '../../services/communication-service';
import { SignalrService } from '../../services/signalr-service';
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
import { WitsmlConnection } from '../../models/WellBore/WitsmlConnection ';
import { Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { FacLimit } from '../../models/WellBore/FacLimit';
import { ToastModule } from 'primeng/toast';
import { ProcessConfiguration } from '../../models/WellBore/ProcessConfiguration';
import { InputGroupModule } from 'primeng/inputgroup';
import { SelectModule } from 'primeng/select';

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
  styleUrl: './header.css',
  encapsulation: ViewEncapsulation.None
})
export class Header {
  public _commonService = inject(CommonService);
  public _communicationService = inject(CommunicationService);
  private _signalrService = inject(SignalrService);
  private _message = inject(MessageService);
  public environment = environment;
  private _router = inject(Router);
  private fb = inject(FormBuilder);

  public surveyQueue: number = 0;
  public isEmailConfigurationDropdownVisible: boolean = false;
  public showAdvancedSettings: boolean = false;
  public isWitsmlDropdownVisible: boolean = false;
  public isWitsmlConnectionActive: boolean = false;
  public witsmlConnection!: WitsmlConnection;
  public facLimitsForm!: FormGroup;
  public processConfigForm!: FormGroup;
  private originalProcessConfigData!: ProcessConfiguration;
  public originalFacLimitsData: any;
  public isFacLimitsDropdownVisible: boolean = false;

  public layoutOptions = [
    { label: 'Card', value: 'Card' },
    { label: 'Grid', value: 'Grid' },
    { label: 'Map', value: 'Map' }
  ];

  public ngOnInit(): void {
    this.updateEmailConfigForm()
    this.checkWitsmlConnectionStatus()
    this.loadFacLimitsForm()
    this.updateFacLimitsData()
    this.loadProcessConfigForm()
    this.loadProcessConfigurationData();

    this._commonService.emitWitsmlStatus.subscribe((data: boolean) => {
      if (data) {
        this.getSurveyQueue()
        this.updateSurveyCount()
      }
    })

  }

  getSurveyQueue() {
    this._communicationService.getSurveyQueue().subscribe((data: number) => {
      this.surveyQueue = data
    })
  }

  updateSurveyCount() {
    this._signalrService.surveyCountNofitication.subscribe((data: number) => {
      this.surveyQueue = data
    })
  }

  updateSidebar() {
    this._commonService.isSidebarCollapsed = !this._commonService.isSidebarCollapsed
  }

  showNotification(type: 'success' | 'error', title: string, message: string): void {
    this._message.add({
      severity: type,
      summary: title,
      detail: message
    });
  }

  public witsmlAuthForm = this.fb.group({
    url: ['', [Validators.required, Validators.pattern(/^(http|https):\/\/[^ "]+$/)]],
    userName: ['', Validators.required],
    password: ['', Validators.required],
    timeout: [60000, Validators.required],
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
    this.isEmailConfigurationDropdownVisible = false;
    this._communicationService.getEmailConfiguration()
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
          console.error('Failed to load email config', err);
        }
      });
  }

  submitEmailConfigForm(): void {

    if (this.emailConfigForm.invalid) {
      this.emailConfigForm.markAllAsTouched();
      return;
    }

    this.isEmailConfigurationDropdownVisible = false;
    // showLoader(true, 'Updating Email Configuration');

    this._communicationService
      .updateEmailConfiguration(this.emailConfigForm.value)
      .pipe(
      // finalize(() => showLoader(false))
    )
      .subscribe({
        next: () => {
          this.emailConfigForm.markAsPristine();
          // this.facLimitsForm.updateValueAndValidity();
          this.showNotification("success", 'Email configuration updated', '');
        },
        error: () => {
          this.showNotification("error", 'Email configuration failed to update', '');
        }
      });
  }

  toggleAdvancedSettings() {
    this.showAdvancedSettings = !this.showAdvancedSettings;
  }

  getWitsmlConnectionStatus() {
    this._communicationService.getWitsmlConnection().subscribe((data: WitsmlConnection) => {
      this.witsmlConnection = data
      this.setFormData(data)

    })
  }

  private buildWitsmlPayload() {
    const formValues = { ...this.witsmlAuthForm.value };

    return {
      Id: this.witsmlConnection?.id || this._commonService.randomUUID(),
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
      timeout: data.timeout ?? 60000,
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

  checkWitsmlConnectionStatus() {
    // showLoader(true, 'Validating WITSML Configuration...')
    this._communicationService.isWitsmlConnectionValid().subscribe(
      (data: boolean) => {
        this._commonService.emitWitsmlStatus.emit(data);
        if (data) {
          this.isWitsmlConnectionActive = data;
          this.getWitsmlConnectionStatus();
          // showLoader(false);
        }
      },
      (err) => {
        // showLoader(false);
        this._commonService.emitWitsmlStatus.emit(false);
      }
    );
  }

  submitForm(): void {
    this.isWitsmlDropdownVisible = false;

    if (this.witsmlAuthForm.invalid) {
      this.witsmlAuthForm.markAllAsTouched();
      this.showNotification('error', 'Validation Error', 'Please fill out the form correctly.');
      return;
    }

    // showLoader(true, 'Processing WITSML Configuration...');

    this._communicationService
      .updateWitsmlConnection(this.buildWitsmlPayload())
      // .pipe(finalize(() => showLoader(false)))
      .subscribe({
        next: (response: boolean) => {
          if (response) {
            this._commonService.emitWitsmlStatus.emit(true);
            this.showNotification('success', 'Success', 'WITSML connection updated successfully!');
          }
        },
        error: () => {
          this.showNotification('error', 'Error', 'Failed to update WITSML connection. Please try again.');
        }
      });
  }

  testConnection(): void {
    this.isWitsmlDropdownVisible = false;

    if (this.witsmlAuthForm.invalid) {
      this.witsmlAuthForm.markAllAsTouched();
      this.showNotification('error', 'Validation Error', 'Please fill out the form correctly.');
      return;
    }

    // showLoader(true, 'Verifying WITSML Configuration...');

    this._communicationService
      .testWitsmlConnection(this.buildWitsmlPayload())
      // .pipe(finalize(() => showLoader(false)))
      .subscribe({
        next: (response: boolean) => {
          if (response) {
            this.showNotification('success', 'Connection Successful', 'WITSML connection tested successfully!');
          } else {
            this.showNotification('error', 'Connection Failed', 'Unable to establish a WITSML connection. Please check your inputs.');
          }
        },
        error: (error) => {
          console.error('API error:', error);
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
    this._router.navigateByUrl('vendors-charts')
  }

  routeToErrorSummary() {
    this._router.navigate(['error-summary']);
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const pattern = /[0-9.]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
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
    this._communicationService.getFacLimits().subscribe({
      next: (data: FacLimit) => {
        if (!data) {
          return;
        }

        this._commonService.facConfiguration = data;

        const thresholds = this.mapToThresholds(data);
        this.facLimitsForm.patchValue(thresholds, { emitEvent: false });
        this.createOriginalCopyOfFACLimits(data);
        this.facLimitsForm.markAsPristine();
      },
      error: (err) => {
        console.error('Failed to fetch FAC Limits:', err);
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
    this.isFacLimitsDropdownVisible = false;

    const values = this.facLimitsForm.value as {
      azimuthQCLimits: number;
      inclinationQCLimits: number;
      bTotalQCLimits: number;
      gTotalQCLimits: number;
      dipQCLimits: number;
    };

    const updatedFacLimits: FacLimit = {
      ...this._commonService.facConfiguration,
      azimuthQCLimits: {
        ...this._commonService.facConfiguration.azimuthQCLimits,
        threshold: values.azimuthQCLimits
      },
      inclinationQCLimits: {
        ...this._commonService.facConfiguration.inclinationQCLimits,
        threshold: values.inclinationQCLimits
      },
      bTotalQCLimits: {
        ...this._commonService.facConfiguration.bTotalQCLimits,
        threshold: values.bTotalQCLimits
      },
      gTotalQCLimits: {
        ...this._commonService.facConfiguration.gTotalQCLimits,
        threshold: values.gTotalQCLimits
      },
      dipQCLimits: {
        ...this._commonService.facConfiguration.dipQCLimits,
        threshold: values.dipQCLimits
      },
    };

    this._communicationService.updateFacLimits(updatedFacLimits)
      .subscribe({
        next: () => {
          this.showNotification('success', 'FAC Limits updated', '');
          this.createOriginalCopyOfFACLimits(updatedFacLimits);
          this.facLimitsForm.markAsPristine();
        },
        error: (err) => {
          console.error('FAC Limits update failed:', err);
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
    this._communicationService.getProcessConfiguration()
      .subscribe({
        next: (data: ProcessConfiguration) => {
          if (!data) return;

          this.processConfigForm.patchValue(data);
          this.processConfigForm.markAsPristine();
        },
        error: (err) => {
          console.error('Failed to load process configuration', err);
        }
      });
  }

  submitProcessConfiguration(): void {
    if (this.processConfigForm.invalid) {
      this.processConfigForm.markAllAsTouched();
      return;
    }

    const payload: ProcessConfiguration =
      this.processConfigForm.value as ProcessConfiguration;

    this._communicationService
      .updateProcessConfiguration(payload)
      .subscribe({
        next: () => {
          this.showNotification('success', 'Process configuration updated', '');
          this.processConfigForm.markAsPristine();
        },
        error: () => {
          this.showNotification('error', 'Failed to update process configuration', '');
        }
      });
  }

  submitProcessConfigForm(): void {
    if (this.processConfigForm.invalid) {
      this.processConfigForm.markAllAsTouched();
      return;
    }

    const payload: ProcessConfiguration = this.processConfigForm.value;

    this._communicationService.updateProcessConfiguration(payload)
      .subscribe({
        next: () => {
          this.showNotification('success', 'Process configuration updated', '');
        },
        error: () => {
          this.showNotification('error', 'Update failed', '');
        }
      });
  }

  updateProcessConfigForm(): void {
    this._communicationService
      .getProcessConfiguration()
      .subscribe({
        next: (data: ProcessConfiguration) => {
          if (!data) return;

          this._commonService.processConfigData = data;

          this.processConfigForm.patchValue({

            autoRejectSurveys: data.autoRejectSurveys,
            allowAllWellbores: data.allowAllWellbores,
            autoApproveMissingGBSurveys: data.autoApproveMissingGBSurveys,

            usedDeclinationReference: {
              checkThreshold: data.usedDeclinationReference?.checkThreshold ?? false,
              threshold: data.usedDeclinationReference?.threshold ?? 0,
              unit: data.usedDeclinationReference?.unit ?? 'dega'
            },

            usedMagneticReference: {
              checkThreshold: data.usedMagneticReference?.checkThreshold ?? false,
              threshold: data.usedMagneticReference?.threshold ?? 0,
              unit: data.usedMagneticReference?.unit ?? 'nT'
            },

            usedDipReference: {
              checkThreshold: data.usedDipReference?.checkThreshold ?? false,
              threshold: data.usedDipReference?.threshold ?? 0,
              unit: data.usedDipReference?.unit ?? 'dega'
            },

            surveyResolutionDepth: {
              checkThreshold: data.surveyResolutionDepth?.checkThreshold ?? false,
              threshold: data.surveyResolutionDepth?.threshold ?? 0,
              unit: data.surveyResolutionDepth?.unit ?? 'ft'
            },

            checkGravityRange: {
              checkRangeLimits: data.checkGravityRange?.checkRangeLimits ?? false,
              lowLimit: data.checkGravityRange?.lowLimit ?? 0,
              highLimit: data.checkGravityRange?.highLimit ?? 0,
              unit: data.checkGravityRange?.unit ?? 'g'
            },

            checkGravityReferenceRange: {
              checkRangeLimits: data.checkGravityReferenceRange?.checkRangeLimits ?? false,
              lowLimit: data.checkGravityReferenceRange?.lowLimit ?? 0,
              highLimit: data.checkGravityReferenceRange?.highLimit ?? 0,
              unit: data.checkGravityReferenceRange?.unit ?? 'g'
            },

            checkMagneticRange: {
              checkRangeLimits: data.checkMagneticRange?.checkRangeLimits ?? false,
              lowLimit: data.checkMagneticRange?.lowLimit ?? 0,
              highLimit: data.checkMagneticRange?.highLimit ?? 0,
              unit: data.checkMagneticRange?.unit ?? 'nT'
            },

            checkMagneticReferenceRange: {
              checkRangeLimits: data.checkMagneticReferenceRange?.checkRangeLimits ?? false,
              lowLimit: data.checkMagneticReferenceRange?.lowLimit ?? 0,
              highLimit: data.checkMagneticReferenceRange?.highLimit ?? 0,
              unit: data.checkMagneticReferenceRange?.unit ?? 'nT'
            }

          });

          this.createOriginalCopyOfProcessConfig(data);

          this.processConfigForm.markAsPristine();
          this.processConfigForm.updateValueAndValidity();
        },
        error: (err) => {
          console.error('Failed to load process configuration', err);
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
    this._commonService.selectedDashboardLayout = layout;
    this._commonService.applyFilters(true);
    if (layout === 'Map') {
    }
  }

}
