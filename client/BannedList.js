const bannedList = {
    version: '1',
    cards: []
};

class BannedList {
    validate(cards) {
        let cardsOnBannedList = cards.filter(card => bannedList.cards.includes(card.id));

        let errors = [];

        if(cardsOnBannedList.length > 1) {
            errors.push(`Contains a card on the FAQ v${bannedList.version} banned list: ${cardsOnBannedList.map(card => card.name).join(', ')}`);
        }

        return {
            version: bannedList.version,
            valid: errors.length === 0,
            errors: errors,
            restrictedCards: cardsOnBannedList
        };
    }
}

module.exports = BannedList;
