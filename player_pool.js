class PlayersPool {
    constructor(players) {
        this.players = players;
    }

    shuffle() {
        var currIdx = this.players.length;
        var idx;
        var temp;

        while (currIdx > 0) {
            idx = Math.floor(Math.random() * currIdx);
            currIdx--;
            temp = this.players[currIdx];
            this.players[currIdx] = this.players[idx];
            this.players[idx] = temp;
        }
    }

    rightPlayer(p) {
        var pIdx = this.players.indexOf(p);
        return this.players[(pIdx + 1) % this.players.length];
    }


    leftPlayer(p) {
        var pIdx = this.players.indexOf(p);
        return this.players[(pIdx - 1 + this.players.length) % this.players.length];
    }

    findById(playerId) {
        for (var pIdx in this.players) {
            if (this.players[pIdx].id == playerId) {
                return this.players[pIdx];
            }
        }
        return null;
    }
}

module.exports.PlayersPool = PlayersPool