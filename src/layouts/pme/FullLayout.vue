<template lang="pug">
q-layout(view="hHh lpR lFr" style="background: #fafafa")
  q-header(bordered).text-black.bg-white
    q-toolbar(style="height: 60px")
      q-btn(
        aria-label="Menu",
        icon="las la-bars",
        flat
        round
        @click="toggleLeftDrawer"
      )
      q-toolbar-title MYCURE - PME

  q-drawer(v-model="leftDrawerOpen", bordered)
    q-list
      //- q-item
        q-item-label(label).text-grey
          small.text-bold Active Clinic
      q-item(
        clickable
        @click="gotoClinic"
      )
        q-item-section(avatar)
          q-avatar(size="60px" style="outline: 1px solid lightgrey")
            img(:src="activeOrganization.picURL")
        q-item-section
          q-item-label.ellipsis {{activeOrganization.name}}
          q-item-label(caption).ellipsis-2-lines {{activeOrganization.description}}
        q-item-section(side)
          switch-facility
      template(v-for="(nav, index) in navs")
        template(v-if="nav.type === 'nav-header'")
          q-separator
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
import { usePmeNavRoutes } from '@/composables/navigation';
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
    const organizations = computed(() => userStore.$state.userOrganizations);
    const activeOrganization = computed(() => userStore.$state.userActiveOrganization);

    function gotoClinic () {
      console.warn('gotoClinic');
    }

    function switchFacility () {
      console.warn('switchFacility');
    }

    function toggleLeftDrawer () {
      leftDrawerOpen.value = !leftDrawerOpen.value;
    }

    return {
      activeOrganization,
      leftDrawerOpen,
      navs,
      organizations,
      gotoClinic,
      switchFacility,
      toggleLeftDrawer,
    };
  },
};
</script>
