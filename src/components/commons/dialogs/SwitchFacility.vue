<template lang="pug">
q-btn(
  icon="la la-exchange-alt"
  color="primary"
  flat
  dense
  round
  @click.stop="dialog = true"
)
  q-tooltip Switch Facility

q-dialog(v-model="dialog")
  q-card(style="width: 600px; max-width: 80vw;")
    q-toolbar(flat)
      q-toolbar-title Switch Facility
    q-separator
    q-card-section(style="max-height: 50vh" class="scroll")
      q-list(style="margin: 0px; padding: 0px;")
        template(v-for="organization in organizations")
          q-item(
            clickable
            v-ripple
            @click="switchFacility(organization)"
          )
            q-item-section(avatar)
              q-avatar
                img(:src="organization.picURL")
            q-item-section
              q-item-label {{organization.name}}

q-dialog(
  v-model="loading"
  full-screen
  persistent
)
  div.column.items-center
    h1.text-h5.text-white Switching to {{selectedOrganization.name}}...
    q-spinner(
      size="50px"
      color="white"
    )
</template>

<script>
import { computed, ref } from 'vue';
import { useUserStore } from '@/stores/current-user';
import { useRouter } from 'vue-router';
import { useQuasarMixins } from '@/composables/quasar-mixins';
const appBuildType = process.env.APP_BUILD_TYPE;
export default {
  setup () {
    const dialog = ref(false);
    const router = useRouter();
    const loading = ref(false);
    const { showSnack } = useQuasarMixins();
    const userStore = useUserStore();
    const selectedOrganization = ref({});
    const activeOrganization = computed(() => userStore.$state.userActiveOrganization);
    const organizations = computed(() => {
      return userStore.$state.userOrganizations?.filter(org => org.id !== activeOrganization.value.id);
    });

    function switchFacility (organization) {
      selectedOrganization.value = organization;
      loading.value = true;
      dialog.value = false;
      const id = organization?.id;
      userStore.setActiveOrganzation(id);
      router.push({ name: `${appBuildType}-landing` });
      setTimeout(() => {
        loading.value = false;
        showSnack({
          message: `Welcome back to ${selectedOrganization.value.name}!`,
          color: 'positive',
          icon: 'la la-check',
          timeout: 2000,
        });
      }, 1500);
    }

    return {
      selectedOrganization,
      activeOrganization,
      dialog,
      loading,
      organizations,
      switchFacility,
    };
  },
};
</script>
