import firebase from 'firebase/app';
import firestore from 'firebase/database';
import firebaseConfig from './config';

const firebaseApp = firebase.initializeApp(firebaseConfig);

let dbRefs = {
    gameConfig (id) {
        return `games/${id}`
    },
    playerState (gameId, turnId, playerId) {
        return `games/${gameId}/turns/${turnId}/playerState/${playerId}`
    },
    playerRecipes (gameId, playerId, recipeId) {
        return `games/${gameId}/playerRecipes/${playerId}/${recipeId}`
    },
    playersPlayed (gameId, turnId, playerId) {
        return `games/${gameId}/turns/${turnId}/playersPlayed/${playerId}`
    },
    currentTurn (gameId) {
        return `games/${gameId}/currentTurn`
    }
}
let db = firebaseApp.database()

export {dbRefs, db}
