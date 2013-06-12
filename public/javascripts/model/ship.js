var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
    defaults: {
        dir: 0
    },

    initialize: function(options) {
        this.safe = options.length;
    }
});
