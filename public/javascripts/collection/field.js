var Backbone = require('backbone'),
    Cell = require('model/cell'),
    _ = require('lodash'),
    Ships = require('collection/ship');



var around = [{r: -1, c: -1}, {r: -1, c: 0}, {r: -1, c: 1},{r: 0, c: -1}, {r: 0, c: 1},{r: 1, c: -1}, {r: 1, c: 0}, {r: 1, c: 1}];

module.exports = Field = Backbone.Collection.extend({
    model: Cell,

    initialize: function(options) {
        this.ships = new Ships();

        this.ships.on('add', function(model) {
            this.placeShip(model);
        }, this);

        this.on('change:shot', function() {
            this.safe -= 1;
        }, this);
    },

    cellAt: function(row, col) {
        if(row >= 0 && col >= 0 && row < this.size && col < this.size) {
            return this.at(row * this.size + col);
        }
    },

    placeShip: function(ship) {
        _.each(ship.get('idx'), function(i) {
            this._placeShipPartAtCell(i.r, i.c, ship.cid);
        }, this);
    },

    _placeShipPartAtCell: function(r, c, shipId) {
        this.cellAt(r, c).set('ship', shipId);
        for(var row = -1; row < 2; row++) {
            for(var col = -1; col < 2; col++) {
                var _cell = this.cellAt(r + row, c + col);
                if(_cell) {
                    _cell.set('canUse', false);
                }
            }
        }
    },

    canPlaceShip: function(idx) {
        var res = true;
        _.each(idx, function(i) {
            if(i.r < 0 || i.r >= this.size || i.c < 0 || i.c >= this.size) {
                res = false;
                return false;
            }
            var cell = this.cellAt(i.r, i.c);
            if(!cell.get('canUse')) {
                res = false;
                return false;
            }
        }, this);
        return res;
    },

    canShot: function(row, col) {
        if(row >= 0 && col >= 0 && row < this.size && col < this.size) {
            return !this.cellAt(row, col).get('shot');
        }
    },

    _ver: function(dir) {
        return dir === 0 ? 1 : dir === 2 ? -1: 0 ;
    },

    _hor: function(dir) {
        return dir === 1 ? -1 : dir === 3 ? 1: 0 ;
    },

    placeForShip: function(row, col, dir, length) {
        var idx = [];
        for(var l = length, s = 0; l !== 0; l--, s = s >= 0 ? -(s + 1) : -s) {
            idx.push({ r: row + this._ver(dir) * s, c: col + this._hor(dir) * s});
        }
        idx.sort(function(a, b) {
            return a.r === b.r ? a.c - b.c : a.c === b.c ? a.r - b.r : 0;
        });
        return idx;
    },

    makeShot: function(row, col) {
        var cell = this.cellAt(row, col);

        var shipId = cell.get('ship');
        var res = false;

        if(shipId) {
            var ship = this.ships.get(shipId);
            ship.safe -= 1;

            if(ship.safe === 0) {
                var idx = ship.get('idx');
                _.each(idx, function(el) {
                    _.each(around, function(offset) {
                        var _cell = this.cellAt(el.r + offset.r, el.c + offset.c);
                        if(_cell && !_cell.get('ship')) {
                            _cell.set('shot', true);
                        }
                    }, this);

                }, this);
                res = ship;
            } else {
                res = true;
            }
        }
        cell.set('shot', true);
        return res;
    }

}, {
    ofSize: function(len) {
        var f = new Field();
        f.size = len;
        f.safe = len * len;

        for(var i = 0; i < len; i++)
            for(var j = 0; j < len; j++)
                f.push({row: i, col: j});
        return f;
    }
});
