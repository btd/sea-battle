var GameStatus = require('view/status'),
    ShipsSelect = require('view/ships'),
    FieldView = require('view/field'),
    Field = require('collection/field'),
    Player = require('model/player'),
    Ships = require('collection/ship'),
    _ = require('lodash'),
    Backbone = require('backbone');

var length = 10;

var ships = new Ships([{ length: 4} , { length: 3}, { length: 3}, { length: 2}, { length: 2}, { length: 2}, { length: 1}, { length: 1}, { length: 1}, { length: 1}]);
var shipsForOther = new Ships([{ length: 4} , { length: 3}, { length: 3}, { length: 2}, { length: 2}, { length: 2}, { length: 1}, { length: 1}, { length: 1}, { length: 1}]);

var numberOfShips = ships.length;

var fields = [ Field.ofSize(length), Field.ofSize(length) ];

var shipsSelector = new ShipsSelect({ el: '.ships', ships: ships });

var fieldViews = [
    new FieldView({ el: '.field.current-player', field: fields[0], ships: ships }),
    new FieldView({ el: '.field.other-player', field: fields[1], ships: shipsForOther, hidden: true })
];

var otherPlayer = new Player({ field: fields[1]});
var currentPlayer = new Player({ field: fields[0]});


var statusText = {
    placeShips: 'Выбери корабль и помести на поле. Вращать на  R.',
    waitOtherPlayerPlace: 'Жди пока соперник разместит корабли.',
    waitOtherPlayerShot: 'Жди выстрела.',
    waitCurrentPlayerShot: 'Стреляй.',
    currentPlayerWin: 'Победил',
    otherPlayerWin: 'Проиграл'
}

var gameStatus = new GameStatus({ el: '.game-status'});

gameStatus.setStatus(statusText.placeShips);

shipsSelector.on('ship:select', function(ship) {
    fieldViews[0].setSelectedShip(ship);
});

shipsSelector.on('ship:unselect', function() {
    fieldViews[0].setSelectedShip();
});

fields[0].ships.on('add', function(model, coll) {
    if(coll.length === numberOfShips) {
        shipsSelector.remove();
        gameStatus.setStatus(statusText.waitOtherPlayerPlace);

        otherPlayer.placeShips(shipsForOther);

        gameStatus.setStatus(statusText.waitCurrentPlayerShot);

        fieldViews[1].prepareToBattle();
    }
});


shipsSelector.once('ship:random_place', function() {
    currentPlayer.placeShips(ships);
});

var waitForNextShot;

fieldViews[1].on('shot:out', function() {
    fieldViews[1].waitTurn();

    gameStatus.setStatus(statusText.waitOtherPlayerShot);

    fieldViews[0].prepareToBattle();
    var res = otherPlayer.makeShot(fields[0]);
    if(res) {
        if(!_.isBoolean(res) && tryFinishGame(fields[0], statusText.otherPlayerWin)) {
            return;
        }

        waitForNextShot = setInterval(function() {
            res = otherPlayer.makeShot(fields[0]);

            if(!res) {
                clearInterval(waitForNextShot);

                fieldViews[0].waitTurn();

                gameStatus.setStatus(statusText.waitCurrentPlayerShot);

                fieldViews[1].prepareToBattle();
            } else if(!_.isBoolean(res) &&
                 tryFinishGame(fields[0], statusText.otherPlayerWin)) clearInterval(waitForNextShot);
        }, 1000);


    } else {

        fieldViews[0].waitTurn();

        gameStatus.setStatus(statusText.waitCurrentPlayerShot);

        fieldViews[1].prepareToBattle();
    }
});

fieldViews[1].on('shot:final', function() {
    tryFinishGame(fields[1], statusText.currentPlayerWin);
});

var tryFinishGame = function(f, status) {
    if(isAllShipsInShot(f)) {
        fieldViews[0].waitTurn();
        fieldViews[1].waitTurn();

        gameStatus.setStatus(status);
        return true;
    }
}

var isAllShipsInShot = function(f) {
    var res = true;
    f.ships.each(function(ship) {
        if(ship.safe !== 0) {
            res = false;
            return false;
        }
    });
    return res;
}