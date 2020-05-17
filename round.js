var card_deck = require("./card_deck.js")
class Round {
    constructor(cardsPerPlayer, playersPool, firstPlayer) {
        this.cardsPerPlayer = cardsPerPlayer;
        this.playersPool = playersPool;
        this.roundFirstPlayer = firstPlayer;
        this.handFirstPlayer = firstPlayer;
        this.cardDeck = new card_deck.CardDeck();
        this.cardDeck.shuffle();
        this.currentTurnToPlay = null;
        this.currentTurnToGuessBases = firstPlayer;
        this.triumph = null;
        this.roundEnded = false;
        this.scores = null;
    }

    deal() {
        for (var pIdx in this.playersPool.players) {
            var i = 0;
            var cards = [];
            while (i < this.cardsPerPlayer) {
                cards.push(this.cardDeck.pop())
                i++;
            }
            this.playersPool.players[pIdx].setCards(cards);
        }

        if (this.cardDeck.cards.length >= this.playersPool.players.length) {
            this.triumph = this.cardDeck.pop();
        }

    }

    scores() {
        if (!this.roundEnded) {
            var scores = [];
            for (var pIdx in this.playersPool.players) {
                scores.push({
                    "name": this.playersPool.players[pIdx].name,
                    "askedBases": p.askedBases,
                    "doneBases": p.doneBases,
                    "score": null
                });
            }
            return scores;
        }

        if (this.scores != null) {
            return this.scores;
        }
        this.calculateScores2()
        return this.scores();
    }

    calculateScores() {
        var scores = [];
        for (var pIdx in this.playersPool.players) {
            var p = this.playersPool.players[pIdx];
            var score;
            if (p.askedBases != p.doneBases) {
                score = p.doneBases - p.askedBases;
            } else {
                if (p.askedBases != this.cardsPerPlayer) {
                    score = 10 + p.askedBases;
                } else {
                    score = 10 + 2 * p.askedBases;
                }
            }
            scores.push({
                "name": p.name,
                "askedBases": p.askedBases,
                "doneBases": p.doneBases,
                "score": score
            });
            p.score += score;
        }
        this.scores = scores;
        return scores;
    }

    calculateScores2() {
        var scores = [];
        for (var pIdx in this.playersPool.players) {
            var p = this.playersPool.players[pIdx];
            var score;
            if (p.askedBases != p.doneBases) {
                score = -Math.abs(p.doneBases - p.askedBases);
            } else {
                if (p.askedBases != this.cardsPerPlayer) {
                    score = 10 + p.askedBases;
                } else {
                    score = 10 + 2 * p.askedBases;
                }
            }
            scores.push({
                "name": p.name,
                "askedBases": p.askedBases,
                "doneBases": p.doneBases,
                "score": score
            });
            p.score += score;
        }
        this.scores = scores;
        return scores;
    }

    canGuessBases(p, bases) {
        // To avoid mistakes, let's limit the amount of bases <= the amount of cards
        if (bases > this.cardsPerPlayer) {
            return false;
        }

        // except for last player, the other players don't have any restrictions
        if (this.playersPool.rightPlayer(p) != this.roundFirstPlayer) {
            return true
        }

        var currentAskedBases = 0;
        for (var pIdx in this.playersPool.players) {
            currentAskedBases += this.playersPool.players[pIdx].askedBases;
        }

        console.log("Current aske bases: " + currentAskedBases + "| Total: " + (currentAskedBases + bases) + "| Round: " + this.cardsPerPlayer);

        if ((currentAskedBases + bases) == this.cardsPerPlayer) {
            return false
        }
        return true
    }

    guessBases(p, bases) {
        if (!this.canGuessBases(p, bases)) {
            throw new Error("Can't ask for " + bases + " bases")
        }
        console.log(p.name + " guessing " + bases)
        p.askedBases = bases;
        var rightPlayer = this.playersPool.rightPlayer(p)
        this.currentTurnToGuessBases = rightPlayer;
        if (rightPlayer == this.roundFirstPlayer) {
            this.currentTurnToGuessBases = null;
            this.currentTurnToPlay = this.roundFirstPlayer;
            this.handFirstPlayer = this.roundFirstPlayer;
        }
    }

