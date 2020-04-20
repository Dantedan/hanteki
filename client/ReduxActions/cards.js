import $ from 'jquery';

export function loadCards() {
    return {
        types: ['REQUEST_CARDS', 'RECEIVE_CARDS'],
        shouldCallAPI: (state) => {
            return !state.cards.cards;
        },
        callAPI: () => $.ajax('/api/cards', { cache: false })
    };
}

export function loadAffiliations() {
    return {
        types: ['REQUEST_AFFILIATIONS', 'RECEIVE_AFFILIATIONS'],
        shouldCallAPI: (state) => {
            return !state.cards.affiliations;
        },
        callAPI: () => $.ajax('/api/affiliations', { cache: false })
    };
}
