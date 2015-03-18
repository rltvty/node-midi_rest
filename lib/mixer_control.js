var config = require('../mixer_config.json');

var settings = null;

module.exports.assign_routes = function(app) {
  var url;
  if (settings == null) {
    settings = {};
  } else {
    return;
  }

  for (var input = 1; input <= config.input.count; input++) {
    url = '/mixer/input/' + input;
    appendOutput(app, url, 'level', 0);
    appendEqs(app, url, config.input.eq_bands);
    appendAddProcs(app, url, config.input.additional_processors);
    for (var send = 1; send <= config.output.count; send++) {
      appendOutput(app, url + '/send/' + send, 'level', 127);
    }
  }
  for (var output = 1; output <= config.output.count; output++) {
    url = '/mixer/output/' + output;
    appendOutput(app, url, 'level', 0);
    appendEqs(app, url, config.output.eq_bands);
    appendAddProcs(app, url, config.output.additional_processors);
  }

  console.log('Created the following routes: ');
  for (var url in settings) {
    console.log('\tGET/POST: ' + url);
  }
};

function get_info(req, res) {
  if (req.path in settings) {
    res.json(settings[req.path]);
  } else {
    res.status(500).json({ error: 'can not find ' + req.path + ' in settings cache' });
  }
}

function post_info(req, res) {
  if (req.path in settings) {
    var current = settings[req.path];
    if (current.type in req.body) {
      var newValue = req.body[current.type];
      switch (current.type) {
        case 'level':
          if (typeof newValue == 'number') {
            newValue = Math.max(0, Math.min(127, parseInt(newValue)));
          } else {
            res.status(500).json({ error: 'level value in posted data must be an integer 0->127' });
            return;
          }
          break;
        case 'switch':
          if (typeof newValue != 'boolean') {
            res.status(500).json({ error: 'switch value in posted data must be a boolean' });
            return;
          }
          break;
        default :
          res.status(500).json({ error: 'unknown value type in posted data' });
          return;
      }
      current.oldValue = current.value;
      current.value = newValue;
      settings[req.path].value = newValue; //this might be a dup, if current is just a ref and not a copy
      //TODO: actually send the midi command to update this stuff
      res.status(201).json(current);

    } else {
      res.status(500).json({ error: 'can not find ' + current.type + ' value in posted data' });
    }
  } else {
    res.status(500).json({ error: 'can not find ' + req.path + ' in settings cache' });
  }
}


var channel = 1;
var controller = 0;

function appendOutput(app, url, type, defaultValue) {
  app.get(url, get_info);
  app.post(url, post_info);

  settings[url] = {
    channel : channel,
    controller: controller,
    type: type,
    value: defaultValue
  };
  controller += 1;

  if (controller == 120) {
    controller = 0;
    channel += 1;
  }
  if (channel == 17) {
    throw new Error('Uh Oh, out of midi channels.')
  }
}

function appendEqs(app, url, eq_bands) {
  for (var eq_band_index in eq_bands) {
    var eq_band = eq_bands[eq_band_index];
    appendOutput(app, url + '/eq/' + eq_band, 'level', 63);
  }
}

function appendAddProcs(app, url, addProcs) {
  for (var proc in addProcs) {
    for (var knob in addProcs[proc]) {
      var knobInfo = addProcs[proc][knob];
      appendOutput(app, url + '/' + proc + '/' + knob, knobInfo.type, knobInfo.default);
    }
  }
}
