var Ship = require('model/ship'),
    Backbone = require('backbone');

module.exports = Backbone.Collection.extend({
    model: Ship
});