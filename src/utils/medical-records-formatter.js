import {
  format,
  addDays,
  addMonths,
  differenceInDays,
} from 'date-fns';

export const getRecords = (records, type, subtype) => {
  if (!records?.length) return [];
  const exp = r => r.type === type && (!subtype || r.subtype === subtype);
  return records.filter(exp);
};

export const calcBMI = (w, h) => {
  if (typeof w !== 'number') return;
  if (typeof h !== 'number') return;
  const weight = parseInt(w);
  const height = parseInt(h);
  let final;
  if (weight && height) {
    const bmi = (weight / (height * height)) * 10000;
    final = Math.round(bmi * 100) / 100;
  }
  return final;
};

export const getLbUtil = (w) => {
  const LB_PER_KG = 2.2046;
  if (!w) return;
  return +(w * LB_PER_KG).toFixed(2);
};

export const getFtUtil = (h) => {
  const FT_PER_CM = 0.032808;
  if (!h) return;
  return +(h * FT_PER_CM).toFixed(2);
};

export const computeEdcByDate = (date) => {
  if (!date) return '--';
  return format(addDays(addMonths(date, 9), 7), 'MM/DD/YY');
};

export const computeAOGUsingLMP = (date, createdAt) => {
  if (!date) return '--';

  if (!createdAt) createdAt = Date.now();

  const totalDiffDays = differenceInDays(createdAt, date);
  const weeks = Math.floor(totalDiffDays / 7);
  const remainderDays = totalDiffDays % 7;

  if (weeks < 1) {
    const desc = remainderDays === 1 ? 'day' : 'days';
    return `${remainderDays} ${desc}`;
  }

  return `${weeks} w, ${remainderDays} d`;
};

export const computeEDCUsingUS = (date, aog) => {
  if (!date || !aog) return '--';
  const days = 280 - aog;
  return format(addDays(date, days), 'MM/DD/YY');
};

export const recordsFieldFormatter = (records, options) => {
  const { field, type, subtype, joinerToken = ', ' } = options;
  const results = getRecords(records, type, subtype);
  if (!results?.length) return '';
  return results.map(record => record[field]).filter(Boolean).join(joinerToken);
};

export const formatSocialHistory = (record) => {
  const results = [];
  if (!record) return null;
  if (record.exercises) results.push('Exercising');
  if (record.drinksAlcohol) results.push('Drinking Alcohol');
  if (record.smoking) {
    let i = 'Smoking';
    if (record.smokingSticksPerDay) {
      i = `${i} (${record.smokingSticksPerDay} sticks per day)`;
    }
    if (record.smokingYears) {
      i = `${i} (${record.smokingYears} years of smoking)`;
    }
    results.push(i);
  }
  if (record.usesProhibitedDrugs) {
    let i = 'Uses prohibited drugs';
    if (record.drugName) {
      i = `${i} (${record.drugName})`;
    }
    if (record.drugLastUsedAt) {
      i = `${i} (Last used: ${format(record.drugLastUsedAt, 'MM/DD/YY')})`;
    }
    results.push(i);
  }
  if (record.sexuallyActive) {
    let i = 'Sexually active';
    if (record.numOfSexualPartners) {
      i = `${i} (No. of partners: ${record.numOfSexualPartners})`;
    }
    results.push(i);
  }
  if (record.educationalLevel) results.push(`Educational Level: ${record.educationalLevel}`);
  if (record.others) results.push(`Others: ${record.others}`);

  return results.join(' ');
};

export const formatSocialHxPackYears = (record) => {
  if (!record) return null;
  if (!record.smoking) return null;
  if (!record.smokingSticksPerDay && !record.smokingYears) return null;
  const sticks = record.smokingSticksPerDay;
  const years = record.smokingYears;
  const total = (+sticks / 20) * +years;
  return `${total} pack/year`;
};

export const formatBirthHistory = (record) => {
  const restuls = [];
  if (!record) return null;
  if (record.deliveredAt) restuls.push(`${format(record.deliveredAt, 'MM/DD/YY')}`);
  if (record.methodOfDelivery) restuls.push(`${record.methodOfDelivery}`);
  if (record.attendedBy) restuls.push(`${record.attendedBy}`);
  if (record.complications) restuls.push(`${record.complications}`);
  if (record.notes) restuls.push(`${record.notes}`);

  return restuls.join(' ');
};

