<template lang="pug">
q-expansion-item(expand-icon="la la-angle-down" default-opened)
  template(v-slot:header)
    q-item-section(avatar)
      q-avatar(size="50px" style="background: #f2f2f2")
        img(v-if="patient.picURL" :src="patient.picURL")
        q-icon(v-else name="la la-user")
    q-item-section
      q-item-label {{name}}
        template(v-for="tag in tags")
          q-badge.q-ml-sm {{tag}}
      q-item-label(caption)
        span {{sex}}
        q-icon(v-if="age" name="la la-angle-right" size="20")
        span {{age}}
        q-icon(v-if="mobileNo" name="la la-angle-right" size="20")
        span {{mobileNo}}
      q-item-label(caption)
  q-separator
  q-card
    q-list(bordered)
      q-item
        q-item-section
          q-item-label {{name}}
            template(v-for="tag in tags")
              q-badge(dense).q-ml-sm {{tag}}
          q-item-label(caption) Patient Name
      q-item(v-if="medicalNote")
        q-item-section
          q-item-label {{medicalNote}}
          q-item-label(caption) Notes
      q-item
        q-item-section
          q-item-label {{dob}} - {{age}}
          q-item-label(caption) Birthday - Age
      q-item
        q-item-section
          q-item-label {{sex}}
          q-item-label(caption) Sex
      q-item
        q-item-section
          q-item-label {{mobileNo}}
          q-item-label(caption) Mobile No.
      q-item(v-if="OSCASeniorCitizenId")
        q-item-section
          q-item-label {{OSCASeniorCitizenId}}
          q-item-label(caption) Senior Citizen Id
      q-item(v-if="PWDId")
        q-item-section
          q-item-label {{PWDId}}
          q-item-label(caption) PWD Id
      q-item(v-if="bloodType")
        q-item-section
          q-item-label {{bloodType}}
          q-item-label(caption) Blood Type
      q-separator(spaced)
      q-item-label(header) Insurances
      template(v-for="insurance in insurances")
        q-item
          q-item-section
            q-item-label {{insurance.name}}
            q-item-label(caption) {{insurance.status}}
      q-separator(spaced)
      q-item-label(header) Companies
      template(v-for="company in companies")
        q-item
          q-item-section
            q-item-label {{company.name}}
            q-item-label(caption) {{company.status}}
</template>

<script>
import { usePatient } from '@/composables/patient';
import { toRef } from 'vue';

export default {
  props: {
    patient: {
      type: Object,
      default: () => ({}),
    },
  },
  setup (props) {
    const { formatted } = usePatient(toRef(props, 'patient'));

    return {
      ...formatted,
    };
  },
};
</script>
