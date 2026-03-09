export interface ProcessConfiguration {
  autoRejectSurveys: boolean
  allowAllWellbores:boolean
  autoApproveMissingGBSurveys:boolean
  usedDeclinationReference: UsedDeclinationReference
  usedMagneticReference: UsedMagneticReference
  usedDipReference: UsedDipReference
  surveyResolutionDepth: SurveyResolutionDepth
  checkGravityRange: CheckGravityRange
  checkGravityReferenceRange: CheckGravityReferenceRange
  checkMagneticRange: CheckMagneticRange
  checkMagneticReferenceRange: CheckMagneticReferenceRange
}


export interface UsedDeclinationReference {
  checkThreshold: boolean
  threshold: number
  unit: string
}

export interface UsedMagneticReference{
  checkThreshold: boolean
  threshold: number
  unit: string
}

export interface UsedDipReference {
  checkThreshold: boolean
  threshold: number
  unit: string
}

export interface SurveyResolutionDepth {
  checkThreshold: boolean
  threshold: number
  unit: string
}

export interface CheckGravityRange {
  checkRangeLimits: boolean
  lowLimit: number
  highLimit: number
  unit: string
}

export interface CheckGravityReferenceRange {
  checkRangeLimits: boolean
  lowLimit: number
  highLimit: number
  unit: string
}

export interface CheckMagneticRange {
  checkRangeLimits: boolean
  lowLimit: number
  highLimit: number
  unit: string
}

export interface CheckMagneticReferenceRange {
  checkRangeLimits: boolean
  lowLimit: number
  highLimit: number
  unit: string
}
