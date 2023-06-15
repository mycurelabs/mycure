// TODO: Implement

import { computed } from 'vue';
import { formatDoctorName as formatDoctorNameUtil } from '@/utils';

// usePmeSignatories
export default (apeReport) => {
  // const examinerDetails = computed(() => selectedExaminer.value || apeReport?.examinedByData);
  let examinedByData = apeReport?.examinedByData;
  const examinerDetails = computed({
    get () {
      return examinedByData;
    },
    set (newValue) {
      examinedByData = newValue;
    },
  });
  const examinerNameFormatted = computed(() => formatDoctorName(examinerDetails.value));

  const reviwerDetails = computed(() => apeReport?.reviewedByData);
  const reviewerNameFormatted = computed(() => formatDoctorName(reviwerDetails.value));

  const createdByDetails = computed(() => apeReport?.createdByDetails);
  const createdByNameFormatted = computed(() => formatDoctorName(createdByDetails.value));

  const finalizedByDetails = computed(() => apeReport?.finalizedByData);
  const finalizedByNameFormatted = computed(() => formatDoctorName(finalizedByDetails.value));

  function formatDoctorName (personalDetails) {
    return formatDoctorNameUtil(personalDetails);
  }

  return {
    examinerDetails,
    examinerNameFormatted,
    reviwerDetails,
    reviewerNameFormatted,
    createdByDetails,
    createdByNameFormatted,
    finalizedByDetails,
    finalizedByNameFormatted,
    formatDoctorName,
  };
};
