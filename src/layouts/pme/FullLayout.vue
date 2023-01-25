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
      template(v-for="(nav, index) in navs")
        template(v-if="nav.type === 'nav-header'")
          q-separator(v-if="index !== 0")
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
import { ref } from 'vue';
import { usePmeNavRoutes } from '@/composables/navigation';

export default {
  setup () {
    const leftDrawerOpen = ref(true);
    const navs = usePmeNavRoutes(['a']);

    function toggleLeftDrawer () {
      leftDrawerOpen.value = !leftDrawerOpen.value;
    }

    return {
      leftDrawerOpen,
      navs,
      toggleLeftDrawer,
    };
  },
};
</script>
