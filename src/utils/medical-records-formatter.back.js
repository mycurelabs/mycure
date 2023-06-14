import {
  format,
  addDays,
  addMonths,
  differenceInDays,
} from 'date-fns';
import { cloneDeep, isEmpty } from 'lodash';

const dentalExamFields = ['8', '7', '6', '5', '4', '3', '2', '1'];

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
  return format(addDays(addMonths(date, 9), 7), 'MM/dd/yy');
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
  return format(addDays(date, days), 'MM/dd/yy');
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
      i = `${i} (Last used: ${format(record.drugLastUsedAt, 'MM/dd/yy')})`;
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
  if (record.deliveredAt) restuls.push(`${format(record.deliveredAt, 'MM/dd/yy')}`);
  if (record.methodOfDelivery) restuls.push(`${record.methodOfDelivery}`);
  if (record.attendedBy) restuls.push(`${record.attendedBy}`);
  if (record.complications) restuls.push(`${record.complications}`);
  if (record.notes) restuls.push(`${record.notes}`);

  return restuls.join(' ');
};

export const formatGynecologicHistory = (record) => {
  const results = [];
  if (!record) return null;
  if (record.prevCervicSmearsDate) results.push(`Previous Cervix Smears Date: ${format(record.prevCervicSmearsDate, 'MM/dd/yy')}`);
  if (record.prevCervicSmearsResult) results.push(`Previous Cervix Smears Result: ${record.prevCervicSmearsResult}`);
  if (record.prevProblemsTreatments) results.push(`Previous Problems/Treatments: ${record.prevProblemsTreatments}`);
  if (record.currentContraception) results.push(`Current Contraception: ${record.currentContraception}`);
  if (record.notes) results.push(`Notes: ${record.notes}`);

  return results.join(' ');
};

export const formatHospitalizationHistory = (record) => {
  const results = [];
  if (!record) return null;
  if (record.hospitalizedAt) results.push(`${format(record.hospitalizedAt, 'MM/dd/yy')}`);
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
  if (record.medicalConditionAt) results.push(`Date occured: ${format(record.medicalConditionAt, 'MM/dd/yy')}`);
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
  if (record.takenAt) results.push(`Date Taken: ${format(record.takenAt, 'MM/dd/yy')}`);
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
  if (record.lmp) results.push(`LMP Date:  ${format(record.lmp, 'MM/dd/yy')}`);
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
  if (record.lmp) restults.push(`LMP Date: ${format(record.lmp, 'MM/dd/yy')}`);
  if (record.ultrasoundDate) restults.push(`US Date: ${format(record.ultrasoundDate, 'MM/dd/yy')}`);
  if (record.ultrasoundAog) restults.push(`AOG by US: ${record.ultrasoundAog}`);
  if (record.lmp) restults.push(`EDC: ${computeEdcByDate(record.lmp)}`);
  if (record.lmp) restults.push(`AOG: ${computeAOGUsingLMP(record.lmp, record.createdAt)}`);
  if (record.ultrasoundDate && record.ultrasoundAog) restults.push(`EDC by US: ${computeEDCUsingUS(record.ultrasoundDate, record.ultrasoundAog)}`);
  if (record.fundalHeight) restults.push(`Fundal Height (cm): ${record.fundalHeight}`);
  if (record.fetalHeartTone) restults.push(`Fetal Heart Tone (bpm): ${record.fetalHeartTone}`);
  if (record.examFindings) restults.push(`Internal Exam Findings: ${record.examFindings}`);

  return restults.join(', ');
};

export const formatPrescription = (record) => {
  const results = [];
  if (!record) return null;
  if (record.items && record.items.length) {
    for (const item of record.items) {
      let i = `${item.genericName} ${item.formulation} # ${item.dispense}`;
      if (item.brandName) {
        i = i + `<br>${item.brandName}`;
      }
      if (item.dosageSig || item.frequency) {
        i = i + `<br>Sig: ${item.dosageSig} ${item.frequency}`;
      }
      if (item.note) {
        i = i + `<br>${item.note}`;
      }
      results.push(i);
    }
  }
  return results.join(', ');
};

export const formatDiagnosticOrder = (record) => {
  if (!record) return null;
  let results = '';
  if (record.tests && record.tests.length) results = record.tests.map(t => t.name).join(', ');
  if (record.reason) results = `${results}<br>Reason: ${record.reason}`;
  if (record.requestingPhysician) results = `${results}<br>Requesting Physician: ${record.requestingPhysician}`;
  return results;
};

