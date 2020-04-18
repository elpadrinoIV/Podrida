class PlayersPool {
    constructor(players) {
        this.players = players;
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