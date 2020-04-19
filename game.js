var round = require('./round.js')
class Game {
    constructor(playersPool, initialScores) {
        this.playersPool = playersPool;
        this.rounds = [];
        if (initialScores === undefined) {
            this.initialCardsPerPlayer = 4;
            this.roundCardNumbers = this.buildRoundsNumbers();
            //this.scores = this.buildInitialScores();
        }
    }

    buildRoundsNumbers() {
        var rounds = []
        // ascending
        var i = this.initialCardsPerPlayer;
        while (i * this.playersPool.players.length <= 52 - this.playersPool.players.length) {
            rounds.push(i);
            i++;
        }

        // no triumph rounds
        for (var j = 0; j < this.playersPool.players.length; j++) {
            rounds.push(i)
        }

        // descending
        i--;
        while (i >= this.initialCardsPerPlayer) {
            rounds.push(i);
            i--;
        }
        return rounds;
    }

    // buildInitialScores() {
    //     var scores = [];
    //     for (var rIdx in this.roundCardNumbers) {
    //         var score = {
    //             "cards": this.roundCardNumbers[rIdx],
    //             "scores": []
    //         }
    //         for (var pIdx in this.playersPool.players) {
    //             score.scores.push({
    //                 "name": this.playersPool.players[pIdx].name,
    //                 "askedBases": null,
    //                 "doneBases": null,
    //                 "score": null
    //             })
    //         }
    //         scores.push(score);
    //     }
    //     return scores;
    // }

    dealNextRound() {
        console.log("Dealing next round");
        var roundCards = 0;
        var firstPlayer = null;
        if (this.rounds.length == 0) {
            // first round
            roundCards = this.initialCardsPerPlayer;
            firstPlayer = this.playersPool.players[0];
        } else {
            var lastRound = this.rounds[this.rounds.length - 1];
            roundCards = this.roundCardNumbers[this.rounds.length];
            firstPlayer = this.playersPool.rightPlayer(lastRound.roundFirstPlayer);
        }


        var r = new round.Round(roundCards, this.playersPool, firstPlayer)
        r.deal();
        this.rounds.push(r)
    }

    currentRound() {
        if (this.rounds.length == 0) {
            return null;
        }
        return this.rounds[this.rounds.length - 1];
    }

    findPlayerById(playerId) {
        return this.playersPool.findById(playerId);
    }
}

module.exports.Game = Game;