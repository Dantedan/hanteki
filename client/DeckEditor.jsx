import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import $ from 'jquery';
import { connect } from 'react-redux';
import { findDOMNode } from 'react-dom';

import Input from './FormComponents/Input.jsx';
import Select from './FormComponents/Select.jsx';
import Typeahead from './FormComponents/Typeahead.jsx';
import TextArea from './FormComponents/TextArea.jsx';

import * as actions from './actions';

class InnerDeckEditor extends React.Component {
    constructor(props) {
        super(props);

        this.onImportDeckClick = this.onImportDeckClick.bind(this);

        this.state = {
            cardList: '',
            deck: this.copyDeck(props.deck),
            numberToAdd: 1,
            validation: {
                deckname: '',
                cardToAdd: ''
            }
        };
    }

    componentWillMount() {
        if(!this.props.deck.affiliation && this.props.affiliations) {
            let deck = this.copyDeck(this.state.deck);

            deck.affiliation = this.props.affiliations['jedi'];

            this.setState({ deck: deck });
            this.props.updateDeck(deck);
        }
        let cardList = '';

        if(this.props.deck && (this.props.deck.objectiveCards || this.props.deck.commandDeckCards)) {
            _.each(this.props.deck.objectiveCards, card => {
                cardList += this.getCardListEntry(card.count, card.card);
            });

            this.setState({ cardList: cardList });
        }
    }

    // XXX One could argue this is a bit hacky, because we're updating the innards of the deck object, react doesn't update components that use it unless we change the reference itself
    copyDeck(deck) {
        if(!deck) {
            return { name: 'New Deck'};
        }

        return {
            _id: deck._id,
            name: deck.name,
            objectiveCards: deck.objectiveCards,
            commandDeckCards: deck.commandDeckCards,
            affiliation: deck.affiliation,
            status: deck.status
        };
    }

    onChange(field, event) {
        let deck = this.copyDeck(this.state.deck);

        deck[field] = event.target.value;

        this.setState({ deck: deck });
        this.props.updateDeck(deck);
    }

    onNumberToAddChange(event) {
        this.setState({ numberToAdd: event.target.value });
    }

    onAffiliationChange(selectedAffiliation) {
        let deck = this.copyDeck(this.state.deck);

        deck.affiliation = selectedAffiliation;

        this.setState({ deck: deck });
        this.props.updateDeck(deck);
    }

    addObjectiveChange(selectedCards) {
        this.setState({ cardToAdd: selectedCards[0] });
    }

    onAddObjective(event) {
        event.preventDefault();

        if(!this.state.cardToAdd || !this.state.cardToAdd.name) {
            return;
        }
        this.addObjective(this.state.cardToAdd, parseInt(this.state.numberToAdd));
        this.addCardToCardList(this.state.numberToAdd, this.state.cardToAdd);
        let deck = this.state.deck;
        deck = this.copyDeck(deck);
        this.props.updateDeck(deck);
    }

    onCardListChange(event) {
        let deck = this.state.deck;
        let split = event.target.value.split('\n');

        deck.objectiveCards = [];
        deck.commandDeckCards = [];

        _.each(split, line => {
            line = line.trim();
            let index = 2;

            if(!$.isNumeric(line[0])) {
                return;
            }

            let num = parseInt(line[0]);
            if(line[1] === 'x') {
                index++;
            }

            let packOffset = line.indexOf('(');
            let cardName = line.substr(index, packOffset === -1 ? line.length : packOffset - index - 1);

            let card = _.find(this.props.cards, function(card) {
                return card.type === 'objective' && card.name.toLowerCase() === cardName.toLowerCase();
            });

            if(card) {
                this.addObjective(card, num);
            }
        });
        deck = this.copyDeck(this.state.deck);

        this.setState({ cardList: event.target.value, deck: deck }); // Alliance
        this.props.updateDeck(deck);
    }

    addObjective(objectiveCard, number) {
        let deck = this.copyDeck(this.state.deck);
        let objectives = deck.objectiveCards;
        let commandDeck = deck.commandDeckCards;

        let deckObjective = _.find(objectives, objective => objective.card.code === objectiveCard.code);
        if(deckObjective) {
            deckObjective.count += number;
        } else {
            objectives.push({ count: number, card: objectiveCard });
        }
        
        let commandDeckCards = _.pick(this.props.cards, function(card) {
            return card.objectiveSetNumber === objectiveCard.objectiveSetNumber && card.type !== 'objective';
          });

        _.each(commandDeckCards, function(card) {
            let commandDeckCard = _.find(commandDeck, commandDeckCard => commandDeckCard.card.code === card.code);
            if(commandDeckCard) {
                commandDeckCard.count += number;
            } else {
                commandDeck.push({ count: number, card: card });
            }
        })
    }