export const formatGynecologicHistory = (record) => {
  const results = [];
  if (!record) return null;
  if (record.prevCervicSmearsDate) results.push(`Previous Cervix Smears Date: ${format(record.prevCervicSmearsDate, 'MM/DD/YY')}`);
  if (record.prevCervicSmearsResult) results.push(`Previous Cervix Smears Result: ${record.prevCervicSmearsResult}`);
  if (record.prevProblemsTreatments) results.push(`Previous Problems/Treatments: ${record.prevProblemsTreatments}`);
  if (record.currentContraception) results.push(`Current Contraception: ${record.currentContraception}`);
  if (record.notes) results.push(`Notes: ${record.notes}`);

  return results.join(' ');
};

export const formatHospitalizationHistory = (record) => {
  const results = [];
  if (!record) return null;
  if (record.hospitalizedAt) results.push(`${format(record.hospitalizedAt, 'MM/DD/YY')}`);
  if (record.hospitalName) results.push(`${record.hospitalName}`);
  if (record.diagnosis) results.push(`${record.diagnosis}`);
  if (record.treatment) results.push(`${record.treatment}`);
  if (record.notes) results.push(`${record.notes}`);

  return results.join(' ');
};

export const formatMenstrualHistory = (record) => {
  const results = [];
  if (!record) return null;
  if (record.menarche) results.push(`Menarche: ${record.menarche}`);
  if (record.interval) results.push(`Interval (days): ${record.interval}`);
  if (record.duration) results.push(`Duration (days): ${record.duration}`);
  if (record.amount) results.push(`Amount (mL): ${record.amount}`);
  if (record.notes) results.push(`Notes: ${record.notes}`);

  return results.join(' ');
};

export const formatObstestricHistory = (record) => {
  const results = [];
  if (!record) return null;
  if (record.LMP) results.push(`LMP: ${record.LMP}`);
  if (record.PMP) results.push(`PMP: ${record.PMP}`);
  if (record.gravidity) results.push(`Gravidity: ${record.gravidity}`);
  if (record.parity) results.push(`Parity: ${record.parity}`);
  if (record.notes) results.push(`Notes: ${record.notes}`);

  return results.join(' ');
};

export const formatDentalHistory = (record) => {
  const results = [];
  if (!record) return null;
  if (record.medicalConditionAt) results.push(`Date occured: ${format(record.medicalConditionAt, 'MM/DD/YY')}`);
  if (record.teeth && record.teeth.length) results.push(`Teeth: ${record.teeth.join(', ')}`);
  if (record.gingivae) results.push(`Gingivae: ${record.gingivae}`);
  if (record.palate) results.push(`Palate: ${record.palate}`);
  if (record.frenum) results.push(`Frenum: ${record.frenum}`);
  if (record.profile) results.push(`Profile: ${record.profile}`);
  if (record.hygiene) results.push(`Hygiene: ${record.hygiene}`);
  if (record.abrasions) results.push(`Abrasions: ${record.abrasions}`);
  if (record.recededGums) results.push(`Receded gums: ${record.recededGums}`);
  if (record.mouthOpening) results.push(`Mouth opening: ${record.mouthOpening}`);
  if (record.oropharynx) results.push(`Oropharynx: ${record.oropharynx}`);
  if (record.teethDiscoloration) results.push(`Teeth discoloration: ${record.teethDiscoloration}`);
  if (record.calculus) results.push(`Calculus: ${record.calculus}`);
  if (record.malocclusion) results.push(`Malocclusion: ${record.malocclusion}`);
  if (record.mentalis) results.push(`Mentalis: ${record.mentalis}`);
  if (record.swallowing) results.push(`Swallowing: ${record.swallowing}`);
  if (record.gagFlex) results.push(`Gag flex: ${record.gagFlex}`);
  if (record.habits && record.habits.length) results.push(`Habits: ${record.habits.join(', ')}`);
  if (record.complications && record.complications.length) results.push(`Complications: ${record.complications.join(', ')}`);

  return results.join(', ');
};

