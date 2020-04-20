import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';

import DeckStatus from './DeckStatus.jsx';

class DeckSummary extends React.Component {
    constructor() {
        super();

        this.onCardMouseOut = this.onCardMouseOut.bind(this);
        this.onCardMouseOver = this.onCardMouseOver.bind(this);

        this.state = {
            cardToShow: ''
        };
    }

    onCardMouseOver(event, code) {
        var cardToDisplay = _.filter(this.props.cards, card => {
            return code === card.code;
        });

        this.setState({ cardToShow: cardToDisplay[0] });
    }

    onCardMouseOut() {
        this.setState({ cardToShow: undefined });
    }

    getCardsToRender() {
        let cardsToRender = [];
        let groupedCards = {};

        let combinedCards = _.union(this.props.deck.objectiveCards, this.props.deck.mainDeckCards);

        _.each(combinedCards, (card) => {
            let type = card.card.type;

            if(!groupedCards[type]) {
                groupedCards[type] = [JSON.parse(JSON.stringify(card))];
            } else {
                let foundCard = _.find(groupedCards[type], groupedCard => groupedCard.card.cardNumber === card.card.cardNumber);
                if(foundCard) {
                    foundCard.count += card.count;
                } else {
                    groupedCards[type].push(JSON.parse(JSON.stringify(card)));
                }
            }
        });

        _.each(groupedCards, (cardList, key) => {
            let cards = [];
            let count = 0;

            _.each(cardList, card => {
                cards.push(<div key={ card.card.code }><span>{ card.count + 'x ' }</span><span className='card-link' onMouseOver={ event => this.onCardMouseOver(event, card.card.code) } onMouseOut={ this.onCardMouseOut }>{ card.card.name }</span></div>);
                count += parseInt(card.count);
            });

            cardsToRender.push(
                <div className='cards-no-break'>
                    <div className='card-group-title'>{ key + ' (' + count.toString() + ')' }</div>
                    <div key={ key } className='card-group'>{ cards }</div>
                </div>);
        });

        return cardsToRender;
    }

    render() {
        if(!this.props.deck) {
            return <div>Waiting for selected deck...</div>;
        }

        var cardsToRender = this.getCardsToRender();
        return (
            <div className='deck-summary col-xs-12'>
                { this.state.cardToShow ? <img className='hover-image' src={ '/img/cards/' + this.state.cardToShow.code + '.png' } /> : null }
                <div className='decklist'>
                    <div className='col-xs-2 col-sm-3 no-x-padding'>{ this.props.deck.affiliation ? <img className='deck-mon img-responsive' src={ '/img/affiliations/' + this.props.deck.affiliation.value + '-crest.png' } /> : null }</div>
                    <div className='col-xs-8 col-sm-8'>
                        <div className='info-row row'><span>Affiliation:</span>{ this.props.deck.affiliation ? <span className={ 'pull-right' }>{ this.props.deck.affiliation.name }</span> : null }</div>
                        <div className='info-row row' ref='objectiveCount'><span>Objective Deck:</span><span className='pull-right'>{ this.props.deck.status.objectiveCount } cards</span></div>
                        <div className='info-row row' ref='mainDeckDrawCount'><span>Main Deck:</span><span className='pull-right'>{ this.props.deck.status.mainDeckCount } cards</span></div>
                        <div className='info-row row'><span>Validity:</span>
                            <DeckStatus className='pull-right' status={ this.props.deck.status } />
                        </div>
                    </div>
                </div>
                <div className='col-xs-12 no-x-padding'>
                    <div className='cards'>
                        { cardsToRender }
                    </div>
                </div>
            </div>);
    }
}

DeckSummary.displayName = 'DeckSummary';
DeckSummary.propTypes = {
    cards: PropTypes.object,
    deck: PropTypes.object
};

export default DeckSummary;
