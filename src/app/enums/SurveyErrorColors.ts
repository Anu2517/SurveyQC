import { SurveyError } from "./SurveyError";

export const SurveyErrorColors: { [key in SurveyError]: string } = {
  [SurveyError.NA]: "rgba(96, 96, 96, 0.8)",
  [SurveyError.MandatoryValuesMissing]: "rgba(180, 60, 60, 0.8)",
  [SurveyError.InclinationQCFailure]: "rgba(215, 130, 60, 0.8)",
  [SurveyError.AzimuthQCFailure]: "rgba(180, 140, 60, 0.8)",
  [SurveyError.GtotalFailure]: "rgba(80, 140, 170, 0.8)",
  [SurveyError.BtotalFailure]: "rgba(100, 80, 160, 0.8)",
  [SurveyError.DipFailure]: "rgba(140, 60, 180, 0.8)",
  [SurveyError.GravityRangeFailure]: "rgba(170, 60, 140, 0.8)",
  [SurveyError.GravityReferenceRangeFailure]: "rgba(190, 60, 120, 0.8)",
  [SurveyError.MagneticRangeFailure]: "rgba(140, 40, 60, 0.8)",
  [SurveyError.MagneticReferenceRangeFailure]: "rgba(130, 80, 60, 0.8)",
  [SurveyError.BGGMMagTotalFieldReferenceFailure]: "rgba(150, 80, 80, 0.8)",
  [SurveyError.BGGMMagDipAngleReferenceFailure]: "rgba(170, 100, 70, 0.8)",
  [SurveyError.BGGMMagDeclFailure]: "rgba(170, 100, 100, 0.8)"
};
