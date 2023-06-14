import { useHelpers } from '@/composables/helpers';
import { addMilliseconds, differenceInDays, differenceInYears, eachDayOfInterval, format } from 'date-fns';
import _, { isEmpty, get, cloneDeep, uniq, map } from 'lodash';
import {
  calcBMI,
  formatBirthHistory,
  formatDentalHistory,
  formatDentalNote,
  formatDentalNoteTable,
  formatDiagnosticOrder,
  formatENTNote,
  formatGynecologicHistory,
  formatHospitalizationHistory,
  formatMenstrualHistory,
  formatOBNote,
  formatObstestricHistory,
  formatPE,
  formatPrescription,
  formatROS,
  formatSocialHistory,
  formatSocialHxPackYears,
  formatVitals,
  getFtUtil,
  getLbUtil,
  getRecords,
  recordsFieldFormatter,
} from '@/utils/medical-records-formatter';
import { PME_REPORT_MEDICAL_RECORDS_TOKENS } from '@/constants/pme';

export default () => {
  const { formatName, formatAddress } = useHelpers();

  const PME_ENCOUNTER_EXAM_TYPES = [
    { label: 'Annual Physical Exam', value: 'ANNUAL PHYSICAL EXAM' },
    { label: 'Pre-Employment', value: 'PRE-EMPLOYMENT' },
    { label: 'Executive Check-Up', value: 'EXECUTIVE CHECK-UP' },
    { label: 'Medical Evaluation', value: 'MEDICAL EVALUATION' },
    { label: 'Consult', value: 'Consult' },
  ];

  const PME_ENCOUNTER_STATUS_TYPES = [
    { value: 'pending', label: 'In Progress', color: 'negative' },
    { value: 'classifying', label: 'For Evaluation', color: 'orange' },
    { value: 'checking', label: 'For Checking', color: 'primary' },
    { value: 'completed', label: 'Finalized', color: 'positive' },
  ];

  const pmeEncounterStatusQueryBuilder = (status, query) => {
    if (status === 'pending') {
      query.finishedAt = { $exists: false };
      return query;
    }

    if (status === 'classifying') {
      query.finishedAt = { $exists: true };
      query.$and = [
        {
          $or: [
            { APEReportClassifiedAt: { $exists: false } },
            { APEReportClassifiedAt: null },
          ],
        },
        {
          $or: [
            { APEReportFinalizedAt: { $exists: false } },
            { APEReportFinalizedAt: null },
          ],
        },
      ];
      return query;
    }

    if (status === 'checking') {
      query.finishedAt = { $exists: true };
      query.APEReportClassifiedAt = { $exists: true };
      query.APEReportFinalizedAt = { $exists: false };
      return query;
    }

    if (status === 'completed') {
      query.finishedAt = { $exists: true };
      query.APEReportFinalizedAt = { $exists: true };
      return query;
    }

    return query;
  };

  const pmeEncounterStatusMapper = (encounter) => {
    if (!encounter?.finishedAt) return PME_ENCOUNTER_STATUS_TYPES.find(status => status.value === 'pending');
    if (encounter?.APEReportFinalizedAt) return PME_ENCOUNTER_STATUS_TYPES.find(status => status.value === 'completed');
    if (encounter?.APEReportClassifiedAt) return PME_ENCOUNTER_STATUS_TYPES.find(status => status.value === 'checking');
    return PME_ENCOUNTER_STATUS_TYPES.find(status => status.value === 'classifying');
  };

  const pmeWorklistMapper = (item = {}) => {
    const statuses = [pmeEncounterStatusMapper(item)];
    if (item.isFollowup) statuses.push({ label: 'For Followup', color: 'black', value: 'followup' });
    const packageFormatted = item.invoiceItems?.map(item => item.name).join(', ');
    const name = formatName(item.patient?.name, 'lastName, firstName');
    const hmo = item.patient?.companies?.map(company => company.name).join(', ');
    const tags = item.patient?.tags?.join(', ');
    return {
      name,
      date: format(new Date(item.createdAt), 'MM/dd/yy hh:mm a'),
      examType: item.tags?.join(', '),
      status: statuses,
      package: packageFormatted,
      hmo,
      tags,
      // Always use $data for the row data handling
      $data: {
        ...item,
      },
    };
  };

  const monitoringReportMapper = (item = {}) => {
    const statuses = [pmeEncounterStatusMapper(item)];

    if (item.isFollowup) {
      statuses.push({ label: 'For Followup', color: 'black', value: 'followup' });
    }

    const normalTime = item?.invoiceItems?.[0]?.serviceData?.normalTime || 0;
    const name = formatName(item?.patient?.name, 'lastName, firstName');
    const hmo = item?.patient?.companies?.map(company => company.name)?.join(', ');
    const tags = item?.patient?.tags?.join(', ');
    const examType = item?.tags?.join(', ');
    const clinic = item?.facilityData?.name;
    const dateOfExam = item?.createdAt ? format(item.createdAt, 'MM/dd/yy hh:mm a') : null;
    const releaseDateRaw = item?.apeReport?.finalizedAt;
    const releaseDate = releaseDateRaw ? format(releaseDateRaw, 'MM/dd/yy hh:mm a') : null;
    const dueDateRaw = item?.createdAt && normalTime ? addMilliseconds(item.createdAt, normalTime) : null;
    const dueDate = dueDateRaw ? format(dueDateRaw, 'MM/dd/yy hh:mm a') : null;
    const insurerDataName = item?.peContract?.insurerData?.name;

    let noOfDays = null;

    if (item?.createdAt && releaseDateRaw) {
      const numberOfDays = differenceInDays(releaseDateRaw, item.createdAt);
      const weekends = eachDayOfInterval({
        start: item.createdAt,
        end: releaseDateRaw,
      }).filter(day => format(day, 'i') === '7');

      noOfDays = numberOfDays - weekends.length;
    }

    let lapses = null;

    if (dueDateRaw && releaseDateRaw) {
      const lapseDates = differenceInDays(releaseDateRaw, dueDateRaw);
      const weekends = eachDayOfInterval({
        start: item?.createdAt,
        end: item?.apeReport?.finalizedAt,
      }).filter(day => format(day, 'i') === '7');
      const diff = lapseDates - weekends.length;
      lapses = diff > 0 ? diff : 0;
    }

    return {
      lapses,
      name,
      dateOfExam,
      company: insurerDataName || hmo,
      dueDate,
      releaseDate,
      noOfDays,
      examType,
      status: statuses,
      hmo,
      tags,
      clinic,
      // Always use $data for the row data handling
      $data: {
        ...item,
      },
    };
  };

  const groupPackageMapper = (insuranceContracts) => {
    if (!insuranceContracts.length) return [];
    const final = _(insuranceContracts).groupBy('label')
      .map((contracts, label) => {
        const contract = get(contracts, '[0]');
        const item = {
          ...contract,
          name: contract?.insurerCorporate?.insurerName || contract?.insurerOrg?.name,
          insurer: contract?.insurer,
          label,
          contracts,
        };
        return item;
      })
      .value();
    return final;
  };

  const formatSurgicalHistory = (record) => {
    const results = [];
    if (!record) return null;
    if (record.performedAt) results.push(`${format(record.performedAt, 'MM/dd/yy')}`);
    if (record.hospitalName) results.push(`${record.hospitalName}`);
    if (record.procedure) results.push(`${record.procedure}`);
    if (record.notes) results.push(`${record.notes}`);

    return results.join(' ');
  };

  const FORM_TEMPLATE_TOKENS = [
    {
      name: 'Clinic Name',
      token: 'clinic_name',
      dataSource: 'clinic',
      readonly: true,
      format: (data) => {
        return data?.name;
      },
    },
    {
      name: 'Clinic Address',
      token: 'clinic_address',
      dataSource: 'clinic',
      readonly: true,
      format: (data) => {
        return formatAddress(data?.address);
      },
    },
    {
      name: 'Clinic Email',
      token: 'clinic_email',
      dataSource: 'clinic',
      readonly: true,
      format: (data) => {
        const emails = data?.emails || [];
        if (data?.email) emails.push(data.email);
        if (!emails.length) return '';
        return emails.map(email => `<a href="mailto:${email}">${email}</a>`).filter(Boolean).join(', ');
      },
    },
    {
      name: 'Clinic Phone',
      token: 'clinic_phone',
      dataSource: 'clinic',
      readonly: true,
      format: (data) => {
        const phones = data?.phones || [];
        if (data?.phone) phones.push(data.phone);
        if (!phones.length) return '';
        return phones.map(phone => `<a href="tel:${phone}">${phone}</a>`).filter(Boolean).join(', ');
      },
    },
    {
      name: 'Clinic Website',
      token: 'clinic_website',
      dataSource: 'clinic',
      readonly: true,
      format: (data) => {
        if (data?.website) return `<a href="${data?.website}" target="_blank">${data?.website}</a>`;
        return data?.website;
      },
    },
    {
      name: 'Clinic Logo',
      token: 'clinic_logo',
      dataSource: 'clinic',
      readonly: true,
      format: (data) => {
        const src = data?.picURL;
        return `<img src="${src}" style="width: 80px;" />`;
      },
    },
    {
      name: 'Clinic Logo - Large',
      token: 'clinic_lg_logo',
      dataSource: 'clinic',
      readonly: true,
      format: (data) => {
        const src = data?.picURL;
        return `<img src="${src}" style="width: 100px;" />`;
      },
    },
    {
      name: 'Clinic Logo - X-Large',
      token: 'clinic_xl_logo',
      dataSource: 'clinic',
      readonly: true,
      format: (data) => {
        const src = data?.picURL;
        return `<img src="${src}" style="width: 125px;" />`;
      },
    },
    {
      name: 'Clinic Logo - Full-Width',
      token: 'clinic_full_width_logo',
      dataSource: 'clinic',
      readonly: true,
      format: (data) => {
        const src = data?.picURL;
        return `<img src="${src}" style="width: 100%;" />`;
      },
    },
    {
      name: 'Clinic Banner',
      token: 'clinic_banner',
      dataSource: 'clinic',
      readonly: true,
      format: (data) => {
        const src = data?.picURL;
        return `<img src="${src}" style="width: 100%;" />`;
      },
    },
    {
      name: 'Logged In User - Name',
      token: 'doctor_name',
      dataSource: 'current-user',
      readonly: true,
      format: (data) => {
        console.warn('doctor_name', data);
        const name = data?.name || {};
        return formatName(name, 'firstName middleName lastName');
      },
    },
    {
      name: 'Logged In User - PRC License No.',
      token: 'doctor_doc_prc',
      dataSource: 'current-user',
      readonly: true,
      format: (data) => {
        return data?.doc_PRCLicenseNo || '';
      },
    },
    {
      name: 'Logged In User - PTR No.',
      token: 'doctor_doc_ptr',
      dataSource: 'current-user',
      readonly: true,
      format: (data) => {
        return data?.doc_PTRNumber || '';
      },
    },
    {
      name: 'Logged In User - E Signature',
      token: 'doctor_doc_esig',
      dataSource: 'current-user',
      readonly: true,
      format: (data) => {
        const src = data?.doc_eSignatureURL;
        return `<img src="${src}" style="width: 120px;" />`;
      },
    },
    {
      name: 'Attending Doctor',
      token: 'attending_doc_name',
      dataSource: 'attending-doctor',
      readonly: true,
      format: (data) => {
        return 'no-formatter-yet';
      },
    },
    {
      name: 'Attending Doctor - PRC License No.',
      token: 'attending_doc_prc',
      dataSource: 'attending-doctor',
      readonly: true,
      format: (data) => {
        return 'no-formatter-yet';
      },
    },
    {
      name: 'Attending Doctor - PTR No.',
      token: 'attending_doc_ptr',
      dataSource: 'attending-doctor',
      readonly: true,
      format: (data) => {
        return 'no-formatter-yet';
      },
    },
    {
      name: 'Attending Doctor - E Signature.',
      token: 'attending_doc_esig',
      dataSource: 'attending-doctor',
      readonly: true,
      format: (data) => {
        return 'no-formatter-yet';
      },
    },
    {
      name: 'Date Today',
      token: 'today',
      dataSource: 'encounter',
      readonly: true,
      format: (data) => {
        return format(new Date(), 'MMMM dd, yyyyy');
      },
    },
    {
      name: 'Date Today Plus',
      token: 'now_plus',
      dataSource: 'encounter',
      readonly: true,
      format: (data) => {
        return format(new Date(), 'MMMM dd, yyyyy');
      },
    },
    {
      name: 'Date',
      token: 'date',
      dataSource: 'encounter',
      readonly: true,
      format: (data) => {
        return format(new Date(), 'MMMM dd, yyyyy');
      },
    },
    {
      name: 'Patient Full Name (First Name Middle Initial Last Name)',
      token: 'patient_name',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        return formatName(data?.name, 'firstName middleInitial lastName');
      },
    },
    {
      name: 'Patient Full Name (First Name Middle Name Last Name)',
      token: 'patient_full_name_mid_name',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        return formatName(data?.name);
      },
    },
    {
      name: 'Patient First Name',
      token: 'patient_first_name',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        return data?.name?.firstName;
      },
    },
    {
      name: 'Patient Middle Name',
      token: 'patient_middle_name',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        return data?.name?.middleName;
      },
    },
    {
      name: 'Patient Last Name',
      token: 'patient_last_name',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        return data?.name?.lastName;
      },
    },
    {
      name: 'Patient Sex',
      token: 'patient_sex',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        const sex = data?.sex || '';
        return `${sex.charAt(0).toUpperCase()}${sex.substring(1, sex.length)}`;
      },
    },
    {
      name: 'Patient Date of Birth',
      token: 'patient_dob',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        if (!data?.dateOfBirth) return '';
        return format(data?.dateOfBirth, 'MMM dd, yyyy');
      },
    },
    {
      name: 'Patient Age',
      token: 'patient_age',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        const dob = data?.dateOfBirth;
        if (!dob) return null;
        const age = differenceInYears(new Date(), new Date(dob));
        if (age > 1) return `${age} years`;
        return `${age} year`;
      },
    },
    {
      name: 'Patient Blood Type',
      token: 'patient_blood_type',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        return data?.bloodType?.toUpperCase();
      },
    },
    {
      name: 'Patient Mobile No.',
      token: 'patient_mobile_no',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        return data?.mobileNo;
      },
    },
    {
      name: 'Patient Marital Status',
      token: 'patient_marital_status',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        const maritalStatus = data?.maritalStatus || '';
        return `${maritalStatus.charAt(0).toUpperCase()}${maritalStatus.substring(1, maritalStatus.length)}`;
      },
    },
    {
      name: 'Patient Address',
      token: 'patient_full_address',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        return formatAddress(data?.address);
      },
    },
    {
      name: 'Patient OSCA Id',
      token: 'patient_osca_id',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        return data?.OSCASeniorCitizenId;
      },
    },
    {
      name: 'Patient PWD Id',
      token: 'patient_pwd_id',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        return data?.PWDId;
      },
    },
    {
      name: 'Patient HMO',
      token: 'patient_hmos',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        return data?.insuranceCards?.map(card => card.name).join(', ');
      },
    },
    {
      name: 'Patient HMO Account No.',
      token: 'patient_hmo_accountno',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        return data?.insuranceCards?.map(card => card.number).join(', ');
      },
    },
    {
      name: 'Patient HMO Account Validity Date',
      token: 'patient_hmo_validity',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        return data?.insuranceCards?.map(card => {
          if (!card.validAt) return '';
          return format(card.validAt, 'MMMM dd, yyyy');
        }).join(', ');
      },
    },
    {
      name: 'Patient HMO Account Expiry Date',
      token: 'patient_hmo_expiry',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        return data?.insuranceCards?.map(card => {
          if (!card.expiresAt) return '';
          return format(card.expiresAt, 'MMMM dd, yyyy');
        }).join(', ');
      },
    },
    {
      name: 'Patient HMO Account Status',
      token: 'patient_hmo_status',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        return data?.insuranceCards?.map(card => card.status).join(', ');
      },
    },
    {
      name: 'Patient Company',
      token: 'patient_companies',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        const companies = data?.companies || [];
        const names = companies?.map(company => company?.name);
        return names?.join(', ');
      },
    },
    {
      name: 'Patient Company Account No.',
      token: 'patient_company_accountno',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        const companies = data?.companies || [];
        const statuses = companies?.map(company => company?.status).filter(Boolean);
        return statuses?.join(', ');
      },
    },
    {
      name: 'Patient Display Picture',
      token: 'patient_dp',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        const src = data?.picURL;
        return `<img src="${src}" style="width: 100px;" />`;
      },
    },
    {
      name: 'Patient Display Picture - Large',
      token: 'patient_lg_dp',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        const src = data?.picURL;
        return `<img src="${src}" style="width: 200px;" />`;
      },
    },
    {
      name: 'Patient Display Picture - X-Large',
      token: 'patient_xl_dp',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        const src = data?.picURL;
        return `<img src="${src}" style="width: 300px;" />`;
      },
    },
    {
      name: 'Patient Display Picture - Full Width',
      token: 'patient_full_width_dp',
      dataSource: 'patient',
      readonly: true,
      format: (data) => {
        const src = data?.picURL;
        return `<img src="${src}" style="width: 100%;" />`;
      },
    },
    {
      name: 'Date of Visit',
      token: 'patient_encounter_created_at',
      dataSource: 'encounter',
      readonly: true,
      format: (encounter) => {
        if (!encounter?.createdAt) return '';
        return format(encounter?.createdAt, 'MMMM dd, yyyy');
      },
    },
    {
      name: 'Chief Complaint',
      token: 'patient_complaint',
      dataSource: 'medical-records',
      inputType: 'textarea',
      inputOptions: {
        rows: 3,
        cols: 5,
      },
      format: (data) => {
        if (!data.length) return '';
        const options = {
          type: 'chief-complaint',
          field: 'text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'HPI',
      token: 'patient_hpi',
      dataSource: 'medical-records',
      inputType: 'textarea',
      inputOptions: {
        rows: 3,
        cols: 5,
      },
      format: (data) => {
        if (!data.length) return '';
        const options = {
          type: 'hpi',
          field: 'text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Past Medical History',
      token: 'patient_pmhx',
      inputeType: 'textarea',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const records = getRecords(data, 'medical-history');
        return records.map(record => `${record.medicalCondition}: ${record.notes}`).filter(Boolean).join(', ');
      },
    },
    {
      name: 'Family History',
      token: 'patient_fhx',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const records = getRecords(data, 'medical-history');
        return records.map(record => `${record.medicalCondition}: ${record.relationship}`).filter(Boolean).join(', ');
      },
    },
    {
      name: 'Social History',
      token: 'patient_shx',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const records = data?.filter(record => record.type === 'social-history');
        return records.map(formatSocialHistory).filter(Boolean).join('<br>');
      },
    },
    {
      name: 'Social History - Exercising?',
      token: 'sh_is_exercising',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const records = data?.filter(record => record.type === 'social-history');
        const record = records?.[0];
        if (!record) return '';
        return record.exercises ? 'YES' : 'NO';
      },
    },
    {
      name: 'Social History - Smoking?',
      token: 'sh_is_smoking',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const records = data?.filter(record => record.type === 'social-history');
        const record = records?.[0];
        if (!record) return '';
        return record.smoking ? 'YES' : 'NO';
      },
    },
    {
      name: 'Social History - Sticks per day',
      token: 'sh_smoking_sticks_per_day',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const records = data?.filter(record => record.type === 'social-history');
        const record = records?.[0];
        if (!record) return '';
        return record.smokingSticksPerDay;
      },
    },
    {
      name: 'Social History - Smoking pack-years',
      token: 'sh_smoking_pack_years',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const records = data?.filter(record => record.type === 'social-history');
        const record = records?.[0];
        if (!record) return '';
        return formatSocialHxPackYears(record);
      },
    },
    {
      name: 'Social History - Drinking?',
      token: 'sh_is_drinking',
      dataSource: 'medical-records',
      format: (data) => {
        const records = data?.filter(record => record.type === 'social-history');
        const record = records?.[0];
        if (!record) return '';
        return record.drinksAlcohol ? 'YES' : 'NO';
      },
    },
    {
      name: 'Social History - Drinking Remarks',
      token: 'sh_drinking_remarks',
      dataSource: 'medical-records',
      format: (data) => {
        const records = data?.filter(record => record.type === 'social-history');
        const record = records?.[0];
        if (!record) return '';
        return record.drinksAlcoholRemarks;
      },
    },
    {
      name: 'Social History - Using prohibited drugs?',
      token: 'sh_is_using_drugs',
      dataSource: 'medical-records',
      format: (data) => {
        const records = data?.filter(record => record.type === 'social-history');
        const record = records?.[0];
        if (!record) return '';
        return record.usesProhibitedDrugs ? 'YES' : 'NO';
      },
    },
    {
      name: 'Social History - Prohibited drugs',
      token: 'sh_prohibited_drugs',
      dataSource: 'medical-records',
      format: (data) => {
        const records = data?.filter(record => record.type === 'social-history');
        const record = records?.[0];
        if (!record) return '';
        return record.drugName;
      },
    },
    {
      name: 'Allergies History',
      token: 'patient_allergies_hx',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const options = {
          type: 'allergy',
          field: 'name',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Allergies History - Allergy',
      token: 'patient_allergy_name',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const options = {
          type: 'allergy',
          field: 'name',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Allergies History - Supplement',
      token: 'patient_allergy_supplement',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const options = {
          type: 'allergy',
          field: 'supplement',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Birth History',
      token: 'patient_birth_hx',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const records = getRecords(data, 'birth-history');
        return records.map(formatBirthHistory).filter(Boolean).join('<br>');
      },
    },
    {
      name: 'Gynecological History',
      token: 'patient_gynecological_hx',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const records = getRecords(data, 'gynecological-history');
        return records.map(formatGynecologicHistory).filter(Boolean).join('<br>');
      },
    },
    {
      name: 'Hospitalization History',
      token: 'patient_hospitalization_hx',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const records = getRecords(data, 'hospitalization-history');
        return records.map(formatHospitalizationHistory).filter(Boolean).join('<br>');
      },
    },
    {
      name: 'Vaccination',
      token: 'patient_vaccination_hx',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const options = {
          type: 'vaccination',
          field: 'vaccine',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Menstrual History',
      token: 'patient_menstrual_hx',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const records = getRecords(data, 'menstrual-history');
        return records.map(formatMenstrualHistory).filter(Boolean).join('<br>');
      },
    },
    {
      name: 'Menstrual History - LMP',
      token: 'patient_menstrual_lmp',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const options = {
          type: 'menstrual-history',
          field: 'LMP',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Menstrual History - Interval',
      token: 'patient_menstrual_interval',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const options = {
          type: 'menstrual-history',
          field: 'interval',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Menstrual History - Duration',
      token: 'patient_menstrual_duration',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const options = {
          type: 'menstrual-history',
          field: 'duration',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Menstrual History - Cycle',
      token: 'patient_menstrual_cycle',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const options = {
          type: 'menstrual-history',
          field: 'cycle',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Menstrual History - OB Score',
      token: 'patient_menstrual_obscore',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const options = {
          type: 'menstrual-history',
          field: 'OBScore',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Obstetric History',
      token: 'patient_obstetric_hx',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const records = getRecords(data, 'obstetric-history');
        return records.map(formatObstestricHistory).filter(Boolean).join('<br>');
      },
    },
    {
      name: 'Surgical History',
      token: 'patient_surgical_hx',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const records = getRecords(data, 'surgical-history');
        return records.map(formatSurgicalHistory).filter(Boolean).join('<br>');
      },
    },
    {
      name: 'Dental History',
      token: 'patient_dental_hx',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const records = getRecords(data, 'dental-history');
        return records.map(formatDentalHistory).filter(Boolean).join('<br>');
      },
    },
    {
      name: 'Review of Systems',
      token: 'patient_ros',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const records = getRecords(data, 'ros');
        return records.map(formatROS).filter(Boolean).join('<br>');
      },
    },
    {
      name: 'Review of Systems - General Status',
      token: 'ros_status_general',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const options = {
          type: 'ros',
          field: 'generalStatus',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - General Remarks',
      token: 'ros_general',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const options = {
          type: 'ros',
          field: 'general',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Eyes Status',
      token: 'ros_status_eyes',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const options = {
          type: 'ros',
          field: 'eyesStatus',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Eyes Remarks',
      token: 'ros_eyes',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const options = {
          type: 'ros',
          field: 'eyes',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Skin Status',
      token: 'ros_status_skin',
      dataSource: 'medical-records',
      format: (data) => {
        if (!data.length) return '';
        const options = {
          type: 'ros',
          field: 'skinStatus',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Skin Remarks',
      token: 'ros_skin',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'skin',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - HEENT Status',
      token: 'ros_status_ent',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'entStatus',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - HEENT Remarks',
      token: 'ros_ent',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'ent',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Neck Status',
      token: 'ros_status_neck',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'neckStatus',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Neck Remarks',
      token: 'ros_neck',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'neck',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Chest/Breast Status',
      token: 'ros_status_breasts',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'breastsStatus',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Chest/Breast Remarks',
      token: 'ros_breasts',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'breasts',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Respiratory/Lungs Status',
      token: 'ros_status_respiratory',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'respiratoryStatus',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Respiratory/Lungs Remarks',
      token: 'ros_respiratory',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'respiratory',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Heart Status',
      token: 'ros_status_cardiovascular',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'cardiovascularStatus',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Heart Remarks',
      token: 'ros_cardiovascular',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'cardiovascular',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Gastrointestinal/Abdomen Status',
      token: 'ros_status_gastrointestinal',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'gastrointestinalStatus',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Gastrointestinal/Abdomen Remarks',
      token: 'ros_gastrointestinal',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'gastrointestinal',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Peripheral Vascular Status',
      token: 'ros_status_peripheral_vascular',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'peripheralVascularStatus',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Peripheral Vascular Remarks',
      token: 'ros_peripheral_vascular',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'peripheralVascular',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Genitourinary Status',
      token: 'ros_status_genitourinary',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'genitourinaryStatus',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Genitourinary Remarks',
      token: 'ros_genitourinary',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'genitourinary',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Musculoskeletal Status',
      token: 'ros_status_musculoskeletal',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'musculoskeletalStatus',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Musculoskeletal Remarks',
      token: 'ros_musculoskeletal',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'musculoskeletal',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Psychiatric Status',
      token: 'ros_status_psychiatric',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'psychiatricStatus',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Psychiatric Remarks',
      token: 'ros_psychiatric',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'psychiatric',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Neurologic Status',
      token: 'ros_status_neurologic',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'neurologicStatus',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Neurologic Remarks',
      token: 'ros_neurologic',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'neurologic',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Hematologic Status',
      token: 'ros_status_hematologic_lymphatic',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'hematologicLymphaticStatus',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Hematologic Remarks',
      token: 'ros_hematologic_lymphatic',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'hematologicLymphatic',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Endocrine Status',
      token: 'ros_status_endocrine',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'endocrineStatus',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Endocrine Remarks',
      token: 'ros_endocrine',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'endocrine',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Allergic Immunologic Status',
      token: 'ros_status_allergic_immunologic',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'allergicImmunologicStatus',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Review of Systems - Allergic Immunologic Remarks',
      token: 'ros_allergic_immunologic',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'ros',
          field: 'allergicImmunologic',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Vitals',
      token: 'patient_vitals',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'vitals');
        return records.map(formatVitals).filter(Boolean).join('</br>');
      },
    },
    {
      name: 'Vitals - Height (cm)',
      token: 'vital_height',
      dataSource: 'medical-records',
      inputOptions: {
        width: '50px',
      },
      format: (data) => {
        const options = {
          type: 'vitals',
          field: 'height',
          joinerToken: ', ',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Vitals - Height (ft)',
      token: 'vital_ht_ft',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'vitals');
        return records.map(record => record?.height ? getFtUtil(record.height) : '');
      },
    },
    {
      name: 'Vitals - Weight (kg)',
      token: 'vital_weight',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'vitals',
          field: 'weight',
          joinerToken: ', ',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Vitals - Weight (lbs)',
      token: 'vital_wt_lbs',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'vitals');
        return records.map(record => record?.weight ? getLbUtil(record.weight) : '');
      },
    },
    {
      name: 'Vitals - BMI',
      token: 'vital_bmi',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'vitals');
        return records.map((record) => {
          if (record.weight && record.height) {
            return calcBMI(record.weight, record.height);
          }
          return '';
        }).join(', ');
      },
    },
    {
      name: 'Vitals - Pulse Rate',
      token: 'vital_pulse_rate',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'vitals',
          field: 'pulse',
          joinerToken: ', ',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Vitals - Respiration Rate',
      token: 'vital_resp_rate',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'vitals',
          field: 'respiration',
          joinerToken: ', ',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Vitals - Blood Pressure',
      token: 'vital_blood_pressure',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'vitals');
        return records
          .map(record => record.bpSystolic && record.bpDiastolic ? `${record.bpSystolic}/${record.bpDiastolic}` : '')
          .filter(Boolean)
          .join(', ');
      },
    },
    {
      name: 'Vitals - Temperature',
      token: 'vital_temperature',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'vitals',
          field: 'temperature',
          joinerToken: ', ',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Vitals - Visual Acuity (R)',
      token: 'vital_visual_acuity_right',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'vitals',
          field: 'visualAcuityRight',
          joinerToken: ', ',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Vitals - Visual Acuity (L)',
      token: 'vital_visual_acuity_left',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'vitals',
          field: 'visualAcuityLeft',
          joinerToken: ', ',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Vitals - Visual Remarks',
      token: 'vital_visual_remarks',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'vitals',
          field: 'visualRemarks',
          joinerToken: ', ',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Vitals - Color Vision',
      token: 'vital_color_vision',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'vitals',
          field: 'colorVision',
          joinerToken: ', ',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'ENT Specialty Feature',
      token: 'patient_ent_note',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'ent-note');
        return records.map(formatENTNote).filter(Boolean).join('</br>');
      },
    },
    {
      name: 'OB-GYN Specialty Feature',
      token: 'patient_ob_note',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'ob-note');
        return records.map(formatOBNote).filter(Boolean).join('</br>');
      },
    },
    {
      name: 'Physical Exam',
      token: 'patient_physical_exam',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'physical-exam');
        return records.map(formatPE).filter(Boolean).join('</br>');
      },
    },
    {
      name: 'Physical Exam - General Status',
      token: 'pe_general_status',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'physical-exam');
        return records.map(record => record?.general?.status?.toUpperCase()).filter(Boolean).join('</br>');
      },
    },
    {
      name: 'Physical Exam - General Remarks',
      token: 'pe_general_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'remarks',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Head Status',
      token: 'pe_head_status',
      dataSource: 'medical-records',
      inputType: 'textarea',
      format: (data) => {
        const records = getRecords(data, 'physical-exam');
        return records.map(record => record?.head?.status?.toUpperCase()).filter(Boolean).join('</br>');
      },
    },
    {
      name: 'Physical Exam - Head Remarks',
      token: 'pe_head_text',
      dataSource: 'medical-records',
      inputType: 'textarea',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'head.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Eyes Status',
      token: 'pe_eyes_status',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'physical-exam');
        return records.map(record => record?.eyes?.status?.toUpperCase()).filter(Boolean).join('</br>');
      },
    },
    {
      name: 'Physical Exam - Eyes Remarks',
      token: 'pe_eyes_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'general.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Ears Status',
      token: 'pe_ears_status',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'physical-exam');
        return records.map(record => record?.ears?.status?.toUpperCase()).filter(Boolean).join('</br>');
      },
    },
    {
      name: 'Physical Exam - Ears Remarks',
      token: 'pe_ears_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'ears.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Nose Status',
      token: 'pe_nose_status',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'physical-exam');
        return records.map(record => record?.nose?.status?.toUpperCase()).filter(Boolean).join('</br>');
      },
    },
    {
      name: 'Physical Exam - Nose Remarks',
      token: 'pe_nose_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'nose.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Ears, Eyes, Nose Status',
      token: 'pe_earseyesnose_status',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'physical-exam');
        return records.map((record) => {
          const statusDefaults = [
            { value: 'normal', name: 'Normal' },
            { value: 'positive', name: 'Positive', isPositive: true },
          ];
          const statuses = [
            ...[(record?.nose?.status || '')],
            ...[(record?.ears?.status || '')],
            ...[(record?.eyes?.status || '')],
          ].filter(Boolean);

          const hasPositive = statuses.findIndex(s =>
            statusDefaults.findIndex(sd => s === sd.value && sd.isPositive) > -1,
          ) > -1;

          if (hasPositive) {
            return 'POSITIVE';
          } else if (statuses.filter(s => !isEmpty(s)).length > 0) {
            return 'NORMAL';
          } else {
            return '';
          }
        });
      },
    },
    {
      name: 'Physical Exam - Ears, Eyes, Nose Remarks',
      token: 'pe_earseyesnose_text',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'physical-exam');
        const formattedRecords = records.map((record) => {
          const ears = record?.ears?.text;
          const eyes = record?.eyes?.text;
          const nose = record?.nose?.text;

          return `${ears}; ${eyes}; ${nose}`;
        });
        return formattedRecords?.[0] || '';
      },
    },
    {
      name: 'Physical Exam - Head and Neck Status',
      token: 'pe_headneck_status',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'physical-exam');
        const mapped = records.map((record) => {
          const statusDefaults = [
            { value: 'normal', name: 'Normal' },
            { value: 'positive', name: 'Positive', isPositive: true },
          ];
          const statuses = [
            ...(record?.head?.status || ''),
            ...(record?.neck?.status || ''),
          ];

          const hasPositive = statuses.findIndex(s =>
            statusDefaults.findIndex(sd => s === sd.value && sd.isPositive) > -1,
          ) > -1;

          if (hasPositive) return 'POSITIVE';
          if (statuses.filter(s => !isEmpty(s)).length > 0) return 'NORMAL';
          return '';
        });
        return mapped?.[0] || '';
      },
    },
    {
      name: 'Physical Exam - Head and Neck Remarks',
      token: 'pe_headneck_text',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'physical-exam');
        const mapped = records.map((record) => {
          const head = record?.head?.text;
          const neck = record?.neck?.text;

          return `${head}; ${neck}`;
        });
        return mapped?.[0] || '';
      },
    },
    {
      name: 'Physical Exam - Chest and Breast Status',
      token: 'pe_chestbreast_status',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'physical-exam');
        const mapped = records.map((record) => {
          const statusDefaults = [
            { value: 'normal', name: 'Normal' },
            { value: 'positive', name: 'Positive', isPositive: true },
          ];
          const statuses = [
            ...(record?.breasts?.status || ''),
            ...(record?.chest?.status || ''),
          ];

          const hasPositive = statuses.findIndex(s =>
            statusDefaults.findIndex(sd => s === sd.value && sd.isPositive) > -1,
          ) > -1;

          if (hasPositive) return 'POSITIVE';
          if (statuses.filter(s => !isEmpty(s)).length > 0) return 'NORMAL';
          return '';
        });
        return mapped?.[0] || '';
      },
    },
    {
      name: 'Physical Exam - Chest and Breast Remarks',
      token: 'pe_chestbreast_text',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'physical-exam');
        const mapped = records.map((record) => {
          const breasts = record?.breasts?.text;
          const chest = record?.chest?.text;

          return `${breasts}; ${chest}`;
        });
        return mapped?.[0] || '';
      },
    },
    {
      name: 'Physical Exam - Neck Status',
      token: 'pe_neck_status',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'neck.status',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Neck Remarks',
      token: 'pe_neck_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'neck.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Throat Status',
      token: 'pe_throat_status',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'throat.status',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Throat Remarks',
      token: 'pe_throat_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'throat.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Breath sound Status',
      token: 'pe_breath_sounds_status',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'breathSounds.status',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Breath sound Remarks',
      token: 'pe_breath_sounds_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'breathSounds.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Respiratory Status',
      token: 'pe_respiratory_status',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'respiratory.status',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Respiratory Remarks',
      token: 'pe_respiratory_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'respiratory.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Cardiovascular Status',
      token: 'pe_cardiovascular_status',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'respiratory.status',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Cardiovascular Remarks',
      token: 'pe_cardiovascular_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'cardiovascular.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Breast Status',
      token: 'pe_breasts_status',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'breasts.status',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Breast Remarks',
      token: 'pe_breasts_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'breasts.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Chest Status',
      token: 'pe_chest_status',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'chest.status',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Chest Remarks',
      token: 'pe_chest_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'chest.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Back Remarks',
      token: 'pe_back_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'back.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Back Status',
      token: 'pe_back_status',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'back.status',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Abdomen Remarks',
      token: 'pe_abdomen_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'abdomen.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Abdomen Status',
      token: 'pe_abdomen_status',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'abdomen.status',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Gastrointestinal Remarks',
      token: 'pe_gastrointestinal_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'gastrointestinal.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Gastrointestinal Status',
      token: 'pe_gastrointestinal_status',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'gastrointestinal.status',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Genitourinary Remarks',
      token: 'pe_genitourinary_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'genitourinary.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Genitourinary Status',
      token: 'pe_genitourinary_status',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'genitourinary.status',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Musculoskeletal Remarks',
      token: 'pe_musculoskeletal_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'musculoskeletal.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Musculoskeletal Status',
      token: 'pe_musculoskeletal_status',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'musculoskeletal.status',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Skin Remarks',
      token: 'pe_skin_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'skin.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Skin Status',
      token: 'pe_skin_status',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'skin.status',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Endocrine Remarks',
      token: 'pe_endocrine_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'endocrine.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Endocrine Status',
      token: 'pe_endocrine_status',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'endocrine.status',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Psychiatric Remarks',
      token: 'pe_psychiatric_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'psychiatric.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Psychiatric Status',
      token: 'pe_psychiatric_status',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'psychiatric.status',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Hematologic Remarks',
      token: 'pe_hematologic_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'hematologicLymphatic.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Hematologic Status',
      token: 'pe_hematologic_status',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'hematologicLymphatic.status',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Allergic / Immunologic Remarks',
      token: 'pe_allergicImmunologic_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'allergicImmunologic.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Allergic / Immunologic Status',
      token: 'pe_allergicImmunologic_status',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'allergicImmunologic.status',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Extermities Remarks',
      token: 'pe_extermities_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'extermities.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Extermities Status',
      token: 'pe_extermities_status',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'extermities.status',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Neurologic Remarks',
      token: 'pe_neurologic_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'neurologic.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Neurologic Status',
      token: 'pe_neurologic_status',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'neurologic.status',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Rectal Remarks',
      token: 'pe_rectal_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'rectal.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Rectal Status',
      token: 'pe_rectal_status',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'rectal.status',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Genitalia Remarks',
      token: 'pe_genitalia_text',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'genitalia.text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Physical Exam - Genitalia Status',
      token: 'pe_genitalia_status',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'physical-exam',
          field: 'genitalia.status',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Impression',
      token: 'patient_impression',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'assessment',
          subtype: 'impression',
          field: 'text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Diagnosis',
      token: 'patient_diagnosis',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'assessment',
          subtype: 'diagnosis',
          field: 'text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Diagnosis - ICD 10 Code',
      token: 'diagnosis_icd10',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'assessment', 'diagnosis');
        return records.map((record) => {
          if (!record?.diagnosisCode && !record?.icd10) return null;
          const code = record.diagnosisCode || record.icd10;
          const text = record.diagnosisText;
          return `${code} - ${text}`;
        })
          .filter(Boolean)
          .join('</br>');
      },
    },
    {
      name: 'Care Plan Notes',
      token: 'patient_care_plan',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'care-plan',
          field: 'text',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Prescriptions',
      token: 'patient_medication_order',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'medication-order');
        return records.map(formatPrescription).filter(Boolean).join('</br>');
      },
    },
    {
      name: 'Laboratory Order',
      token: 'patient_lab_order',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'lab-test-order');
        return records.map(formatDiagnosticOrder).filter(Boolean).join('</br>');
      },
    },
    {
      name: 'Imaging Order',
      token: 'patient_imaging_order',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'imaging-test-order');
        return records.map(formatDiagnosticOrder).filter(Boolean).join('</br>');
      },
    },
    {
      name: 'Procedure Orders',
      token: 'patient_medical_procedure_orders',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'medical-procedure-order',
          field: 'name',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Procedure',
      token: 'patient_medical_procedures',
      dataSource: 'medical-records',
      format: (data) => {
        const options = {
          type: 'medical-procedure',
          field: 'name',
          joinerToken: '</br>',
        };
        return recordsFieldFormatter(data, options);
      },
    },
    {
      name: 'Dental Baseline',
      token: 'patient_dental_note_baseline',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'dental-note', 'baseline');
        return records.map(formatDentalNote).filter(Boolean).join('</br>');
      },
    },
    {
      name: 'Dental Work Proposed',
      token: 'patient_dental_note_order',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'dental-note', 'order');
        return records.map(formatDentalNote).filter(Boolean).join('</br>');
      },
    },
    {
      name: 'Dental Work Done',
      token: 'patient_dental_note_result',
      dataSource: 'medical-records',
      format: (data) => {
        const records = getRecords(data, 'dental-note', 'result');
        return records.map(formatDentalNote).filter(Boolean).join('</br>');
      },
    },
    {
      name: 'Dental Work Done Table',
      token: 'dental_note_result_table',
      dataSource: 'medical-records',
      format: (data) => {
        const dentalNotes = getRecords(data, 'dental-note', 'result');
        const diagnoses = getRecords(data, 'assessment', 'diagnosis');
        return formatDentalNoteTable(dentalNotes, diagnoses);
      },
    },
    {
      name: 'Custom Text',
      token: 'custom_text',
    },
    {
      name: 'Custom Dropdown',
      token: 'custom_choices',
    },
  ];

  const TEMPLATE_TOKENS_MAP = new Map(FORM_TEMPLATE_TOKENS.map(obj => [obj.token, obj]));

  return {
    FORM_TEMPLATE_TOKENS,
    PME_ENCOUNTER_EXAM_TYPES,
    PME_ENCOUNTER_STATUS_TYPES,
    TEMPLATE_TOKENS_MAP,
    groupPackageMapper,
    monitoringReportMapper,
    pmeEncounterStatusMapper,
    pmeEncounterStatusQueryBuilder,
    pmeWorklistMapper,
  };
};

