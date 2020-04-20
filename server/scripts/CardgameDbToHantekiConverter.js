const fs = require('fs');
const request = require('request');
const path = require('path');
const pathToCards = './cards.json'


class CardgameDbToHantekiConverter {
    constructor() {
        this.affiliationCount = 0;
    }
    convert() {
        const CreateFiles = fs.createWriteStream(pathToCards)
      
        return this.getCGDBData()
            .then(cards => {
                let currentPackCards = cards.map(card => this.convertCard(card));
                currentPackCards.sort((a, b) => (a.objectiveSetNumber + (0.1*a.objectiveSetNumberOfSix)) < (b.objectiveSetNumber + (0.1*b.objectiveSetNumberOfSix)) ? -1 : 1);
                currentPackCards.forEach(card => CreateFiles.write(JSON.stringify(card)+'\r\n'));
                console.log('Import of cards has been completed.');
            });
    }

    getCGDBData() {
        const url = `http://www.cardgamedb.com/deckbuilders/starwars/database/swjson-cgdb-42.jgz`;

        return new Promise((resolve, reject) => {
            request.get(url, { gzip: true }, function(error, res, body) {
                if(error) {
                    console.log(error);
                    return reject(error);
                }

                // Get rid of the preceding 'cards = ' and trailing semi-colon
                let jsonText = body.substr(8, body.length - 9);
                resolve(JSON.parse(jsonText));
            });
        });
    }

    convertCard(cardData) {
        let text = this.formatTextField(cardData.text);

        let modifierMatch = text.match(/<b>.*\[\+.*\]<\/b>/);
        if(modifierMatch) {
            const pattern = /\[\+(.+?)\]/g;
            let modifiers = '';
            let match;
            while((match = pattern.exec(modifierMatch[0])) !== null) {
                modifiers += '+' + match[1].trim() + '.';
            }
            modifiers = modifiers.replace('gold', 'Income').replace('initiative', 'Initiative').replace('reserve', 'Reserve').replace('claim', 'Claim');
            text = text.replace(modifierMatch[0], modifiers);
        }

        let card = {};
        card.code = this.getIntField(cardData.numericblock) + '-' + this.getIntField(cardData.blocknumber);
        card.type = (cardData.type.toLowerCase() == 'phase sequence' ? 'affiliation' : cardData.type.toLowerCase());
        if(card.type == 'affiliation') {
            card.code = '0-' + this.affiliationCount;
            this.affiliationCount++;
        }
        card.name = this.cleanUpField(cardData.name);
        card.flavor = this.cleanUpField(cardData.flavor);
        card.setId = this.getIntField(cardData.setid);
        card.setName = this.cleanUpField(cardData.setname);
        card.objectiveSetNumber = this.getIntField(cardData.numericblock);
        card.objectiveSetNumberOfSix = this.getIntField(cardData.blocknumber);
        card.cardNumber = this.getIntField(cardData.number);

        card.unique = cardData.unique === 'Yes';

        card.side = cardData.side;
        card.affiliation = cardData.affiliation.substr(0, cardData.affiliation.indexOf(" ") > 0 ? cardData.affiliation.indexOf(" ") : cardData.affiliation.length).toLowerCase();

        if(card.type === 'objective') {
            card.limit1PerObjectiveDeck = cardData.text.includes('Limit 1 per objective deck');
            card.loyalAffiliationOnly = cardData.text.includes('affiliation only');
        }

        if(['enhancement', 'unit', 'objective', 'mission'].includes(card.type)) {
            card.resources = this.getIntField(cardData.resources);
        }

        if(['enhancement', 'unit', 'event', 'mission'].includes(card.type)) {
            card.cost = this.getIntField(cardData.cost);
        }

        if(['enhancement', 'unit', 'event', 'mission', 'fate'].includes(card.type)) {
            card.force = this.getIntField(cardData.force);
        }

        if(card.type === 'unit') {
            card.icons = {
                udb: this.getIntField(cardData.udb),
                udw: this.getIntField(cardData.udw),
                bdb: this.getIntField(cardData.bdb),
                bdw: this.getIntField(cardData.bdw),
                tb: this.getIntField(cardData.tb),
                tw: this.getIntField(cardData.tw)
            };
            card.health = this.getIntField(cardData.health);
        }

        if(['fate'].includes(card.type)) {
            card.fate = this.getIntField(cardData.fate);
        }

        card.traits = this.cleanUpField(cardData.traits).split('.').filter(trait => trait !== '').map(trait => trait.trim());
        card.text = this.cleanUpField(text);

        card.image = 'http://www.cardgamedb.com/forums/uploads/sw/' + (cardData.furl ? cardData.furl : cardData.img) + '.png';
            
        // if (!fs.existsSync('./images2/' + card.code + '.jpg') || !fs.existsSync('./images2/' + card.code + '.png')) {
        //     this.download(card.image, './images2/' + card.code + '.jpg');
        // }

        return card;
    }

