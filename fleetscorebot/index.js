#!/usr/bin/env node
const _ = require("lodash");
const capitano = require("capitano");
const semver = require("resin-semver");
const moment = require("moment");
const config = require("config");
const jsonfile = require("jsonfile");
const fs = require("fs");
const util = require("util");

const env = require("get-env")({
  staging: "staging",
  production: "production",
  devenv: "devenv"
});

const time_now = moment().format("YYYYMMDD_HHmmss");
const log_file = fs.createWriteStream(
  `logs/fleetscore_${env}_${time_now}.txt`,
  { flags: "a" }
);
const log_stdout = process.stdout;

console.log = function(d) {
  //
  log_file.write(util.format(d) + "\n");
  log_stdout.write(util.format(d) + "\n");
};

const authToken = config.get("authToken");
const resin = require("resin-sdk")({
  apiUrl: config.get("apiEndpoint")
});

var help = function() {
  console.log("Fleet Score Util\n");
  _.forEach(capitano.state.commands, function(command) {
    if (!command.isWildcard()) {
      console.log(`\t${command.signature}\t\t\t${command.description}`);
    }
  });
};

const getAllRetry = async n => {
  for (let i = 0; i < n; i++) {
    try {
      return await resin.models.device.getAll();
    } catch (err) {
      const isLastAttempt = i + 1 === n;
      if (isLastAttempt) throw err;
    }
  }
};

var getVersion = function(device) {
  var version = {};
  if (device.os_version) {
    var parsed_semver = semver.parse(device.os_version);
    version.os = parsed_semver ? parsed_semver.version : "Unknown";
  } else {
    version.os = "1.0.0-pre";
  }
  version.supervisor = device.supervisor_version;
  version.combined = `${version.os}%${version.supervisor}`;
  return version.combined;
};

var replaceToken = async function() {
  const file = `./config/${env}.json`;
  resin.request
    .send({
      url: `/user/v1/refresh-token`,
      baseUrl: config.get("apiEndpoint")
    })
    .then(function(response) {
      if (response.status === 200) {
        var obj = {
          apiEndpoint: config.get("apiEndpoint"),
          authToken: response.body
        };
        jsonfile.writeFile(file, obj, function(err) {
          if (err) {
            console.error(err);
          }
        });
      }
    });
};

var getDevices = async function() {
  await resin.auth.loginWithToken(authToken);
  replaceToken();

  var devices = await getAllRetry(5);
  var before = moment()
    .subtract(28, "days")
    .startOf("day");

  filtered_devices = _.filter(devices, function(o) {
    return (
      (moment(o.last_connectivity_event) >= before || o.is_online) &&
      o.supervisor_version !== null
    );
  });
  var fleet = _.countBy(filtered_devices, getVersion);
  var fleet_list = [];
  _.forEach(fleet, function(value, key) {
    var vers = key.split("%");
    var combo = { os: vers[0], supervisor: vers[1], count: value };
    fleet_list.push(combo);
  });
  var fleet_sorted_list = fleet_list
    .sort(function(a, b) {
      if (a.os === b.os) {
        return semver.compare(a.supervisor, b.supervisor);
      } else {
        return semver.compare(a.os, b.os);
      }
    })
    .reverse();
  _.forEach(fleet_sorted_list, function(o) {
    console.log(`${o.os}\t${o.supervisor}\t${o.count}`);
  });
};

capitano.command({
  signature: "get",
  description: "A test command",
  action: getDevices
});

capitano.command({
  signature: "help",
  description: "Print this help",
  action: help
});

capitano.command({
  signature: "*",
  action: help
});

capitano.run(process.argv, function(error) {
  if (error) {
    throw error;
  }
});
