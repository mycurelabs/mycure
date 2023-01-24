<template lang="pug">
q-layout(view="hHh lpR lFr")
  q-header.bg-primary.text-white
    q-toolbar(style="height: 60px")
      q-btn(
        flat,
        dense,
        round,
        icon="fa fa-bars",
        aria-label="Menu",
        @click="toggleLeftDrawer"
      )
      q-toolbar-title MYCURE - PME

  q-drawer(v-model="leftDrawerOpen", bordered)
    q-list
      template(v-for="nav in navs")
        template(v-if="nav.type === 'nav-header'")
          q-separator
          q-item
            q-item-label(label).text-primary
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
