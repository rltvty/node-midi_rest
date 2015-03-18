var base = require('rest_base');
var mixer_control = require('./lib/mixer_control');


mixer_control.assign_routes(base.app);

base.start_server();