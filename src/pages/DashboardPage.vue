<template lang="pug">
h1 Dashboard
</template>

<script>
import { useCurrentUser } from 'boot/auth';
export default {
  name: 'DashboardPage',
  setup () {
    const user = useCurrentUser();
    console.warn('user', user.value);
    return {};
  },
};

</script>
