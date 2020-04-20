const $ = require('jquery'); // eslint-disable-line no-unused-vars
const _ = require('underscore');
const moment = require('moment');

const RestrictedList = require('./RestrictedList');
const BannedList = require('./BannedList');

function getDeckCount(deck) {
    let count = 0;

    _.each(deck, function(card) {
        count += card.count;
    });

    return count;
}

/**
 * Validation rule structure is as follows. All fields are optional.
 *
 * requiredDraw  - the minimum amount of cards required for the draw deck.
 * requiredPlots - the exact number of cards required for the plot deck.
 * maxDoubledPlots - the maximum amount of plot cards that can be contained twice in the plot deck.
 * mayInclude    - function that takes a card and returns true if it is allowed in the overall deck.
 * cannotInclude - function that takes a card and return true if it is not allowed in the overall deck.
 * rules         - an array of objects containing a `condition` function that takes a deck and return true if the deck is valid for that rule, and a `message` used for errors when invalid.
 */

class DeckValidator {
    constructor(packs) {
        this.packs = packs;
        this.bannedList = new BannedList();
        this.restrictedList = new RestrictedList();
    }

    validateDeck(deck) {
        let errors = [];
        let rules = this.getRules(deck);
        let objectiveCount = getDeckCount(deck.objectiveCards);

        if(objectiveCount < rules.minimumObjective) {
            errors.push('A deck requires a minimum of 10 objectives');
        }

        _.each(rules.rules, rule => {
            if(!rule.condition(deck)) {
                errors.push(rule.message);
            }
        });

        let objectiveCards = deck.objectiveCards;

        _.each(objectiveCards, objectiveCard => {

            if(objectiveCard.card.limit1PerObjectiveDeck && objectiveCard.count > 1) {
                errors.push(objectiveCard.card.name + ' is limited to 1 per objective deck');
            }

            if(objectiveCard.count > 2) {
                errors.push('limit 2 objective copies per deck');
            }

            if(objectiveCard.card.loyalAffiliationOnly && deck.affiliation.value !== objectiveCard.card.affiliation) {
                errors.push(objectiveCard.card.name + ' is ' + objectiveCard.card.affiliation + ' affiliation only');
            }
        });

        let restrictedResult = this.restrictedList.validate(objectiveCards.map(cardQuantity => cardQuantity.card));
        let bannedResult = this.bannedList.validate(objectiveCards.map(cardQuantity => cardQuantity.card));

        return {
            basicRules: errors.length === 0,
            faqRestrictedList: restrictedResult.valid && bannedResult.valid,
            faqVersion: restrictedResult.version,
            objectiveCount: objectiveCount,
            extendedStatus: errors.concat(restrictedResult.errors, bannedResult.errors)
        };
    }

    getRules(deck) {
        const standardRules = {
            minimumObjective: 10,
        };
        let affiliationRules = this.getAffiliationRules(deck.affiliation.value.toLowerCase());

        return this.combineValidationRules([standardRules, affiliationRules]);
    }

    getAffiliationRules(affiliation) {
        return {
            mayInclude: card => card.side === affiliation.side
        };
    }

    combineValidationRules(validators) {
        let mayIncludeFuncs = _.compact(_.pluck(validators, 'mayInclude'));
        let cannotIncludeFuncs = _.compact(_.pluck(validators, 'cannotInclude'));
        let combinedRules = _.reduce(validators, (rules, validator) => rules.concat(validator.rules || []), []);
        let combined = {
            mayInclude: card => _.any(mayIncludeFuncs, func => func(card)),
            cannotInclude: card => _.any(cannotIncludeFuncs, func => func(card)),
            rules: combinedRules
        };
        return _.extend({}, ...validators, combined);
    }
}

module.exports = function validateDeck(deck, options) {
    options = Object.assign({ includeExtendedStatus: true }, options);

    let validator = new DeckValidator(options.packs);
    let result = validator.validateDeck(deck);

    if(!options.includeExtendedStatus) {
        return _.omit(result, 'extendedStatus');
    }

    return result;
};
