import { formatName } from '@/utils';
import { format, differenceInYears } from 'date-fns';

export default class Patient {
  constructor (patient) {
    this.id = patient?.id;
    this.patient = patient;
    this.dateOfBirth = patient?.dateOfBirth;
    this.mobileNo = patient?.mobileNo;
    this.tags = patient?.tags;
    this.companies = patient?.companies || [];
    this.firstCompany = this.companies?.[0] || {};
    this.insurances = patient?.insuranceCards;
    this.firstInsurance = this.insurances?.[0] || {};
  }

  name (format = 'lastName, firstName middleInitial') {
    return formatName(this.patient?.name, format);
  }

  dateOfBirth () {
    format(this.dateOfBirth || new Date(), 'MMM dd, yyyy');
  }

  age () {
    const age = differenceInYears(new Date(), new Date(this.dateOfBirth));
    if (age > 1) return `${age} years`;
    return `${age} year`;
  }

  sex () {
    const sex = this.patient?.sex || '';
    return `${sex.charAt(0).toUpperCase()}${sex.substring(1, sex.length)}`;
  }
}
