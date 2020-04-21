
const SuitOrder = { "S": 1, "H": 2, "C": 3, "D": 4 }
const CardSuit = { "SPADES": "S", "HEARTS": "H", "CLUBS": "C", "DIAMONDS": "D" }
const CardValues = { "1": 14, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13 }
class Card {
    constructor(number, suit) {
        this.number = number;
        this.suit = suit;
        this.imageName = this.imageName();
    }

    value() {
        return CardValues[this.number];
    }

    greaterThan(otherCard) {
        return this.value() > otherCard.value();
    }

    imageName() {
        var name = this.number + this.suit + ".png";
        return name;
    }

    toString() {
        return this.number + " of " + this.suit;
    }

    equals(c) {
        return this.suit == c.suit && this.number == c.number;
    }
}

module.exports.CardSuit = CardSuit;
module.exports.Card = Card;
module.exports.CardValues = CardValues;
module.exports.SuitOrder = SuitOrder;