import { computed } from 'vue';
import { useHelpers } from '@/composables/helpers';
import { format, differenceInYears } from 'date-fns';

export const usePatient = (patient) => {
  const { formatName } = useHelpers();
  const companies = computed(() => patient?.value?.companies || []);
  const firstCompany = computed(() => companies.value?.[0] || {});
  const insurances = computed(() => patient?.value?.insuranceCards);
  const firstInsurance = computed(() => insurances.value?.[0] || {});
  const name = computed(() => formatName(patient?.value?.name || {}, 'lastName, firstName middleInitial'));
  const sex = computed(() => {
    const sex = patient?.value?.sex || '';
    return `${sex.charAt(0).toUpperCase()}${sex.substring(1, sex.length)}`;
  });
  const dob = computed(() => format(patient?.value?.dateOfBirth || new Date(), 'MMM dd, yyyy'));
  const age = computed(() => {
    const dob = patient?.value?.dateOfBirth;
    if (!dob) return null;
    const age = differenceInYears(new Date(), new Date(dob));
    if (age > 1) return `${age} years`;
    return `${age} year`;
  });
  const mobileNo = computed(() => patient?.value?.mobileNo);
  const tags = computed(() => patient?.value?.tags || []);
  return {
    formatted: {
      id: patient?.id,
      age,
      companies,
      dob,
      firstCompany,
      firstInsurance,
      insurances,
      mobileNo,
      name,
      sex,
      tags,
    },
    raw: patient,
  };
};
