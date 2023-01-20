<template>
  <section class="list">
    <div class="list-container container">
      <div class="row list-row">
        <div class="col-12">
          <h2>Liste des parties</h2>
          <div class="list-games">
            <template v-for="game in array_games">
                
              <div class="list-game__single" :key="game.id">
                 <nuxt-link :to="{ path: 'game/play', query: { id: game.acf.game_id } }" class="btn-fill">
                <div class="list-game__content">
                  <h3>{{ game.acf.game_name }}</h3>
                </div>
                </nuxt-link>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
export default {
  data() {
    return {
      array_games: [],
      latestTickId: 0,
      username: "wordpress.api",
      application_password: "dP7Y DIwr 0DPA xXtJ jkDh KAzv",
    };
  },
  mounted() {
    const vm = this;
     vm.socket = this.$nuxtSocket({
      name: "main", // select "main" socket from nuxt.config.js - we could also skip this because "main" is the default socket
    });
    this.listBoard();
    vm.socket.on("update_list", () => {
      console.log('List update')
       this.listBoard();
    });
  },
  methods: {
    listBoard() {
      axios
        .get(process.env.wordpressAPI + "?rest_route=/wp/v2/current_game/")
        .then((response) => {
            console.log(response)
          this.array_games = response.data;
          console.log(this.array_games)
        });
    },
  },
};
</script>
