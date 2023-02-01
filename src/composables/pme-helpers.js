import { useHelpers } from '@/composables/helpers';
import { format } from 'date-fns';

export default () => {
  const { formatName } = useHelpers();
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
    const name = formatName(item.patient?.name || {}, 'lastName, firstName');
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

  return {
    PME_ENCOUNTER_EXAM_TYPES,
    PME_ENCOUNTER_STATUS_TYPES,
    pmeEncounterStatusMapper,
    pmeEncounterStatusQueryBuilder,
    pmeWorklistMapper,
  };
};
