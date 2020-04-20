const path = require('path');
const CardgameDbToHantekiConverter = require('./CardgameDbToHantekiConverter');

let converter = new CardgameDbToHantekiConverter();

converter.convert();

