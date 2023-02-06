import { useHelpers } from '@/composables/helpers';
import { differenceInYears, format } from 'date-fns';

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

  const PME_APE_REPORT_PATIENT_KEYS_MAP = [
    {
      token: 'patient_name',
      field: '',
      format: (data) => {
        return formatName(data?.name, 'lastName, firstName middleInitial');
      },
    },
    {
      token: 'patient_full_name_mid_name',
      field: '',
      format: (data) => {
        return formatName(data?.name);
      },
    },
    {
      token: 'patient_sex',
      field: '',
      format: (data) => {
        const sex = data?.sex || '';
        return `${sex.charAt(0).toUpperCase()}${sex.substring(1, sex.length)}`;
      },
    },
    {
      token: 'patient_age',
      field: '',
      format: (data) => {
        const dob = data?.dateOfBirth;
        if (!dob) return null;
        const age = differenceInYears(new Date(), new Date(dob));
        if (age > 1) return `${age} years`;
        return `${age} year`;
      },
    },
    {
      token: 'patient_first_name',
      field: '',
      format: (data) => {
        return data?.name?.firstName;
      },
    },
    {
      token: 'patient_middle_name',
      field: '',
      format: (data) => {
        return data?.name?.middleName;
      },
    },
    {
      token: 'patient_last_name',
      field: '',
      format: (data) => {
        return data?.name?.lastName;
      },
    },
    {
      token: 'patient_dob',
      field: '',
      format: (data) => {
        format(data?.dateOfBirth || new Date(), 'MMM dd, yyyy');
      },
    },
    {
      token: 'patient_blood_type',
      field: '',
      format: (data) => {
        return data?.bloodType;
      },
    },
    {
      token: 'patient_mobile_no',
      field: '',
      format: (data) => {
        return data?.mobileNo;
      },
    },
    {
      token: 'patient_marital_status',
      field: '',
      format: (data) => {
        return data?.maritalStatus;
      },
    },
    {
      token: 'patient_full_address',
      field: '',
      format: (data) => {
        return formatAddress(data?.address);
      },
    },
    {
      token: 'patient_osca_id',
      field: '',
      format: (data) => {
        return data?.OSCASeniorCitizenId;
      },
    },
    {
      token: 'patient_pwd_id',
      field: '',
      format: (data) => {
        return data?.PWDId;
      },
    },
    {
      token: 'patient_hmos',
      field: '',
      format: (data) => {
        return data?.insuranceCards?.map(card => card.name).join(', ');
      },
    },
    {
      token: 'patient_hmo_accountno',
      field: '',
      format: (data) => {
        return 'patient_hmo_accountno';
      },
    },
    {
      token: 'patient_hmo_validity',
      field: '',
      format: (data) => {
        return 'patient_hmo_validity';
      },
    },
    {
      token: 'patient_hmo_expiry',
      field: '',
      format: (data) => {
        return 'patient_hmo_expiry';
      },
    },
    {
      token: 'patient_hmo_status',
      field: '',
      format: (data) => {
        return 'patient_hmo_status';
      },
    },
    {
      token: 'patient_companies',
      field: '',
      format: (data) => {
        const companies = data?.companies || [];
        const names = companies?.map(company => company?.name);
        return names?.join(', ');
      },
    },
    {
      token: 'patient_company_accountno',
      field: '',
      format: (data) => {
        return 'patient_company_accountno';
      },
    },
    {
      token: 'patient_dp',
      field: '',
      format: (data) => {
        const src = data?.picURL;
        return `<img src="${src}" style="width: 100px;" />`;
      },
    },
    {
      token: 'patient_lg_dp',
      field: '',
      format: (data) => {
        const src = data?.picURL;
        return `<img src="${src}" style="width: 200px;" />`;
      },
    },
    {
      token: 'patient_xl_dp',
      field: '',
      format: (data) => {
        const src = data?.picURL;
        return `<img src="${src}" style="width: 300px;" />`;
      },
    },
    {
      token: 'patient_full_width_dp',
      field: '',
      format: (data) => {
        const src = data?.picURL;
        return `<img src="${src}" style="width: 100%;" />`;
      },
    },
  ];

  return {
    PME_APE_REPORT_PATIENT_KEYS_MAP,
    PME_ENCOUNTER_EXAM_TYPES,
    PME_ENCOUNTER_STATUS_TYPES,
    pmeEncounterStatusMapper,
    pmeEncounterStatusQueryBuilder,
    pmeWorklistMapper,
  };
};
