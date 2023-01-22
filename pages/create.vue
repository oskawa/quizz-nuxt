<template>
  <section class="create">
    <div class="create-container container">
      <div class="create-row row">
        <div class="create-col offset-lg-1 col-lg-5 col-12">
          <h2>Création de la partie</h2>
          <input
            name="game_name"
            id="game_name"
            placeholder="Nom de la partie"
            type="text"
            class="input-stroke"
          />
          <input
            class="input-checkbox"
            type="checkbox"
            name="game_private"
            id="game_private"
            value="false"
          />
        
          <select class="input-stroke" name="game_selector" id="game_selector">
            <option v-for="quizz in listQuizz" :key="quizz.id" :value="quizz.slug">{{quizz.title.rendered}}</option>

          </select>
          
          <button class="btn-fill" @click="createBoard">Créer la partie</button>
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
      multiID: uuidv4(),
      latestTickId: 0,
      username: "wordpress.api",
      application_password: "dP7Y DIwr 0DPA xXtJ jkDh KAzv",
      vm: this,
      listQuizz : []
    };
  },
  mounted() {
    // use "main" socket defined in nuxt.config.js
    this.vm.socket = this.$nuxtSocket({
      name: "main", // select "main" socket from nuxt.config.js - we could also skip this because "main" is the default socket
    });
    document.getElementById("game_private").addEventListener("change", (event) => {
      if (event.currentTarget.checked) {
        document.getElementById("game_private").value = true;
      } else {
        document.getElementById("game_private").value = false;
      }
    });
    this.retrieveQuizzList()
  },
  methods: {
    retrieveQuizzList() {
      axios.get(
        axios.get(process.env.wordpressAPI + "?rest_route=/wp/v2/questions_lists")
        .then((response) =>{
          console.log(response)
          this.listQuizz = response.data
        })
      );
    },
    createBoard() {
      axios
        .post(
          process.env.wordpressAPI + "?rest_route=/wp/v2/current_game/",
          {
            JWT: "dP7Y DIwr 0DPA xXtJ jkDh KAzv",
            content: "test",
            acf: {
              game_private: document.getElementById("game_private"),
              game_id: this.multiID,
              game_name: document.getElementById("game_name").value,
              quizz_game: document.getElementById("game_selector").value,
            },
            slug: this.multiID,
            status: "publish",
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Basic " +
                new Buffer(this.username + ":" + this.application_password).toString(
                  "base64"
                ),
            },
          }
        )
        .then((response) => {
          let id = response.data.acf.game_id;
          this.vm.socket.emit("game_created");
          this.$router.push({ path: "game/play", query: { id } });
        });
    },
  },
};
</script>
