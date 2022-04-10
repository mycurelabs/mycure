<template lang="pug">
q-layout(view="hHh lpR fFf").footer-bg
  q-header(
    v-if="showToolbar"
  ).bg-white.text-primary
    q-toolbar(color="primary")
      q-btn(
        v-if="!hideBackButton"
        flat
        round
        dense
        icon="arrow_back"
        @click="goBack"
      )
      q-toolbar-title
        | {{toolbarTitle}}
  q-page-container
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
      return this.$router.go(-1);
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
