<template>
<section class="hero">
  <div class="hero-body">
    <div class="container" v-if="gameConfig && loaded">
      <div class="columns is-multiline">
        <div class="column is-6 is-offset-3">
          <div v-for="(rank, idx) in ranks()"
               :class="{
                         notification: true,
                         'is-gold': (idx == 0),
                         'is-silver': (idx == 1),
                         'is-bronze': (idx == 2),
                         'is-default': (idx > 2)
                       }">
            <strong>
              {{ rank.name }}: {{ rank.victoryPoints }} points
              <em>({{ rank.seedsOnMap }} seeds)</em>
            </strong>
          </div>
        </div>


      </div>
      <div class="columns is-multiline">
        <div class="column is-6" v-for="(map, idx) in maps">
          <div class="box">
            <div class="columns is-multiline">
              <div class="column is-12">
                <div class="notification is-default level">
                  <strong class="level-left">
                    {{ playerNames[idx] }}
                  </strong>
                  <strong class="level-right">
                    Victory Points: {{ vpCount(idx) }}
                  </strong>
                </div>
              </div>
              <div class="column is-12">
                <board :map="map" size="is-small"></board>
                <recipe-list :vpCount="vpCount(idx)"></recipe-list>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="container" v-else>
      Loading...
    </div>
  </div>
</section>
</template>

<script>
import { db, dbRefs } from '../firebase/init'
import Board from './gameroom/Board.vue'
import RecipeList from './gameroom/RecipeList.vue'
import { ensureArray } from '../util/util'
import { getCurrentPlayer } from '../util/login'

export default {
  data () {
    return {
      loaded: false,
      playerIdx: -1,
      playerNames: {},
      gameConfig: null,
      maps: {}
    }
  },
  components: {
    Board,
    RecipeList
  },
  props: [ 'gameId' ],
  watch: {
    gameId: {
      immediate: true,
      handler () {
        this.$rtdbBind('gameConfig', db.ref(dbRefs.gameConfig(this.gameId))).then(() => {
          // Loaded
          if (getCurrentPlayer() == null ||
              this.gameConfig.players == null ||
              !this.gameConfig.started ||
              !this.gameConfig.players.includes(getCurrentPlayer())) {

            this.$router.push({
              path: '/',
              query: {
                src: this.gameId
              }
            })
            return
          }

          if (this.gameConfig.currentTurn < this.gameConfig.turns.length) {
            this.$router.push({
              name: "GameRoom",
              params: {
                gameId: this.gameId
              }
            })
          }

          if (this.gameConfig.active) {
            db.ref(dbRefs.gameActive(this.gameId)).set(false)
          }

          this.setGameData()
          this.loaded = true
        })
      }
    }
  },
  methods: {
    setGameData () {
      this.playerIdx = this.gameConfig.players.indexOf(getCurrentPlayer())

      this.playerNames = {}
      this.gameConfig.players.forEach((player, idx) => {
        if (idx == 0)
          return;
        db.ref(dbRefs.playerName(player)).once('value').then((snapshot) => {
          if (snapshot.val() && snapshot.val() != null && snapshot.val() != "") {
            this.playerNames[idx] = snapshot.val()
          } else {
            this.playerNames[idx] = "Player " + idx
          }
        })
      })
      this.playerNames[this.playerIdx] = "You"

      let latestTurn = this.gameConfig.turns.length - 1

      this.gameConfig.players.map((player, idx) => {
        this.$set(this.maps, idx, JSON.parse(this.gameConfig.playerState[idx]))
      })
    },
    vpCount (idx) {
      if (idx == null) {
        idx = this.playerIdx
      }
      if (!this.gameConfig.playerVPs || !this.gameConfig.playerVPs[idx]) {
        return 0
      }

      return this.gameConfig.playerVPs[idx]
    },
    seedsOnMap (idx) {
      let count = 0
      Object.entries(this.maps[idx]).forEach((value) => {
        if (value[1].state && value[1].state != 'used') {
          count += 1
        }
      })

      return count
    },
    ranks () {
      let score = []
      for (let i = 1; i <= this.gameConfig.totalPlayers; i++) {
        score.push({
          name: this.playerNames[i],
          victoryPoints: this.vpCount(i),
          seedsOnMap: this.seedsOnMap(i),
          score: this.vpCount(i) * 100 + this.seedsOnMap(i),
        })
      }

      score.sort((a, b) => b.score - a.score)

      return score
    }
  }
}
</script>

<style lang="scss">
.is-gold {
  background: linear-gradient(0deg, gold 70%, #ffffdd);
}

.is-silver {
  background: linear-gradient(0deg, silver 70%, #eee);
}
</style>