export const useEditorHelper = () => {
  function editorTempalteToRawTemplate (editorTemplate) {
    const elements = document.getElementsByClassName('ape-report-editor-tokens');
    let rawTemplate = cloneDeep(editorTemplate);
    if (elements.length) {
      for (let i = 0; i < elements.length; i++) {
        const elem = elements.item(i);
        const elementId = elem.id;
        const stringElem = elem.outerHTML;
        rawTemplate = rawTemplate.replace(stringElem, `{${elementId}}`);
      };
    }

    return rawTemplate;
  }

  function getSummaryReportFields (rawTemplate, config) {
    const summaryReportFields = PME_REPORT_MEDICAL_RECORDS_TOKENS.reduce((acc, curr) => {
      return {
        ...acc,
        [curr]: false,
      };
    }, {});

    const regex = /(?<=\{)\w+(?=\})/g;
    const tokens = rawTemplate?.match(regex) || [];

    const uniqueTokens = uniq(map(tokens, (token) => {
      const tokenArr = token.split('_');
      tokenArr.pop(); // remove number at the end of the array
      token = tokenArr.join('_');
      return token;
    }));

    const hiddenItemsInPMEReport = config?.hiddenItemsInPMEReport || {};
    const obj = uniqueTokens.reduce((acc, curr) => {
      return {
        ...acc,
        [curr]: hiddenItemsInPMEReport?.[curr] || summaryReportFields?.value?.[curr] || false,
      };
    }, {});
    return {
      hiddenItemsInPMEReport: obj,
    };
  }

  return {
    editorTempalteToRawTemplate,
    getSummaryReportFields,
  };
};

