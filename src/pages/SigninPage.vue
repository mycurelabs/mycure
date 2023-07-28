<template lang="pug">
generic-page(padding :loading="loading")
  div.fullscreen.row.justify-center.items-center
    div.col-xs-12.col-md-4
      q-card(style="border-radius: 10px;").shadow-1
        q-card-section.column.q-px-xl
          span.q-mb-sm Hello, welcome to
          q-img(src="../assets/images/logo-text-colored.png" width="200px")
        q-card-section.q-px-xl
          q-form(ref="loginFormRef" @submit.prevent="login").q-gutter-md
            q-input(
              v-model="email"
              type="email"
              label="Email Address"
              outlined
              dense
              :rules="[v => !!v || 'Email address is required']"
            )
            q-input(
              v-model="password"
              type="password"
              label="Password"
              outlined
              dense
              :rules="[v => !!v || 'Password is required']"
            )
            div.row
              q-space
              q-btn(
                type="submit"
                label="Log In"
                color="primary"
                no-caps
                unelevated
                :loading="loading"
              )

</template>

<script>
import GenericPage from 'components/commons/GenericPage.vue';
import { useAuth, useCurrentUser } from 'boot/auth';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
// import { useUserStore } from 'stores/current-user';
const appBuildType = process.env.APP_BUILD_TYPE;

export default {
  components: {
    GenericPage,
  },
  setup () {
    const { signin } = useAuth();
    const loading = ref(false);
    const router = useRouter();
    // const userStore = useUserStore();
    // const email = ref('superadmin@test.com');
    // const password = ref('mycure');
    const email = ref('');
    const password = ref('');
    const loginFormRef = ref(null);

    async function init () {
      try {
        const user = await useCurrentUser();
        console.warn('user', user);
        // if (user) gotoDashboard();
      } catch (e) {
        console.error(e);
      }
    }

    async function login () {
      try {
        loading.value = true;
        if (!await loginFormRef.value.validate()) return;
        const user = await signin({ email: email.value, password: password.value });
        console.warn('user', user);
        router.push({ name: 'dashboard' });
        // await userStore.populateCurrentUser();
        // gotoDashboard();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    // function gotoDashboard () {
    //   router.push({ name: `${appBuildType}-landing` });
    // }

    init();

    return {
      email,
      loading,
      loginFormRef,
      password,
      // methods
      init,
      login,
    };
  },
};
</script>
