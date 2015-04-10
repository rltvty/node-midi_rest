var midi = require('midi');
var help = require('midi-help');
var request = require('request');

var root_mixer_control_url = 'http://10.10.10.115:3030/mixer/';

// Set up a new output.
var input = new midi.input();
var parser = new help.MidiParser();

for (var port_index = 0; port_index < input.getPortCount(); port_index+= 1) {
  console.log('Port #: '  + port_index + ' Name: ' + input.getPortName(port_index));
}

input.on('message', function(deltaTime, message) {
  parser.parseArray(message);
});

console.log('Opening port:', input.getPortName(0));
input.openPort(0);

parser.on('noteOn', function(note, velocity, channel){
  console.log('noteOn:', note, velocity, channel);
});

parser.on('noteOff', function(note, velocity, channel){
  console.log('noteOff:', note, velocity, channel);
});

parser.on('cc', function(controller, level, channel){
  console.log('channel: ' + channel + '\tcontroller: ' + controller + '\tlevel: ' + level);
  switch (controller) {
    case 1: request.post(root_mixer_control_url + 'input/1').form({level:level}); break;
    case 2: request.post(root_mixer_control_url + 'input/2').form({level:level}); break;
    case 3: request.post(root_mixer_control_url + 'input/3').form({level:level}); break;
    case 7: request.post(root_mixer_control_url + 'output/1').form({level:level}); break;
    case 8: request.post(root_mixer_control_url + 'output/2').form({level:level}); break;
  }
});

module.exports.closePort = input.closePort;