export const formatDentalNote = (record) => {
  if (!record) return null;
  let results = '';
  if (record.teeth && record.teeth.length) results = `Location: (${record.tests.join(', ')})`;
  if (record.reason) results = `${results}<br>Reason: ${(record.status || {}).abbreviation || ''} - ${(record.status || {}).description || ''}`;
  return results;
};

export const formatDentalNoteTable = (dentalNotes, diagnoses) => {
  const records = cloneDeep(dentalNotes) || [];
  if (records.length < 8) {
    for (let i = 0; i < (8 - records.length); i++) {
      records.push({});
    }
  }

  const table = document.createElement('table');
  table.style.borderCollapse = 'collapse';
  table.style.width = '100%';
  table.style['border-collapse'] = 'collapse';
  const tbody = document.createElement('tbody');
  const head = document.createElement('tr');

  // tooth
  const toothNoCol = document.createElement('td');
  toothNoCol.style.border = '1px solid #ddd';
  toothNoCol.style.fontWeight = '700';
  toothNoCol.style.padding = '2px';
  toothNoCol.style.width = '10%';
  toothNoCol.appendChild(document.createTextNode('TOOTH NO.'));
  head.appendChild(toothNoCol);

  // dianosis
  const diagnosisCol = document.createElement('td');
  diagnosisCol.style.border = '1px solid #ddd';
  diagnosisCol.style.fontWeight = '700';
  diagnosisCol.style.width = '23%';
  diagnosisCol.style.padding = '2px';
  diagnosisCol.appendChild(document.createTextNode('DIAGNOSIS'));
  head.appendChild(diagnosisCol);

  // procedure
  const procedureCol = document.createElement('td');
  procedureCol.style.border = '1px solid #ddd';
  procedureCol.style.fontWeight = '700';
  procedureCol.style.width = '23%';
  procedureCol.style.padding = '2px';
  procedureCol.appendChild(document.createTextNode('PROCEDURE DONE'));
  head.appendChild(procedureCol);

  // surface count
  const surfaceCol = document.createElement('td');
  surfaceCol.style.border = '1px solid #ddd';
  surfaceCol.style.fontWeight = '700';
  surfaceCol.style.width = '10%';
  surfaceCol.style.padding = '2px';
  surfaceCol.appendChild(document.createTextNode('NUMBER OF\nSURFACES'));
  head.appendChild(surfaceCol);

  // px signature count
  const pxSigCol = document.createElement('td');
  pxSigCol.style.border = '1px solid #ddd';
  pxSigCol.style.fontWeight = '700';
  pxSigCol.style.width = '23%';
  pxSigCol.style.padding = '2px';
  pxSigCol.appendChild(document.createTextNode('PATIENT\'S SIGNATURE'));
  head.appendChild(pxSigCol);

  // amount count
  const amountCol = document.createElement('td');
  amountCol.style.border = '1px solid #ddd';
  amountCol.style.fontWeight = '700';
  amountCol.style.width = '10%';
  amountCol.style.padding = '2px';
  amountCol.appendChild(document.createTextNode('AMOUNT'));
  head.appendChild(amountCol);

  tbody.appendChild(head);

  for (const r of records) {
    const row = document.createElement('tr');
    // tooth
    const toothNoCol = document.createElement('td');
    toothNoCol.style.border = '1px solid #ddd';
    toothNoCol.style.padding = '2px';
    toothNoCol.style.width = '10%';
    toothNoCol.style.height = '40px';
    const toothNo = document.createTextNode((r.teeth || []).join(', '));
    toothNoCol.appendChild(toothNo);
    row.appendChild(toothNoCol);

    // dianosis
    const diagnosisCol = document.createElement('td');
    diagnosisCol.style.border = '1px solid #ddd';
    diagnosisCol.style.width = '23%';
    diagnosisCol.style.padding = '2px';
    diagnosisCol.style.height = '40px';
    if (!isEmpty(r)) {
      const diagnosis = document.createTextNode((diagnoses || []).join(', ') || ' ');
      diagnosisCol.appendChild(diagnosis);
    }
    row.appendChild(diagnosisCol);

    // procedure
    const procedureCol = document.createElement('td');
    procedureCol.style.border = '1px solid #ddd';
    procedureCol.style.width = '23%';
    procedureCol.style.padding = '2px';
    procedureCol.style.height = '40px';
    let procedures = [
      (r.service || {}).name || '',
      ((r.$populated || {}).service || {}).name || '',
    ];
    procedures = procedures.filter(r => !isEmpty(r));
    const procedure = document.createTextNode(procedures.join(', ') || ' ');
    procedureCol.appendChild(procedure);
    row.appendChild(procedureCol);

    // surface count
    const surfaceCol = document.createElement('td');
    surfaceCol.style.border = '1px solid #ddd';
    surfaceCol.style.width = '10%';
    surfaceCol.style.padding = '2px';
    surfaceCol.style.height = '40px';
    const surface = document.createTextNode((r.surfaces || []).length || ' ');
    surfaceCol.appendChild(surface);
    row.appendChild(surfaceCol);

    // px signature count
    const pxSigCol = document.createElement('td');
    pxSigCol.style.border = '1px solid #ddd';
    pxSigCol.style.width = '23%';
    pxSigCol.style.padding = '2px';
    pxSigCol.style.height = '40px';
    pxSigCol.appendChild(document.createTextNode(' '));
    row.appendChild(pxSigCol);

    // amount count
    const amountCol = document.createElement('td');
    amountCol.style.border = '1px solid #ddd';
    amountCol.style.width = '10%';
    amountCol.style.padding = '2px';
    amountCol.style.height = '40px';
    amountCol.appendChild(document.createTextNode(' '));
    row.appendChild(amountCol);

    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  return table.outerHTML;
};

export const dentalExamLocations = [
  { key: 'dentalExamRightUpper', name: 'Dental Examination - Upper Right' },
  { key: 'dentalExamRightLower', name: 'Dental Examination - Lower Right' },
  { key: 'dentalExamLeftUpper', name: 'Dental Examination - Upper Right' },
  { key: 'dentalExamLeftLower', name: 'Dental Examination - Lower Right' },
];

const isDentalExaminationVisible = (key, record) => {
  if (record) {
    for (const field of dentalExamFields) {
      if (!isEmpty(record[`${key}${field}`])) { return true; }
    }
  }
};

export const levelOfConsciousness = (consciousnessLevel) => {
  const type1Level = [
    { title: 'Alert', image: 'alert.png', val: 1 },
    { title: 'Verbal Stimuli', image: 'verbal.png', val: 2 },
    { title: 'Painful Stimuli', image: 'painful.png', val: 3 },
    { title: 'Unresponsive', image: 'unresponsive.png', val: 4 },
  ];
  if (consciousnessLevel) {
    const index = (type1Level || []).findIndex(val => val.val === consciousnessLevel);
    if (index > -1) {
      return type1Level[index];
    }
  }

  return undefined;
};

const painAssessment = (painAssessment) => {
  const type1Level = [
    { title: 'No Pain', image: 'pain-no.png', val: 1 },
    { title: 'Mild', image: 'pain-mild.png', val: 2 },
    { title: 'Moderate', image: 'pain-moderate.png', val: 3 },
    { title: 'Severe', image: 'pain-severe.png', val: 4 },
    { title: 'Very Severe', image: 'pain-very.png', val: 5 },
    { title: 'Worst Pain Possible', image: 'pain-worst.png', val: 6 },
  ];
  if (painAssessment) {
    const index = (type1Level || []).findIndex(val => val.val === painAssessment);
    if (index > -1) {
      return type1Level[index];
    }
  }

  return undefined;
};

export const formatPE = (record) => {
  const results = [];
  if (!record) return null;
  if (record.physicalExam) results.push(`Physical Exam: ${record.physicalExam}`);
  if (record.consciousnessLevel) results.push(`Level of Consciousness: ${levelOfConsciousness(record.consciousnessLevel)?.title}`);
  if (record.consciousnessLevelScale) results.push(`Level of Consciousness: ${record.consciousnessLevelScale}/7`);
  if (record.painAssessment) results.push(`Pain Assessment: ${painAssessment(record.painAssessment)?.title}`);
  if (record.painAssessmentScale) results.push(`Pain Assessment: ${record.painAssessmentScale}/10`);
  for (const loc of dentalExamLocations) {
    if (isDentalExaminationVisible(loc.key, record)) {
      let item = loc.name;
      for (const field of dentalExamFields) {
        const data = record[loc.key + field];
        if (data) item = item + ` (${data})`;
      }
      results.push(item);
    }
  }
  if (record.dentalNote) results.push(`Dental Survey: ${record.dentalNote}`);

  return results.join(', ');
};
