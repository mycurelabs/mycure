<template lang="pug">
generic-page
  div(style="height: 100vh;").row.items-center.justify-center
    div.col-xs-12.col-md-5.text-center
      h1.text-h3.text-weight-medium #[span.text-primary Automate] Clinic Workflow for #[span.text-primary Better Performance]
      div(v-if="!isScreenMobile").q-px-xl
        div.q-px-xl
          img(
            src="../../assets/hippocrades/images/hippocrades-clinics.jpg"
          ).full-width
        pre {{isScreenMobile}}
    div(style="height: 100vh").col-xs-12.col-md-7.bg-primary.text-center
      div.row.items-center.justify-center
        div.col.q-pa-xl
          img(
            width="500"
            src="../../assets/hippocrades/images/hippocrades-logo.png"
          )
          q-form
            div.row.justify-center
              div.col-xs-12.col-md-6.q-gutter-sm.q-pa-sm
                q-input(
                  label="Email Address"
                  color="white"
                  dark
                  outlined
                )
                q-input(
                  label="Password"
                  color="white"
                  dark
                  outlined
                )
              div.col-xs-12.col-md-6.q-gutter-sm.q-pa-sm
                q-input(
                  label="Email Address"
                  color="white"
                  dark
                  outlined
                )
                q-input(
                  label="Password"
                  color="white"
                  dark
                  outlined
                )
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
