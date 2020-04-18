var card = require('./card.js')

class CardDeck {
    constructor() {
        this.cards = [];

        for (var suit in card.CardSuit) {
            for (var number in card.CardValues) {
                var c = new card.Card(number, card.CardSuit[suit]);
                this.cards.push(c);
            }
        }
    }

    toString() {
        var s = ""
        for (var c in this.cards) {
            s += c + ": " + this.cards[c].toString() + "\n";
        }
        return s;
    }

    shuffle() {
        var currIdx = this.cards.length;
        var idx;
        var temp;

        while (currIdx > 0) {
            idx = Math.floor(Math.random() * currIdx);
            currIdx--;
            temp = this.cards[currIdx];
            this.cards[currIdx] = this.cards[idx];
            this.cards[idx] = temp;
        }
    }

    pop() {
        return this.cards.pop();
    }
}

module.exports.CardDeck = CardDeck;