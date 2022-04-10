<template lang="pug">
generic-page
  div(style="height: 100vh;").row.items-center.justify-center
    div.col-xs-12.col-md-5.text-center
      h1.text-h3.text-weight-medium #[span.text-primary Automate] Clinic Workflow for #[span.text-primary Better Performance]
      div(v-if="!isScreenMobile").q-px-xl
        div.q-px-xl
          img(
            src="../../../assets/hippocrades/images/hippocrades-clinics.jpg"
          ).full-width
        pre {{isScreenMobile}}
    div(style="height: 100vh").col-xs-12.col-md-7.bg-primary.text-center
      div.row.items-center.justify-center
        div.col.q-pa-xl
          img(
            width="500"
            src="../../../assets/hippocrades/images/hippocrades-logo.png"
          )
          q-form
            div.row.justify-center
              div.col-xs-12.col-md-7.q-gutter-sm.q-pa-sm.text-left
                p.text-h6.text-white Account Details
                q-input(
                  type="email"
                  label="Email Address"
                  color="white"
                  dark
                  outlined
                )
                q-input(
                  type="password"
                  label="Password"
                  color="white"
                  dark
                  outlined
                )
              div.col-xs-12.col-md-7.q-gutter-sm.q-pa-sm.text-left
                p.text-h6.text-white Personal Details
                q-input(
                  label="First Name"
                  color="white"
                  dark
                  outlined
                )
                q-input(
                  label="Last Name"
                  color="white"
                  dark
                  outlined
                )
              div.col-xs-12.col-md-7.q-gutter-sm.q-pa-sm.text-left
                p.text-h6.text-white Clinic Details
                q-input(
                  label="Clinic Type"
                  color="white"
                  dark
                  outlined
                )
                q-input(
                  label="Clinic Name"
                  color="white"
                  dark
                  outlined
                )
                q-input(
                  label="Your Role"
                  color="white"
                  dark
                  outlined
                )
              div.col-xs-12.col-md-7.q-gutter-sm.q-pa-sm.text-left
                q-btn(
                  color="primary"
                ) Submit
      //- q-card(flat)
      //-   q-card-section.text-center

      //-   q-card-section
</template>

<script>
import { useQuasarMixins } from '@/composables/quasar-mixins';
import GenericPage from '@/components/commons/GenericPage';

export default {
  components: {
    GenericPage,
  },
  setup () {
    const { isScreenMobile } = useQuasarMixins();

    return {
      isScreenMobile,
    };
  },
};
</script>
