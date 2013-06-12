var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
    defaults: {
        shot: false,
        canUse: true
    }
})
