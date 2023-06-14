<template lang="pug">
q-layout(view="lHh LpR lFr" style="background: #fafafa")
  q-header(bordered dark)
    q-toolbar(style="height: 60px; background: #00597a")
      q-btn(
        aria-label="Menu",
        icon="las la-bars",
        flat
        round
        @click="toggleLeftDrawer"
      )
      q-toolbar-title PME - {{$route.meta.pageTitle}}
      q-space
      q-btn(
        flat
        round
      )
        q-avatar
          q-img(:src="currentUserPicURL")
        q-menu(
          anchor="bottom right"
          self="top right"
        )
          q-list(style="min-width: 100px")
            q-item(v-close-popup)
              q-item-section
                q-item-label Welcome, {{fullName}}
            q-separator
            q-item(v-close-popup clickable @click="logOut")
              q-item-section
                q-item-label Logout

  q-drawer(
    v-model="leftDrawerOpen"
    bordered
    dark
    show-if-above
    mini-to-overlay
    :mini="miniState"
    @mouseover="miniState = false"
    @mouseout="miniState = true"
    style="background: #142731"
  )
    q-toolbar(style="height: 60px").q-pa-0
      img(v-if="miniState" src="../../assets/images/logo-icon-white.png" style="height: 35px; margin-left: -3px")
      img(v-else src="../../assets/images/logo-text-white.png" style="height: 35px;")
    q-separator(dark)
    q-list(dark)
      q-item(
        clickable
        dark
        @click="gotoClinic"
      )
        q-item-section(avatar)
          q-avatar(:style="{ 'margin-left': miniState ? '0px' : '-8px' }")
            img(:src="activeOrganization.picURL")
        q-item-section
          q-item-label(lines="2") {{activeOrganization.name}}
          q-item-label(caption).ellipsis {{activeOrganization.description}}
        q-item-section(side)
          switch-facility
      template(v-for="(nav, index) in navs")
        template(v-if="nav.type === 'nav-header'")
          q-separator(dark)
          q-item
            q-item-label(label).text-grey
              small.text-bold {{nav.name}}
        template(v-else)
          q-item(
            clickable
            v-ripple
            :to="{ name: nav.route }"
          )
            q-item-section(avatar)
              q-icon(:name="nav.icon")
            q-item-section
              q-item-label {{nav.name}}
  q-page-container
    div.bg-white.q-pa-sm
      q-breadcrumbs(gutter="sm")
        template(v-slot:separator)
          q-icon(name="la la-angle-right" size="14px")
        template(v-for="item in $footprints")
          q-breadcrumbs-el(:label="item.footprint.name" :icon="item.footprint.icon")
    router-view
</template>

<script>
import { computed, ref } from 'vue';
import { formatDoctorName } from '@/utils';
import { sdk } from '@/boot/mycure';
import { usePmeNavRoutes } from '@/composables/navigation';
import { useQuasarMixins } from '@/composables/quasar-mixins';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/current-user';
import SwitchFacility from '@/components/commons/dialogs/SwitchFacility';

export default {
  components: {
    SwitchFacility,
  },
  setup () {
    const userStore = useUserStore();
    const leftDrawerOpen = ref(true);
    const navs = usePmeNavRoutes(['a']);
    const miniState = ref(true);
    const organizations = computed(() => userStore.$state.userOrganizations);
    const activeOrganization = computed(() => userStore.$state.userActiveOrganization);
    const currentUser = computed(() => userStore.$state.user);
    const currentUserPicURL = computed(() => currentUser.value?.picURL);
    const fullName = computed(() => formatDoctorName(currentUser.value));
    const router = useRouter();
    const { confirm } = useQuasarMixins();

    function gotoClinic () {
      console.warn('gotoClinic');
    }

    function switchFacility () {
      console.warn('switchFacility');
    }

    function toggleLeftDrawer () {
      leftDrawerOpen.value = !leftDrawerOpen.value;
    }

    async function logOut () {
      if (!await confirm({ message: 'Are you sure you want to logout?' })) return;
      await sdk.service('auth').signout();
      router.push({ name: 'login' });
    };

    return {
      activeOrganization,
      miniState,
      leftDrawerOpen,
      navs,
      organizations,
      gotoClinic,
      switchFacility,
      toggleLeftDrawer,
      currentUser,
      currentUserPicURL,
      fullName,
      logOut,
    };
  },
};
</script>
