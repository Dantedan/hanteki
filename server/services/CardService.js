const _ = require('underscore');

const logger = require('../log.js');

class CardService {
    constructor(db) {
        this.cards = db.get('cards');
    }

    replaceCards(cards) {
        return this.cards.remove({})
            .then(() => this.cards.insert(cards));
    }

    getAllCards(options) {
        return this.cards.find({})
            .then(result => {
                let cards = {};

                _.each(result, card => {
                    // if(options && options.shortForm) {
                    //     cards[card.id] = _.pick(card, 'id', 'name', 'type', 'clan', 'side', 'deck_limit', 'element', 'unicity', 'influence_cost', 'influence_pool', 'pack_cards', 'role_restriction', 'allowed_clans');
                    // } else {
                        cards[card.code] = card;
                    // }
                });

                return cards;
            }).catch(err => {
                logger.info(err);
            });
    }
}

module.exports = CardService;