    addCardToCardList(numberToAdd, cardToAdd) {
        let cardList = this.state.cardList;
        let split = cardList.split('\n');
        let found = false;
        cardList = '';
        _.each(split, line => {
            if(line !== '') {
                line = line.trim();
                let index = 2;
    
                let num = parseInt(line[0]);
                if(line[1] === 'x') {
                    index++;
                }
                let card = line.substr(index, line.length );
                if(card === cardToAdd.name + ' (' + cardToAdd.setName + ')') {
                    cardList += this.getCardListEntry(num + numberToAdd, cardToAdd);
                    found = true;
                } else {
                    cardList += line + '\n';
                }
            }
        });
        if(!found) {
            cardList += this.getCardListEntry(numberToAdd, cardToAdd);
        }
        this.setState({ cardList: cardList });
    }



    onSaveClick(event) {
        event.preventDefault();

        if(this.props.onDeckSave) {
            this.props.onDeckSave(this.props.deck);
        }
    }

    onImportDeckClick() {
        $(findDOMNode(this.refs.modal)).modal('show');
    }

    getCardListEntry(count, card) {
        return count + ' ' + card.name + ' (' + card.setName + ')\n';
    }

    // importDeck() {
    //     $(findDOMNode(this.refs.modal)).modal('hide');

    //     let importUrl = document.getElementById('importUrl').value;

    //     let apiUrl = 'https://api.fiveringsdb.com/';
    //     let strainPath = 'strains';
    //     let deckPath = 'decks';
    //     let deckResponse = {};

    //     let importId = String(importUrl).split('/')[4];
    //     let selector = String(importUrl).split('/')[3];

    //     let path = '';
    //     if(selector === 'decks') {
    //         path = deckPath;
    //     } else if(selector === 'strains') {
    //         path = strainPath;
    //     }

    //     $.ajax({
    //         type: 'GET',
    //         url: apiUrl + path + '/' + importId,
    //         dataType: 'json',
    //         async: false,
    //         success: function(data) {
    //             deckResponse = data;
    //         }
    //     });

    //     let deckClan = '';
    //     let deckAlliance = '';
    //     let deckName = '';
    //     let deckList = '';
    //     let cardList = '';


    //     if(deckResponse.success) {
    //         let deckRecord = deckResponse.record;
    //         if(selector === 'decks') {
    //             deckAffiliation = deckRecord.affiliation;
    //             deckName = deckRecord.name;
    //             deckList = deckRecord.cards;
    //         } else if(selector === 'strains') {
    //             deckAffiliation = deckRecord.head.affiliation;
    //             deckName = deckRecord.head.name;
    //             deckList = deckRecord.head.cards;
    //         }

    //         let deck = this.copyDeck(this.state.deck);

    //         deck.name = deckName;
    //         if(deckAffiliation) {
    //             deck.affiliation = this.props.affiliations[deckClan];
    //         } else {
    //             deck.affiliation = this.props.affiliations['jedi'];
    //         }

    //         _.each(deckList, (count, id) => {
    //             cardList += this.getCardListEntry(count, this.props.cards[id]);
    //         });

    //         //Duplicate onCardListChange to get this working correctly
    //         let split = cardList.split('\n');
    //         _.each(split, line => {
    //             line = line.trim();
    //             let index = 2;

    //             if(!$.isNumeric(line[0])) {
    //                 return;
    //             }

    //             let num = parseInt(line[0]);
    //             if(line[1] === 'x') {
    //                 index++;
    //             }

    //             let packOffset = line.indexOf('(');
    //             let cardName = line.substr(index, packOffset === -1 ? line.length : packOffset - index - 1);


    //             let card = _.find(this.props.cards, function(card) {
    //                 return card.name.toLowerCase() === cardName.toLowerCase();
    //             });

    //             if(card) {
    //                 //Duplicate addCard as well
    //                 let objectives = deck.objectiveCards;
    //                 let commandDeck = deck.commandDeckCards;

    //                 let list;

