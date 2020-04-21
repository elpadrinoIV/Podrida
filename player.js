var card = require("./card.js")

class Player {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.cards = [];
        this.score = null;
        this.askedBases = null;
        this.doneBases = 0;
        this.currentCard = null;
    }

    setCards(cards) {
        this.cards = cards;
        this.sortCards();
    }

    sortCards() {
        this.cards.sort(function (a, b) {
            if (a.suit == b.suit) {
                if (a.greaterThan(b)) {
                    return 1;
                } else if (b.greaterThan(a)) {
                    return -1;
                } else {
                    return 0;
                }
            } else if (card.SuitOrder[a.suit] > card.SuitOrder[b.suit]) {
                return 1;
            } else {
                return -1;
            }
        }

        );
    }

    findCard(c) {
        for (var cIdx in this.cards) {
            if (this.cards[cIdx].equals(c)) {
                return this.cards[cIdx];
            }
        }
        return null;
    }

    playCard(c) {
        var cIdx = this.cards.indexOf(c)
        this.currentCard = c;
        this.cards = this.cards.slice(0, cIdx).concat(this.cards.slice(cIdx + 1, this.cards.length));
    }

    cardsOfSuit(suit) {
        var cards = []
        for (var cIdx in this.cards) {
            if (this.cards[cIdx].suit == suit) {
                cards.push(this.cards[cIdx])
            }
        }
        return cards;
    }
}

module.exports.Player = Player;