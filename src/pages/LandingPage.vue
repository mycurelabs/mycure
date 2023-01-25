<template lang="pug">
generic-page(padding :loading="loading")
  div.fullscreen.row.justify-center.items-center
    div.col-xs-12.col-md-4
      q-card(style="border-radius: 10px;").shadow-1
        q-card-section.q-pa-xl
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
import GenericPage from '@/components/commons/GenericPage';
import { sdk } from '@/boot/mycure';
import { ref } from 'vue';
export default {
  components: {
    GenericPage,
  },
  setup () {
    const loading = ref(false);
    const email = ref('superadmin@test.com');
    const password = ref('mycure');
    const loginFormRef = ref(null);

    async function init () {
      try {
        const user = await sdk.service('auth').currentUser();
        console.warn('user', user);
      } catch (e) {
        console.error(e);
      }
    }

    async function login () {
      try {
        if (!await loginFormRef.value.validate()) return;
        const currentUser = await sdk.service('auth').signin('local', {
          email: email.value,
          password: password.value,
        }, true);
        console.warn(currentUser);
      } catch (e) {
        console.error(e);
      }
    }

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