export const formatROS = (record) => {
  const results = [];
  if (!record) return null;
  if (record.general) results.push(`General: ${record.general}`);
  if (record.eyes) results.push(`Eyes: ${record.eyes}`);
  if (record.skin) results.push(`Skin: ${record.skin}`);
  if (record.ent) results.push(`HEENT: ${record.ent}`);
  if (record.neck) results.push(`Neck: ${record.neck}`);
  if (record.breasts) results.push(`Chest/Breast: ${record.breasts}`);
  if (record.respiratory) results.push(`Respiratory/Lungs: ${record.respiratory}`);
  if (record.cardiovascular) results.push(`Heart: ${record.cardiovascular}`);
  if (record.gastrointestinal) results.push(`Gastrointestinal/Abdomen: ${record.gastrointestinal}`);
  if (record.peripheralVascular) results.push(`Peripheral Vascular: ${record.peripheralVascular}`);
  if (record.genitourinary) results.push(`Genitourinary: ${record.genitourinary}`);
  if (record.musculoskeletal) results.push(`Musculoskeletal: ${record.musculoskeletal}`);
  if (record.psychiatric) results.push(`Psychiatric: ${record.psychiatric}`);
  if (record.hematologicLymphatic) results.push(`Hematologic: ${record.hematologicLymphatic}`);
  if (record.endocrine) results.push(`Endocrine: ${record.endocrine}`);
  if (record.allergicImmunologic) results.push(`Allergic Immunologic: ${record.allergicImmunologic}`);

  return results.join(', ');
};

export const formatVitals = (record) => {
  const results = [];
  if (!record) return null;
  if (record.takenAt) results.push(`Date Taken: ${format(record.takenAt, 'MM/DD/YY')}`);
  if (record.weight) results.push(`Weight (kg): ${record.weight}`);
  if (record.height) results.push(`Hieght (cm): ${record.height}`);
  if (record.weight && record.height) results.push(`BMI: ${calcBMI(record.weight, record.height)}`);
  if (record.bpSystolic) results.push(`BP Systolic: ${record.bpSystolic}`);
  if (record.bpDiastolic) results.push(`BP Diastolic: ${record.bpDiastolic}`);
  if (record.pulse) results.push(`Pulse Rate (bpm): ${record.pulse}`);
  if (record.respiration) results.push(`Respiration Rate (rpm): ${record.respiration}`);
  if (record.temperature) results.push(`Temp (°C): ${record.temperature}`);
  if (record.temperatureMethod) results.push(`Temp Location: ${record.temperatureMethod}`);
  if (record.headCircumference) results.push(`Head Circ (cm): ${record.headCircumference}`);
  if (record.waistCircumference) results.push(`Waist Circ (cm): ${record.waistCircumference}`);
  if (record.neckCircumference) results.push(`Neck Circ (cm): ${record.neckCircumference}`);
  if (record.abdominalCircumference) results.push(`Abdominal Circ (cm): ${record.abdominalCircumference}`);
  if (record.chestCircumference) results.push(`Chest Circ (cm): ${record.chestCircumference}`);
  if (record.endocrine) results.push(`Chest Inspiration (cm): ${record.endocrine}`);
  if (record.chestExpiration) results.push(`Chest Expiration (cm): ${record.chestExpiration}`);
  if (record.o2sats) results.push(`O2 Sat (mm): ${record.o2sats}`);
  if (record.lmp) results.push(`LMP Date:  ${format(record.lmp, 'MM/DD/YY')}`);
  if (record.lmp) results.push(`EDC: ${computeEdcByDate(record.lmp)}`);
  if (record.lmp) results.push(`AOG: ${computeAOGUsingLMP(record.lmp, record.createdAt)}`);
  // - Old Visual Acuity Fields - will only show if there are old existing records
  if (record.visualAcuityDsntUncorrectL) results.push(`Distant Uncorrected (L): 20/${record.visualAcuityDsntUncorrectL}`);
  if (record.visualAcuityDsntUncorrectR) results.push(`Distant Uncorrected (R): 20/${record.visualAcuityDsntUncorrectR}`);
  if (record.visualAcuityDsntCorrectL) results.push(`Distant Corrected (L): 20/${record.visualAcuityDsntCorrectL}`);
  if (record.visualAcuityDsntCorrectR) results.push(`Distant Corrected (R): 20/${record.visualAcuityDsntCorrectR}`);
  if (record.visualAcuityNearUncorrectL) results.push(`Near Uncorrected (L): 20/${record.visualAcuityNearUncorrectL}`);
  if (record.visualAcuityNearUncorrectR) results.push(`Near Uncorrected (R): 20/${record.visualAcuityNearUncorrectR}`);
  if (record.visualAcuityNearCorrectL) results.push(`Near Corrected (L): 20/${record.visualAcuityNearCorrectL}`);
  if (record.visualAcuityNearCorrectR) results.push(`Near Corrected (R): 20/${record.visualAcuityNearCorrectR}`);
  // - Added colorVision checker to avoid records confusion
  if (record.visualAcuityVisionNormal && !record.colorVision) results.push(`Color Vision (Normal): ${record.visualAcuityVisionNormal}`);
  if (record.visualAcuityVisionAbnormal && !record.colorVision) results.push(`Color Vision (Abnormal): ${record.visualAcuityVisionAbnormal}`);
  // - New Visual Acuity Fields
  if (record.visualAcuityLeft) results.push(`Visual Acuity (L): ${record.visualAcuityLeft}`);
  if (record.visualAcuityRight) results.push(`Visual Acuity (R): ${record.visualAcuityRight}`);
  if (record.visualRemarks) results.push(`Visual Remarks: ${record.visualRemarks}`);
  if (record.colorVision) results.push(`Color Vision: ${record.colorVision}`);

  return results.join(', ');
};