    formatTextField(text) {
        text = text.replace(/<em class='bbc'><strong class='bbc'>/gi, '<i>').replace(/<\/strong><\/em>/gi, '</i>');
        text = text.replace(/<SPAN  style=&quot;font-weight: bold&quot; >/gi, '<span>').replace(/<\/SPAN>/gi, '</span>');
        text = text.replace(/<SPAN  style=&quot;font-weight: bold;font-style:italic&quot; >/gi, '<span>').replace(/<\/SPAN>/gi, '</span>');
        text = text.replace(/<SPAN  style=&quot;font-style:italic&quot; >/gi, '<span>').replace(/<\/SPAN>/gi, '</span>');
        text = text.replace(/<SPAN STYLE=&quot;&quot; >/gi, '<span>').replace(/<\/SPAN>/gi, '</span>');
        
        
        text = text.replace(/<br\s*\/>/gi, '\n');
        text = text.replace(/<strong class='bbc'>/gi, '<b>').replace(/<\/strong>/gi, '</b>').replace(/<em class='bbc'>/gi, '<i>').replace(/<\/em>/gi, '</i>');
        text = text.replace(/<\/(i|b)>:/gi, function(match, element) {
            return `:</${element}>`;
        });
        text = text.replace(/(\s+)<\/(b|i)>/g, function(match, spacing, element) {
            return `</${element}>${spacing}`;
        });
        text = text.replace(/<(b|i)>(\s+)/g, function(match, element, spacing) {
            return `${spacing}<${element}>`;
        });
        text = text.replace(/<(b|i)><\/(b|i)>/g, '');
        text = text.replace(/\[.+?\]/g, function(match) {
            return match.toLowerCase();
        });
        // Remove keyword definitions
        text = text.replace(/<i>\(.+?\)<\/i>/gi, '');
        // Remove card designer since it's a separate field
        text = text.replace(/\n<b>Card design.*<\/b>/gi, '');
        // Move spaces outside of elements
        text = text.replace(/(\s+)<\/.+?>/gi, function(match) {
            return match.trim() + ' ';
        });
        text = text.replace(/( )+\n/gi, '\n');
        return text;
    }

    getIntField(text) {
        if(text === 'X' || text === '-') {
            return text;
        }

        return parseInt(text);
    }

    cleanUpField(text) {
        const replacements = [
            { original: /“/g, replace: '"' },
            { original: /”/g, replace: '"' },
            { original: /&ldquo;/g, replace: '"' },
            { original: /&rdquo;/g, replace: '"' },
            { original: /’/g, replace: '\'' },
            { original: /&rsquo;/g, replace: '\'' },
            { original: /&#39;/g, replace: '\'' },
            { original: /&quot;/g, replace: '"' },
            { original: /&#33;/g, replace: '\!' }
        ];

        return replacements.reduce((text, r) => text.replace(r.original, r.replace), text).trim();
    }

    download(uri, filename){
        request.head(uri, function(err, res, body){
      
          request(uri).pipe(fs.createWriteStream(filename)).on('error',function(error){console.log(error)});
        });
      };
}

module.exports = CardgameDbToHantekiConverter;
