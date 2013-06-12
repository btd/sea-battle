var Backbone = require('backbone'),
    shipTemplate = require('template/ship'),
    _ = require('lodash');

module.exports = Backbone.View.extend({
    events: {
        'click .ship': 'selectShipToPlace',
        'click .place-random': 'placeShipsRandom'
    },

    shipTemplate: _.template(shipTemplate),

    placeShipsRandom: function() {
        this.trigger('ship:random_place');
    },

    selectShipToPlace: function(evt) {
        var $target = $(evt.currentTarget);
        if($target.hasClass('selected')) {
            $target.removeClass('selected');
            this.trigger('ship:unselect');
        } else {
            this.$('.ship').removeClass('selected');
            $target.addClass('selected');

            var ship = this.ships.get($target.data('id'));
            this.trigger('ship:select', ship);
        }
    },

    initialize: function(options) {
        this.ships = options.ships;
        this.listenTo(this.ships, 'remove', function(model) {
            this.$('.ship[data-id="' + model.cid + '"]').remove();
        });
        this.render();
    },

    render: function() {
        this.ships.each(function(ship) {
            this.$el.append(this.shipTemplate({
                ship: ship
            }));
        }, this);
    }
});
