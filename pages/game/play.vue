<template>
  <div>
    <div v-if="!hasJoined" class="username_input">
      <input type="text" id="username_input" v-model="username" />
      <button id="username_submit" v-on:click="client_user_connected(username)">
        Validate
      </button>
     
    </div>
    <div v-if="isAdmin && otherPlayer.length > 1">
      <button
        id="start_game"
        @click="
          loadImage(canvas, loadQuestions[questionNumber].image_quizz.url)
        "
      >
        Commencer la partie
      </button>
    </div>
    <div v-else>En attente...</div>
    <div class="container-canvas">
      <canvas id="canvas"></canvas>
      <button id="pixelate-button">Commencer</button>
      <button id="pause-button">J'ai la réponse !</button>
      <input v-if="showInput" type="text" id="research-input" />
    </div>
  </div>
</template>
<style>
canvas {
  width: 500px;
  height: 500px;
}
</style>

<script>
import { fabric } from "fabric";
import axios from "axios";
export default {
  data() {
    return {
      latestTickId: 0,
      vm: this,
      isAdmin: false,
      otherPlayer: [],
      username: "",
      hasJoined: false,
      canvas: null,
      oImg: null,
      intervalId: null,
      decrement: 100,
      questionNumber: 0,
      showInput: false,
      loadQuestions: [],
      test: "",
    };
  },
  async mounted() {
    await axios
      .get(process.env.wordpressAPI + "?rest_route=/wp/v2/current_game/")
      .then((response) => {
        console.log(response.data);
        let obj = response.data.find(
          (o) => o.acf.game_id === this.$route.query.id
        );

        console.log(obj);

        if (!obj) {
          this.$router.push({ path: "/" });
        } else {
          axios
            .get(
              process.env.wordpressAPI +
                "?rest_route=/wp/v2/questions_lists&slug=" +
                obj.acf.quizz_game +
                "&acf_format=standard"
            )
            .then((response) => {
              console.log(response);
              this.loadQuestions = response.data[0].acf.quizz_list_questions;
              console.log(this.loadQuestions);
              this.test = this.loadQuestions[0].image_quizz.url;
            });
        }
      });

    // use "main" socket defined in nuxt.config.js
    this.vm.socket = this.$nuxtSocket({
      name: "main", // select "main" socket from nuxt.config.js - we could also skip this because "main" is the default socket
    });
    this.vm.socket.on("tick", (tickId) => {
      this.vm.latestTickId = tickId;
    });
    this.vm.socket.on("server_user_arrived", (data) => {
      console.log(data);
      console.log(data.socket);
      console.log(data.username);
      console.log("un utilsateur est arrivé !");
      this.otherPlayer.push({ id: data.socket, username: data.username });
      console.log(this.otherPlayer);
      this.hasJoined = true;
    });
    this.socket.on("admin", (data) => {
      console.log("ehllo !");
      this.isAdmin = data;
    });
    this.fabricInit();
  },
  methods: {
    client_user_connected(name) {
      console.log(name);
      this.vm.socket.emit("user_arrived", {
        room: this.$route.query.id,
        username: name,
      });
    },
    fabricInit() {
      this.canvas = new fabric.Canvas("canvas");
      this.canvas.setWidth(800);
      this.canvas.setHeight(600);
      console.log(this.canvas);
    },
    loadImage(canvas, url) {
      this.showInput = false;
      // fabric.Image.fromURL(
      //   url,
      //   (oImg) => {
      //     this.oImg = oImg;
      //     this.oImg.scale(0.5);
      //     this.oImg.filters.push(
      //       new fabric.Image.filters.Pixelate({
      //         blocksize: 50,
      //       })
      //     );
      //     this.oImg.applyFilters();
      //     canvas.add(this.oImg);
      //     canvas.renderAll();
      //   },
      //   { crossOrigin: "anonymous" }
      // );
      fabric.util.loadImage(url, function (img) {
        var fab_image = new fabric.Image(img);
        canvas.add(fab_image);
        canvas.renderAll();
      });
    },
  },
};
</script>
