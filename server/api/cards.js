const monk = require('monk');
const config = require('config');
const CardService = require('../services/CardService.js');

let db = monk(config.dbPath);
let cardService = new CardService(db);

module.exports.init = function(server) {
    server.get('/api/cards', function(req, res, next) {
        cardService.getAllCards({ shortForm: true })
            .then(cards => {
                res.send({ success: true, cards: cards });
            })
            .catch(err => {
                return next(err);
            });
    });

    server.get('/api/affiliations', function(req, res) {
        let affiliations = [
            { name: 'Jedi', value: 'jedi', side: 'Light' },
            { name: 'Rebel Alliance', value: 'rebel', side: 'Light' },
            { name: 'Smugglers and Spies', value: 'smugglers', side: 'Light' },
            { name: 'Sith', value: 'sith', side: 'Dark' },
            { name: 'Imperial Navy', value: 'imperial', side: 'Dark' },
            { name: 'Scum and Villainy', value: 'scum', side: 'Dark' }
        ];
        res.send({ success: true, affiliations: affiliations });
    });
};
