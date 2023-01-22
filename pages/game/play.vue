<template>
  <div class="content-game">
    <div class="content-game__header">
      <h1>Quizz App</h1>
      <span>Le jeu blabla</span>
    </div>
    <div class="content-game__container container">
      <div class="content-game__row row">
        <div class="col-lg-6 col-12">
          <h3>Question 1</h3>
          <canvas id="canvas"></canvas>
          <div class="content-game__inputs">
            <input v-if="showInput" type="text" id="research-input" />

            <button v-if="hasStarted" @click="client_user_pause_game" id="pause-button">
              J'ai la réponse !
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="popup_variable" class="popup">
      <div class="popup-modal">
        <div class="popup-modal__content">
          <h3>{{ title }}</h3>
          <p>{{ sup_text }}</p>
          <div v-if="!hasJoined" class="pop-up__username">
            <input type="text" id="username_input" v-model="username" />
            <button id="username_submit" v-on:click="client_user_connected(username)">
              Validate
            </button>
          </div>
          <div class="pop-up__score">
            <h5 v-if="hasStarted" class="score_user">
              {{ username }} : {{ scoreUser }} points
            </h5>
            <h5 v-if="hasStarted" class="score_opponent">
              {{ otherPlayer[1].username }}: {{ scoreOpponent }} points
            </h5>
          </div>
          <div v-if="hasJoined && !hasStarted" class="user_list">
            <span>{{ username }}</span>
            <span v-if="otherPlayer.length > 1">
              {{ otherPlayer[1].username }}
            </span>
          </div>
          <div v-if="isAdmin && otherPlayer.length > 1">
            <button v-if="!hasStarted" id="start_game" @click="client_user_start_game()">
              Commencer la partie
            </button>
            <button
              v-if="isAdmin && questionNumber < loadQuestions.length - 1 && hasStarted"
              @click="client_user_next_question"
            >
              Question suivante
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
canvas {
  width: 100%;
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
      hasStarted: false,
      popup_variable: true,
      scoreByImg: 100,
      scoreOpponent: 0,
      scoreUser: 0,
      title: "Welcome !",
      sup_text: "Please add your username",
    };
  },
  async mounted() {
    await axios
      .get(process.env.wordpressAPI + "?rest_route=/wp/v2/current_game/")
      .then((response) => {
        console.log(response.data);
        let obj = response.data.find((o) => o.acf.game_id === this.$route.query.id);

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

    // ALL SOCKET FUNCTION HERE
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
      this.hasStarted = false;
      if (this.isAdmin) {
        this.vm.socket.emit("client_user_send_username", {
          room: this.$route.query.id,
          username: this.username,
        });
      }
      if (this.isAdmin && this.otherPlayer.length > 1) {
        this.sup_text = "We can begin ! ";
      }
    });
    this.socket.on("admin", (data) => {
      this.isAdmin = data;
      this.sup_text = "Waiting for other player...";
    });
    this.socket.on("server_user_paused", () => {
      this.inputResponsePause();
      document.getElementById("pause-button").disabled = true;
    });
    this.socket.on("server_game_started", () => {
      this.popup_variable = false;
      this.hasStarted = true;
      this.loadImage(
        this.canvas,
        this.loadQuestions[this.questionNumber].image_quizz.url
      );
      this.startPixelation();
    });

    this.socket.on("server_opponent_good_response", (data) => {
      this.opponentGoodResponse(data);
    });
    this.socket.on("server_opponent_bad_response", () => {
      this.opponentBadResponse();
    });
    this.socket.on("server_next_question", () => {
      this.nextQuestion();
    });
    this.socket.on("server_user_send_username", (data) => {
      this.otherPlayer.push({ id: data.socket, username: data.Opponentusername });
      console.log("retrieve other username");
      console.log(this.otherPlayer);
    });

    // END FUNCTION SOCKET

    document.addEventListener("keydown", (e) => {
      if (e.code === "Enter") {
        //checks whether the pressed key is "Enter"
        this.compareText();
      }
    });

    this.fabricInit();
  },
  methods: {
    client_user_connected(name) {
      // this.popup_variable = false
      this.vm.socket.emit("user_arrived", {
        room: this.$route.query.id,
        username: name,
      });

      this.sup_text = "Waiting for the Admin...";
    },
    client_user_start_game() {
      this.popup_variable = false;
      this.hasStarted = true;
      this.vm.socket.emit("client_user_start", {
        room: this.$route.query.id,
      });
      this.loadImage(
        this.canvas,
        this.loadQuestions[this.questionNumber].image_quizz.url
      );
      this.startPixelation();
    },
    client_user_pause_game() {
      this.vm.socket.emit("client_user_response", {
        room: this.$route.query.id,
      });
      this.showInput = true;
      this.inputResponsePause();
    },
    client_user_next_question() {
      this.vm.socket.emit("client_user_next_question", {
        room: this.$route.query.id,
      });
      this.nextQuestion();
    },
    fabricInit() {
      this.canvas = new fabric.Canvas("canvas");
      this.canvas.setWidth(800);
      this.canvas.setHeight(400);
      console.log(this.canvas);
    },
    loadImage(canvas, url) {
      this.showInput = false;
      fabric.Image.fromURL(
        url,
        (oImg) => {
          this.oImg = oImg;
          this.oImg.scale(0.5);
          this.oImg.lockMovementX = true;
          this.oImg.lockMovementY = true;

          this.oImg.filters.push(
            new fabric.Image.filters.Pixelate({
              blocksize: 50,
            })
          );
          this.oImg.applyFilters();
          canvas.add(this.oImg);
          canvas.renderAll();
        },
        { crossOrigin: "anonymous" }
      );
    },
    startPixelation() {
      this.intervalId = setInterval(() => {
        this.oImg.filters[0].blocksize -= 0.051;
        this.scoreByImg -= 0.1;
        console.log(this.scoreByImg);
        this.oImg.applyFilters();
        this.canvas.renderAll();
        if (this.oImg.filters[0].blocksize <= 1) {
          clearInterval(this.intervalId);
        }
      }, 16);
    },

    inputResponsePause() {
      clearInterval(this.intervalId);
      // setTimeout(() => {
      //   this.startPixelation()
      // }, 2000);
    },
    compareText() {
      console.log("comparetext");
      let inputText = document.getElementById("research-input").value;
      let compareText = this.loadQuestions[this.questionNumber].response_quizz;
      console.log(compareText);
      if (inputText.localeCompare(compareText) === 0) {
        this.scoreUser += parseInt(this.scoreByImg);
        this.title = "Good Answer !";
        this.sup_text =
          "Well done, the response was " +
          this.loadQuestions[this.questionNumber].response_quizz +
          " !";
        this.vm.socket.emit("client_user_good_response", {
          room: this.$route.query.id,
          scoreOpponent: this.scoreByImg,
        });
        clearInterval(this.intervalId);
        this.popUp_good();
      } else {
        this.vm.socket.emit("client_user_bad_response", {
          room: this.$route.query.id,
        });
        this.startPixelation();
        this.showInput = false;
        document.getElementById("pause-button").disabled = true;
        setTimeout(function () {
          document.getElementById("pause-button").disabled = false;
        }, 5000);
      }
    },
    opponentGoodResponse(data) {
      console.log(data.scoreOpponent);
      this.title = "The opponent find the answer !";
      this.sup_text =
        "The response was " +
        this.loadQuestions[this.questionNumber].response_quizz +
        "!";
      this.scoreOpponent += parseInt(data.scoreOpponent);
      console.log("Score utilisateur : " + this.scoreUser);
      console.log("Score opponent : " + this.scoreOpponent);
      clearInterval(this.intervalId);
      this.popUp_good();
    },
    opponentBadResponse() {
      document.getElementById("pause-button").disabled = false;
      this.startPixelation();
    },
    popUp_good() {
      this.popup_variable = true;
    },
    nextQuestion() {
      this.scoreByImg = 100;
      document.getElementById("pause-button").disabled = false;
      this.popup_variable = false;
      this.canvas.clear();
      if (this.questionNumber < this.loadQuestions.length) this.questionNumber++;
      this.loadImage(
        this.canvas,
        this.loadQuestions[this.questionNumber].image_quizz.url
      );
      this.startPixelation();
    },
  },
};
</script>