export const formatENTNote = (record) => {
  const restults = [];
  if (!record) return null;
  if (record.cpapPressure) restults.push(`CPAP Pressure (cmH2O): ${record.cpapPressure}`);
  if (record.height) restults.push(`BIPAP Inspiration (cmH2O): ${record.height}`);
  if (record.bipapExpiration) restults.push(`BIPAP Expiration (cmH2O): ${record.bipapExpiration}`);
  if (record.lsatPressure) restults.push(`LSAT Pressure (%): ${record.lsatPressure}`);
  if (record.ahi) restults.push(`AHI (events/hr): ${record.ahi}`);
  if (record.pulse) restults.push(`Ramp Time (minutes): ${record.pulse}`);
  if (record.psgDiagnostic) restults.push(`PSG Diagnostic: ${record.psgDiagnostic}`);
  if (record.psgTherapeutic) restults.push(`PSG Therapeutic: ${record.psgTherapeutic}`);
  if (record.psgSplit) restults.push(`PSG Split: ${record.psgSplit}`);

  return restults.join(', ');
};

export const formatOBNote = (record) => {
  const restults = [];
  if (!record) return null;
  if (record.lmp) restults.push(`LMP Date: ${format(record.lmp, 'MM/DD/YY')}`);
  if (record.ultrasoundDate) restults.push(`US Date: ${format(record.ultrasoundDate, 'MM/DD/YY')}`);
  if (record.ultrasoundAog) restults.push(`AOG by US: ${record.ultrasoundAog}`);
  if (record.lmp) restults.push(`EDC: ${computeEdcByDate(record.lmp)}`);
  if (record.lmp) restults.push(`AOG: ${computeAOGUsingLMP(record.lmp, record.createdAt)}`);
  if (record.ultrasoundDate && record.ultrasoundAog) restults.push(`EDC by US: ${computeEDCUsingUS(record.ultrasoundDate, record.ultrasoundAog)}`);
  if (record.fundalHeight) restults.push(`Fundal Height (cm): ${record.fundalHeight}`);
  if (record.fetalHeartTone) restults.push(`Fetal Heart Tone (bpm): ${record.fetalHeartTone}`);
  if (record.examFindings) restults.push(`Internal Exam Findings: ${record.examFindings}`);

  return restults.join(', ');
};
