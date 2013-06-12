var Backbone = require('backbone'),
    _ = require('lodash');

var _dirs = [{ row: -1, col: 0}, { row: 0, col: 1}, { row: 1, col: 0}, { row: 0, col: -1}];

module.exports = Backbone.Model.extend({
    initialize: function(options) {
        this.field = options.field;
    },

    placeShips: function(ships) {
        var that = this;

        var nextPlace = function(ship) {
            var cell = that._randomCell();
            return that.field.placeForShip(cell.row, cell.col, ship.get('dir'), ship.get('length'));
        }

        while(ships.length !== 0) {
            var ship = ships.at(0);

            var dir = _.random(0, 3);
            ship.set('dir', dir);
            var idx = nextPlace(ship);
            while(!this.field.canPlaceShip(idx)) {
                idx = nextPlace(ship);
            }
            console.log('place ship at', idx);

            ship.set('idx', idx);
            this.field.ships.add(ship);
            ships.remove(ship);
        }
    },

    _randomCell: function() {
        return { row: _.random(0, this.field.size), col : _.random(0, this.field.size)};
    },

    _tryShotAt: function(field, el) {
        if(field.canShot(el.get('row'), el.get('col'))) {
            return field.makeShot(el.get('row'), el.get('col'));
        }
        return false;
    },

    makeShot: function(field) {
        var isFinalShot = function(shotResult) {
            return shotResult && !_.isBoolean(shotResult);
        }

        if(this.prevGoodShot) {
            var rowForShot = this.prevGoodShot.row + _dirs[this.newDirForPrevGoodShot].row,
                colForShot = this.prevGoodShot.col + _dirs[this.newDirForPrevGoodShot].col;

            if(field.canShot(rowForShot, colForShot)) {
                var shotResult = field.makeShot(rowForShot, colForShot);

                if(shotResult) {
                    if(isFinalShot(shotResult)) {
                        delete this.prevGoodShot;
                        delete this.newDirForPrevGoodShot;
                        delete this.beginShooting;
                        delete this.secondGoodShot;

                    } else {
                        this.prevGoodShot = { row: rowForShot, col: colForShot };
                        this.secondGoodShot = true;
                    }
                } else {
                    this.newDirForPrevGoodShot = (this.newDirForPrevGoodShot + (this.secondGoodShot ? 2 : 1)) % 4;

                    if(this.secondGoodShot) {
                        this.prevGoodShot = this.beginShooting;
                    }
                }
                return shotResult;
            } else {
                this.newDirForPrevGoodShot = (this.newDirForPrevGoodShot + (this.secondGoodShot ? 2 : 1)) % 4;

                if(this.secondGoodShot) {
                    this.prevGoodShot = this.beginShooting;
                }

                return true;
            }
        } else {
            var res = false;
            var freeIdx = _.random(0, field.safe), i = 0;
            field.each(function(el) {
                if(field.canShot(el.get('row'), el.get('col'))) {
                    if(i === freeIdx) {
                        var shotResult = field.makeShot(el.get('row'), el.get('col'));

                        if(shotResult && !isFinalShot(shotResult)) {
                            this.newDirForPrevGoodShot = 0;
                            this.prevGoodShot = this.beginShooting = { row: el.get('row'), col: el.get('col') };
                        }
                        res = shotResult;
                        return false;
                    }
                    i++;
                }
            }, this);
            return res;
        }

    }
});
