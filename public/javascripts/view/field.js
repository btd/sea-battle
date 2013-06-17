var Backbone = require('backbone'),
    _ = require('lodash'),
    fieldTemplate = require('template/field');

module.exports = Backbone.View.extend({
    eventsPrepare: {
        'hover .cell': 'selectPlaceForShip',
        'click .cell': 'placeShip'
    },

    eventsBattle: {
        'click .cell': 'makeShot'
    },

    template: _.template(fieldTemplate),

    rotateKeyCode: 82,// r

    letters: 'АБВГДЕЖЗИКЛМНОПРСТ'.split(''),

    dirs: ['top', 'right', 'bottom', 'left'],

    errorShip: {
        start: 'start',
        end: 'end',
        all: 'error highlight',
        dir: ''
    },

    goodShip: {
        start: 'start',
        end: 'end',
        all: 'highlight',
        dir: ''
    },

    finalShip: {
        start: 'ship-start',
        end: 'ship-end',
        all: 'ship-part',
        dir: 'ship-'
    },

    brokenShip: {
        start: 'ship-start',
        end: 'ship-end',
        all: 'ship-part broken',
        dir: 'ship-'
    },

    initialize: function(options) {
        this.field = options.field;
        this.notPlacedShips = options.ships;

        this.listenTo(this.field.ships, 'add', function(model) {
            if(!options.hidden) {
                this.drawShipAt(model.get('idx'), model.get('dir'), this.finalShip);
            }
        });

        this.listenTo(this.field, 'change:shot', function(cell) {
            this.drawShot(cell)
        });

        this.render();
    },

    render: function() {
        this.$el.append(this.template({
            size: this.field.size,
            letters: this.letters
        }));

        this.cells = this.$('.cell');

        return this;
    },

    setSelectedShip: function(ship) {

        if(ship) {
            this.selectedShip = ship;
            this.delegateEvents(this.eventsPrepare);

            var that = this;

            $(document).on('keydown.waitToRotate', function(evt) {
                that.tryToRotateSelectedShip(evt);
            });
        } else {
            this.selectedShip = void(0);
            this.lastSelected = void(0);
            this.undelegateEvents();
            $(document).off('keydown.waitToRotate');
        }
    },

    placeShip: function(evt) {
        var $target = $(evt.currentTarget);
        var row = $target.data('row'), col = $target.data('col');

        var idx = this.field.placeForShip(row, col, this.selectedShip.get('dir'), this.selectedShip.get('length'));
        if(this.field.canPlaceShip(idx)) {
            this.selectedShip.set('idx', idx);
            this.notPlacedShips.remove(this.selectedShip);
            this.field.ships.add(this.selectedShip);

            this.setSelectedShip();
        } else {
            this.drawShipAt(idx, this.selectedShip.get('dir'), this.errorShip);
        }
    },

    selectPlaceForShip: function(evt) {
        var $target = $(evt.currentTarget);
        var row = $target.data('row'), col = $target.data('col');

        this.lastSelected = { row: row, col: col };
        this.drawPossiblePlace(row, col);
    },

    drawPossiblePlace: function(row, col) {
        var idx = this.field.placeForShip(row, col, this.selectedShip.get('dir'), this.selectedShip.get('length'));
        if(this.field.canPlaceShip(idx)) {
            this.drawShipAt(idx, this.selectedShip.get('dir'), this.goodShip);
        } else {
            this.drawShipAt(idx, this.selectedShip.get('dir'), this.errorShip);
        }
    },

    drawShipAt: function(idx, dir, classes) {
        this.cleanField();

        var dirClass = classes.dir + this.dirs[dir];

        _.each(idx, function(el, i) {
            if(el.r >= 0 && el.r < this.field.size && el.c >= 0 && el.c < this.field.size) {
                var cell = this._cell(el.r, el.c);
                if(cell) {
                    cell.addClass(classes.all + ' ' + dirClass);

                    if(i === 0) cell.addClass(classes.start);
                    if(i === idx.length - 1) cell.addClass(classes.end);
                }
            }
        }, this);
    },

    cleanField: function() {
        this.cells.removeClass('highlight error start end right top bottom left');
    },

    _cell: function(row, col) {
        var cell = this.cells[row * this.field.size + col];
        return cell && $(cell);
    },

    tryToRotateSelectedShip: function(evt) {
        if(evt.keyCode == this.rotateKeyCode) {
            this.selectedShip.set('dir', (this.selectedShip.get('dir') + 1) % 4);
            if(this.lastSelected) {
                this.drawPossiblePlace(this.lastSelected.row, this.lastSelected.col);
            }
        }
    },

    prepareToBattle: function() {
        this.setSelectedShip();

        this.delegateEvents(this.eventsBattle);
    },

    drawShot: function(cell) {
        this.cells.removeClass('last');

        var cls = ['shot', 'last'];
        if(cell.get('ship')) cls.push('ship-part');
        this._cell(cell.get('row'), cell.get('col')).addClass(cls.join(' '));
    },

    makeShot: function(evt) {
        this.undelegateEvents();

        var $target = $(evt.currentTarget);
        var row = $target.data('row'), col = $target.data('col');


        if(this.field.canShot(row, col)) {
            var shotResult = this.field.makeShot(row, col);
            if(shotResult) {
                if(!_.isBoolean(shotResult)) {
                    this.drawShipAt(shotResult.get('idx'), shotResult.get('dir'), this.brokenShip);
                    this.trigger('shot:final');
                }
                this.delegateEvents(this.eventsBattle);
            } else {
                this.trigger('shot:out');
            }
        } else {
            this.delegateEvents(this.eventsBattle);
        }


    },

    waitTurn: function() {
        this.undelegateEvents();
    }
});
