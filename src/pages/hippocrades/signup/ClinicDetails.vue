<template lang="pug">
generic-page(
  :loading="loading"
)
  div(style="min-height: 100vh;").row.items-center.justify-center
    div.col-xs-12.col-md-5.text-center
      h1.text-h3.text-weight-medium #[span.text-primary Automate] Clinic Workflow for #[span.text-primary Better Performance]
      div(v-if="!isScreenMobile").q-px-xl
        div.q-px-xl
          img(
            src="../../../assets/hippocrades/images/hippocrades-clinics.jpg"
          ).full-width
    div(style="min-height: 100vh;").col-xs-12.col-md-7.bg-primary.text-center
      div.row.items-center.justify-center
        div.col.q-pa-xl
          img(
            width="500"
            src="../../../assets/hippocrades/images/hippocrades-logo.png"
          )
          q-form(ref="formRef")
            div.row.justify-center
              div.col-xs-12.col-md-7.q-gutter-sm.q-pa-sm.text-left
                p.text-h6.text-white Account Details
                q-input(
                  v-model="email"
                  type="email"
                  label="Email Address"
                  color="white"
                  dark
                  outlined
                  :rules="[v => !!v || 'This is required']"
                )
                q-input(
                  v-model="password"
                  label="Password"
                  color="white"
                  dark
                  outlined
                  :rules="[v => !!v || 'This is required']"
                  :type="showPass ? 'text' : 'password'"
                )
                  template(v-slot:append)
                    q-icon(
                      class="cursor-pointer"
                      :name="showPass ? 'mdi-eye-off' : 'mdi-eye-outline'"
                      @click="showPass = !showPass"
                    )
              div.col-xs-12.col-md-7.q-gutter-sm.q-pa-sm.text-left
                p.text-h6.text-white Personal Details
                q-input(
                  v-model="firstName"
                  label="First Name"
                  color="white"
                  dark
                  outlined
                  :rules="[v => !!v || 'This is required']"
                )
                q-input(
                  v-model="lastName"
                  label="Last Name"
                  color="white"
                  dark
                  outlined
                  :rules="[v => !!v || 'This is required']"
                )
              div.col-xs-12.col-md-7.q-gutter-sm.q-pa-sm.text-left
                p.text-h6.text-white Clinic Details
                q-select(
                  v-model="clinicType"
                  label="Clinic Type"
                  color="white"
                  dark
                  outlined
                  return-object
                  :rules="[v => !!v || 'This is required']"
                  :options="clinicTypes"
                )
                q-input(
                  v-model="clinicName"
                  label="Clinic Name"
                  color="white"
                  dark
                  outlined
                  :rules="[v => !!v || 'This is required']"
                )
                q-select(
                  v-model="userRole"
                  label="Your Role"
                  color="white"
                  dark
                  outlined
                  :options="userRoles"
                  :rules="[v => !!v || 'This is required']"
                )
                q-input(
                  v-if="isDoctor"
                  v-model="doc_PRCLicenseNo"
                  label="PRC License No"
                  color="white"
                  dark
                  outlined
                  :rules="[v => !!v || 'This is required']"
                )
              div.col-xs-12.col-md-7.q-gutter-sm.q-pa-sm.text-left
                div.row.q-gutter-sm
                  q-space
                  q-btn(
                    color="primary"
                    label="Cancel"
                    outline
                    no-caps
                  ).text-white
                  q-btn(
                    color="white"
                    label="Create Trial Account"
                    no-caps
                    @click="submit"
                  ).text-black
      //- q-card(flat)
      //-   q-card-section.text-center

      //-   q-card-section
    q-dialog(
      v-model="success"
      full-screen
      persistent
    )
      q-card(style="width: 500px;")
        q-card-section
          p.text-h6 🎊 Congratulations!
          p Your Trial Account is now ready!
        q-card-actions
          q-space
          q-btn(
            type="a"
            label="Let's go!"
            color="primary"
            unelevated
            :href="demoURL"
          )
</template>

<script>
import { useQuasarMixins } from '@/composables/quasar-mixins';
import GenericPage from '@/components/commons/GenericPage';
import { computed, ref } from 'vue';
import { axios } from 'src/boot/axios';

export default {
  components: {
    GenericPage,
  },
  setup () {
    const { isScreenMobile, showSnack } = useQuasarMixins();
    const loading = ref(false);
    const success = ref(false);
    const formRef = ref(null);
    const email = ref('');
    const password = ref('');
    const firstName = ref('');
    const lastName = ref('');
    const clinicType = ref('');
    const clinicName = ref('');
    const userRole = ref('');
    // eslint-disable-next-line camelcase
    const doc_PRCLicenseNo = ref('');
    const showPass = ref(false);
    const clinicTypes = [
      {
        label: 'Doctor\'s Clinic',
        value: {
          type: 'doctor',
          orgProps: {
            type: 'facility',
            types: ['doctor'],
          },
        },
      },
      {
        label: 'Outpatient Clinic',
        value: {
          type: 'clinic',
          orgProps: {
            type: 'facility',
            types: ['clinic'],
          },
        },
      },
      {
        label: 'Diagnostics',
        value: {
          type: 'diagnostic',
          orgProps: {
            type: 'facility',
            types: ['diagnostic'],
          },
        },
      },
    ];
    const userRoles = [
      { label: 'Physician/Owner', value: ['doctor', 'admin'] },
      { label: 'Administrator', value: ['admin'] },
    ];

    const isDoctor = computed(() => {
      return /doctor/.test(userRole.value.value);
    });

    async function submit () {
      try {
        if (!await formRef.value.validate()) return;
        loading.value = true;
        const payload = {
          skipMobileNoVerification: true,
          email: email.value,
          password: email.value,
          personalDetails: {
            name: {
              firstName: firstName.value,
              lastName: lastName.value,
            },
            // eslint-disable-next-line camelcase
            ...doc_PRCLicenseNo.value && { doc_PRCLicenseNo: doc_PRCLicenseNo.value },
          },
          organization: {
            name: clinicName.value,
            superadmin: {
              roles: userRole.value.value,
            },
            ...clinicType.value.value.orgProps,
            subscription: {
              trial: true,
            },
          },
        };

        await axios({
          method: 'POST',
          url: `${process.env.API_URL}/accounts`,
          data: payload,
        });

        showSnack({
          message: 'Your Trial Account has been created successfully!',
          color: 'positive',
        });

        email.value = '';
        password.value = '';
        firstName.value = '';
        lastName.value = '';
        clinicType.value = '';
        clinicName.value = '';
        userRole.value = '';
        // eslint-disable-next-line camelcase
        doc_PRCLicenseNo.value = '';

        await formRef.value.reset();
        await formRef.value.resetValidation();

        // show success dialog
        success.value = true;
      } catch (e) {
        console.error(e.message);
        showSnack({
          message: 'There was an error',
          color: 'negative',
        });
      } finally {
        loading.value = false;
      }
    }

    return {
      isScreenMobile,
      loading,
      success,
      formRef,
      demoURL: process.env.DEMO_URL,
      email,
      password,
      firstName,
      lastName,
      clinicType,
      clinicName,
      userRole,
      isDoctor,
      // eslint-disable-next-line camelcase
      doc_PRCLicenseNo,
      showPass,
      clinicTypes,
      userRoles,
      submit,
    };
  },
};
</script>
