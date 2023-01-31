<template lang="pug">
q-layout(view="hHh LpR lFr" style="background: #fafafa")
  q-header.bg-primary.text-white
    q-toolbar(style="height: 60px")
      q-btn(
        flat,
        dense,
        round,
        icon="las la-bars",
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
    router-view
    pre {{$route.name}}
    pre {{$route.meta}}
</template>

<script>
import { ref } from 'vue';
import { usePmeNavRoutes } from '@/composables/navigation';
// import { useRoute } from 'vue-router';

export default {
  setup () {
    const leftDrawerOpen = ref(true);
    const navs = usePmeNavRoutes(['a']);
    // const route = useRoute();

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
