var base = require('rest_base');
var mixer_control = require('./lib/mixer_control');
var b_control = require('./lib/b_control');

//mixer_control.assign_routes(base.app);


base.start_server();

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));


function exitHandler(options, err) {
  mixer_control.closePort();
  b_control.closePort();
  if (options.cleanup) console.log('clean');
  if (err) console.log(err.stack);
  if (options.exit) process.exit();
}