    //                 if(card.type === 'objective') {
    //                     list = objectives;
    //                 } else {
    //                     list = commandDeck;
    //                 }

    //                 if(list[card.id]) {
    //                     list[card.id].count += num;
    //                 } else {
    //                     list.push({ count: num, card: card });
    //                 }
    //             }
    //         });


    //         this.setState({cardList: cardList, deck: deck });
    //         this.props.updateDeck(deck);

    //     }
    // }

    render() {
        if(!this.props.deck || this.props.loading) {
            return <div>Waiting for deck...</div>;
        }

        // let popup = (
        //     <div id='decks-modal' ref='modal' className='modal fade' tabIndex='-1' role='dialog'>
        //         <div className='modal-dialog' role='document'>
        //             <div className='modal-content deck-popup'>
        //                 <div className='modal-header'>
        //                     <button type='button' className='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>×</span></button>
        //                     <h4 className='modal-title'>Provide Permalink</h4>
        //                 </div>
        //                 <div className='modal-body'>
        //                     <Input name='importUrl' fieldClass='col-sm-9' placeholder='Permalink' type='text' >
        //                         <div className='col-sm-1'>
        //                             <button className='btn btn-default' onClick={ this.importDeck.bind(this) }>Import</button>
        //                         </div>
        //                     </Input>
        //                 </div>
        //             </div>
        //         </div>
        //     </div>);

        return (
            <div>
                {/* { popup } */}
                {/* <span className='btn btn-primary' data-toggle='modal' data-target='#decks-modal'>Import deck</span>
                <h4>Either type the cards manually into the box below, add the cards one by one using the card box and autocomplete or for best results, copy the permalink url from <a href='http://fiveringsdb.com' target='_blank'>Five Rings DB</a> and paste it into the popup from clicking the "Import Deck" button.</h4> */}
                <form className='form form-horizontal'>
                    <Input name='deckName' label='Deck Name' labelClass='col-sm-3' fieldClass='col-sm-9' placeholder='Deck Name'
                        type='text' onChange={ this.onChange.bind(this, 'name') } value={ this.state.deck.name } />
                    <Select name='affiliation' label='Affiliation' labelClass='col-sm-3' fieldClass='col-sm-9' options={ _.toArray(this.props.affiliations) }
                        onChange={ this.onAffiliationChange.bind(this) } value={ this.state.deck.affiliation ? this.state.deck.affiliation.value : undefined } />

                    <Typeahead label='Objective' labelClass={ 'col-sm-3' } fieldClass='col-sm-4' labelKey={ 'name' } options={ this.getObjectives(this.props.cards) }
                        onChange={ this.addObjectiveChange.bind(this) }>
                        <Input name='numcards' type='text' label='Num' labelClass='col-sm-1' fieldClass='col-sm-2'
                            value={ this.state.numberToAdd.toString() } onChange={ this.onNumberToAddChange.bind(this) }>
                            <div className='col-sm-1'>
                                <button className='btn btn-primary' onClick={ this.onAddObjective.bind(this) }>Add</button>
                            </div>
                        </Input>
                    </Typeahead>
                    <TextArea label='Cards' labelClass='col-sm-3' fieldClass='col-sm-9' rows='10' value={ this.state.cardList }
                        onChange={ this.onCardListChange.bind(this) } />
                    <div className='form-group'>
                        <div className='col-sm-offset-3 col-sm-8'>
                            <button ref='submit' type='submit' className='btn btn-primary' onClick={ this.onSaveClick.bind(this) }>Save Deck</button>
                        </div>
                    </div>
                </form>
            </div>
        );
    }

    getObjectives(cards) {
        let cardArray = _.toArray(cards);
        return cardArray.filter(card => card.type === 'objective');
    }
}

InnerDeckEditor.displayName = 'DeckEditor';
InnerDeckEditor.propTypes = {
    cards: PropTypes.object,
    deck: PropTypes.object,
    affiliations: PropTypes.object,
    loading: PropTypes.bool,
    onDeckSave: PropTypes.func,
    updateDeck: PropTypes.func
};

function mapStateToProps(state) {
    return {
        apiError: state.api.message,
        cards: state.cards.cards,
        deck: state.cards.selectedDeck,
        decks: state.cards.decks,
        affiliations: state.cards.affiliations,
        loading: state.api.loading,
    };
}

const DeckEditor = connect(mapStateToProps, actions)(InnerDeckEditor);

export default DeckEditor;
