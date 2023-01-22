<template>
  <div>
    <div v-if="!hasJoined" class="username_input">
      <input type="text" id="username_input" v-model="username" />
      <button id="username_submit" v-on:click="client_user_connected(username)">
        Validate
      </button>
    </div>
    <div v-if="isAdmin && otherPlayer.length > 1">
      <button id="start_game" @click="client_user_start_game()">
        Commencer la partie
      </button>
    </div>
    <div v-else>En attente...</div>
    <div class="container-canvas">
      <canvas id="canvas"></canvas>
      <!-- <button v-if="isAdmin" id="pixelate-button">Commencer</button> -->
      <button v-if="hasStarted" @click="client_user_pause_game" id="pause-button">
        J'ai la réponse !
      </button>
      <input v-if="showInput" type="text" id="research-input" />
    </div>
    <div v-if="popup_variable" class="pop-up">
      <h1>Machin a trouvé la bonne réponse !</h1>
      <button
        v-if="isAdmin && questionNumber < loadQuestions.length - 1"
        @click="client_user_next_question"
      >
        Question suivante
      </button>
    </div>
  </div>
</template>