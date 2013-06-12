var Backbone = require('backbone');

module.exports = Backbone.View.extend({
    setStatus: function(text) {
        this.$el.html(text);
    }
});