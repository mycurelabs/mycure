<template lang="pug">
q-layout(view="hHh LpR fFf" style="background: #fafafa").footer-bg
  q-header(bordered).text-black.bg-white
    q-toolbar(color="primary")
      q-btn(
        v-if="!hideBackButton",
        flat,
        round,
        dense,
        icon="la la-arrow-left",
        @click="goBack"
      )
      q-toolbar-title
        | {{ toolbarTitle }}
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
export default {
  computed: {
    showToolbar () {
      return this.$route.meta?.showToolbar;
    },
    toolbarTitle () {
      return this.$route.meta?.toolbarTitle;
    },
    hideBackButton () {
      return this.$route.meta?.hideBackButton;
    },
    backRoute () {
      return this.$route.meta.backRoute;
    },
  },
  methods: {
    goBack () {
      if (this.backRoute) return this.$router.push({ name: this.backRoute });
      return this.$router.push({ name: 'pme-worklist' });
    },
  },
};
</script>

<style scoped>
.footer-bg {
  background-position: bottom center;
  background-repeat: repeat-x;
}
</style>