    canPlayCard(p, c) {
        if (p != this.currentTurnToPlay) {
            return false;
        }
        // First player can play anything
        if (p == this.handFirstPlayer) {
            return true;
        }

        // if suit == first card suit, then it's ok
        if (c.suit == this.handFirstPlayer.currentCard.suit) {
            return true;
        }

        // if not and he has cards of that suit, then he's at fault
        if (p.cardsOfSuit(this.handFirstPlayer.currentCard.suit).length > 0) {
            console.log("Player " + p.name + " has a card of the hands suit (" + this.handFirstPlayer.currentCard.suit + ")")
            return false;
        }

        // at this point, he's not playing the hand's suit but he doesn't have
        // any cards of the hand suit.
        // If this is a hand without triumph, then he can play anything
        if (this.triumph == null) {
            return true;
        }

        //If he wants to play triumph, then he can
        if (c.suit == this.triumph.suit) {
            return true;
        }

        var triumphCards = p.cardsOfSuit(this.triumph.suit)
        // At this point he's trying to play a suit different than the hand's suit 
        // and not  a triumph. If it doesn't have triumph either, then he can play it
        if (triumphCards.length == 0) {
            return true;
        }

        var highestPlayedTriumph = null;
        // At this point he's trying to play a suit different than the hand's suit
        // but he HAS triumph. He can only do that if a triumph has already been played
        // and it's greater than ALL he's triumphs.
        for (var pIdx in this.playersPool.players) {
            var playerCard = this.playersPool.players[pIdx].currentCard;

            if (playerCard != null && playerCard.suit == this.triumph.suit) {
                if (highestPlayedTriumph == null) {
                    highestPlayedTriumph = playerCard;
                } else {
                    if (playerCard.greaterThan(highestPlayedTriumph)) {
                        highestPlayedTriumph = playerCard
                    }
                }
            }
        }

        // Player has triumph yet triumph hasn't been played yet. Player MUST play triumph.
        if (highestPlayedTriumph == null) {
            console.log("Player " + p.name + " must play triumph")
            return false;
        }

        for (var cIdx in triumphCards) {
            if (triumphCards[cIdx].greaterThan(highestPlayedTriumph)) {
                console.log("Player " + p.name + " must play a higher triumph")
                return false;
            }
        }
        return true;
    }

    playCard(p, c) {
        if (!this.canPlayCard(p, c)) {
            throw new Error("Can't play that card")
        }

        p.playCard(c);

        var rightPlayer = this.playersPool.rightPlayer(p)
        this.currentTurnToPlay = rightPlayer;
    }

    endHand() {
        // hand is over, let's see who won the base
        var winner = this.handWinner();
        winner.doneBases += 1;

        // Clean cards
        for (var pIdx in this.playersPool.players) {
            this.playersPool.players[pIdx].currentCard = null;
        }

        this.handFirstPlayer = winner;
        this.currentTurnToPlay = winner;

        if (this.isRoundDone()) {
            this.currentTurnToPlay = null;
            this.calculateScores2();
        }
    }

    endRound() {
        // Clean Guesses
        for (var pIdx in this.playersPool.players) {
            this.playersPool.players[pIdx].askedBases = null;
            this.playersPool.players[pIdx].doneBases = 0;
            this.playersPool.players[pIdx].cards = [];
        }
    }

    isHandDone() {
        for (var pIdx in this.playersPool.players) {
            if (this.playersPool.players[pIdx].currentCard == null) {
                return false;
            }
        }
        return true;
    }

    isRoundDone() {
        var done = true;
        for (var pIdx in this.playersPool.players) {
            if (this.playersPool.players[pIdx].cards.length > 0) {
                done = false;
                break;
            }
        }
        return done;
    }

    // Rules to win:
    // 
    handWinner() {
        var winner = this.handFirstPlayer;
        var rp = this.playersPool.rightPlayer(this.handFirstPlayer)
        while (rp != this.handFirstPlayer) {
            // If it is the same suit, the bigger the better
            // This applies in the case of original suit or triumph suit
            if (rp.currentCard.suit == winner.currentCard.suit) {
                if (rp.currentCard.greaterThan(winner.currentCard)) {
                    winner = rp;
                }
            } else {
                // If rp is not triumph, it doesn't have a chance to win
                if (this.triumph != null && rp.currentCard.suit == this.triumph.suit) {
                    winner = rp;
                }
            }
            rp = this.playersPool.rightPlayer(rp);
        }
        return winner;
    }
}

module.exports.Round = Round;