export const useMedicalHistoryUIComponentHandler = (report, records) => {
  // HTML string
  const htmlString = report;
  // Create a new DOMParser instance
  const parser = new DOMParser();
  // Parse the HTML string
  const parsedHTML = parser.parseFromString(htmlString, 'text/html');
  // Access the parsed HTML
  const medicalHistoryGroups = parsedHTML.querySelectorAll('#report-template-medical-history-group');

  const medicalHistories = records?.filter(record => record.type === 'medical-history') || [];

  const medicalHistoryGroup = document.createElement('div');
  medicalHistoryGroup.style.display = 'grid';
  medicalHistoryGroup.style.gridTemplateColumns = 'repeat(3, 1fr)';
  // medicalHistoryGroup.style.outline = '1px solid green';
  medicalHistoryGroup.style.gap = '5px';

  const medicalHistoryGroupsHTML = medicalHistories.map((medicalHistory, index) => {
    return `<small>${index + 1}) <b>${medicalHistory.medicalCondition}</b> - ${medicalHistory.notes}</small>`.trim();
  });

  medicalHistoryGroup.innerHTML = medicalHistoryGroupsHTML.join('');

  // TODO: implement medical records replacement
  medicalHistoryGroups.forEach((item) => {
    item.innerHTML = medicalHistoryGroup.outerHTML;
  });

  return parsedHTML.body.innerHTML;
};
