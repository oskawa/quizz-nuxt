<template>
  <div class="home-container container">
    <div class="home-row row">
      <div class="home-col col-12 col-lg-6">
        <h1>Quizz App</h1>
        <h3>Jouez avec vos amis !</h3>
      </div>
      <div class="container-fluid">
        <div class="row">
          <div class="col-lg-6 col-12">
            <nuxt-link to="/create" class="btn-fill">Créer une partie</nuxt-link>
          </div>
          <div class="col-lg-6 col-12">
            <nuxt-link to="/list" class="btn-stroke">Rejoindre une partie</nuxt-link>
          </div>
        </div>
      </div>
    </div>
    <div></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      latestTickId: 0,
    };
  },
  mounted() {
    const vm = this;

    // use "main" socket defined in nuxt.config.js
    vm.socket = this.$nuxtSocket({
      name: "main", // select "main" socket from nuxt.config.js - we could also skip this because "main" is the default socket
    });

    vm.socket.on("tick", (tickId) => {
      vm.latestTickId = tickId;
    });
  },
};
</script>
