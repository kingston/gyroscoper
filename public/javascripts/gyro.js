var gyroData = [];
var accelData = [];
var isLoaded = false;

// why not be accurate ;p
var KG_TO_LBS = 2.20462;
var FT_TO_IN = 12;
var IN_TO_CM = 2.54;

var currentUnit;

/* Unit Switching */
$(function() {
  var unitLabels = {
    imperial: {
      weight: "lbs",
      height_big: "ft",
      height_small: "in",
      height_big_long: "feet",
      height_small_long: "inches"
    },
    metric: {
      weight: "kg",
      height_big: "m",
      height_small: "cm",
      height_big_long: "meters",
      height_small_long: "centimeters"
    }
  };
  var switchActive = function(oldElem, newElem, units) {
    $("#" + oldElem).removeClass("active-unit");
    $("#" + newElem).addClass("active-unit");
    $("#weight-units").text(units.weight);
    $("#height-big-units").text(units.height_big);
    $("#height-small-units").text(units.height_small);
    $("#form-height-big").attr('placeholder', '(' + units.height_big_long + ')');
    $("#form-height-small").attr('placeholder', '(' + units.height_small_long + ')');
  };
  $("#imperial-units").click(function() {
    switchActive("metric-units", "imperial-units", unitLabels.imperial);
    currentUnit = "imperial";
    return false;
  });
  $("#metric-units").click(function() {
    switchActive("imperial-units", "metric-units", unitLabels.metric);
    currentUnit = "metric";
    return false;
  });
  // default to imperial
  currentUnit = "imperial";
  switchActive("metric-units", "imperial-units", unitLabels.imperial);
});

$(function() {
  if (settings.mobileAgentOnly) {
    var isMobile = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/);
    if (!isMobile) {
      showStatus("Please use a mobile device like an iPhone or iPod to use Gyroscoper.", "danger");
      return;
    }
  }
  if (!window.DeviceOrientationEvent) {
    return;
  }
  $("#start-record").click(startRecording);
  $("#stop-record").click(stopRecording);
  if (window.DeviceOrientationEvent) {
    window.addEventListener("deviceorientation", function () {
      tilt(event.alpha, event.beta, event.gamma);
    }, true);
  }
  if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', function () {
      accel(event.acceleration);
    }, true);
  }
  showStatus("Loading...", "info");
  setTimeout(function() {
    if (!isLoaded) {
      showStatus("Sorry, your device does not support accelerometer recording.", "danger");
    }
  }, 1000);
});

function hideStatus() {
  $("#status").hide();
}

function showStatus(message, type) {
  $("#status")
    .html(message)
    .removeClass("alert-success alert-info alert-warning alert-danger")
    .addClass("alert-" + type)
    .show();
}

function recordTimestamp() {
  return new Date() - recordStart;
}

function tilt(alpha, beta, gamma) {
  if (recording) {
    gyroData.push({
      time: recordTimestamp(),
      alpha: alpha,
      beta: beta,
      gamma: gamma
    });
  }
}

function accel(acc) {
  // check we get all axis
  if (recording) {
    accelData.push({
      time: recordTimestamp(),
      x: acc.x,
      y: acc.y,
      z: acc.z
    });
  }
  if (!isLoaded) {
    if (settings.requireAllAxis && (acc.x === null || acc.y === null || acc.z === null)) {
      showStatus("Sorry, your device does not support full accelerometer recording.", "danger");
    } else {
      $("#start-record").attr("disabled", null);
      hideStatus();
    }
    isLoaded = true;
  }
}

var recording = false;
var recordDuration = 0;
var recordStart = null;
var recordInterval = null;
var gyroGraphData = null;
var age = null;
var weight = null;
var height = null;
var gender = null;

function updateRecordingStatus() {
  recordDuration += 1;

  $("#record-duration").text(recordDuration + "s");
}

function startRecording() {
  var getValidValue = function(elemId, min, max) {
    var num = parseInt($("#" + elemId).val(), 10);
    return (!isNaN(num) && min <= num && num <= max) ? num : null;
  };

  // check inputs
 
  // I'll assume these are valid constraints...
  age = getValidValue("form-age", 3, 120);

  if (age === null) {
    showStatus("Please enter a valid age.", "info");
    return;
  }

  weight = getValidValue("form-weight", 10, 500);
  if (weight === null) {
    showStatus("Please enter a valid weight.", "info");
    return;
  }

  // convert weight if needs be
  if (currentUnit == "imperial") {
    weight = weight / KG_TO_LBS;
  }

  var height_big = getValidValue("form-height-big", 0, 10);
  var height_small = getValidValue("form-height-small", 0, 99);
  if (height_big === null || height_small === null) {
    showStatus("Please enter a valid height.", "info");
    return;
  }

  // convert weight to metric if needs be
  if (currentUnit == "imperial") {
    height = height_big * FT_TO_IN + height_small;
    height = height * IN_TO_CM;
  } else {
    height = height_big * 100 + height_small;
  }

  if (!$("#form-male").is(":checked") && !$("#form-female").is(":checked")) {
    showStatus("Please enter a gender.", "info");
    return;
  }

  gender = $("#form-male").is(":checked") ? "male" : "female";

  $(".form-userdata").hide();
  hideStatus();
  $("#record-status").show();
  recordInterval = setInterval(updateRecordingStatus, 1000);
  recordStart = new Date();
  recording = true;
  accelData = [];
  gyroData = [];
  $("#record-duration").text(recordDuration + "s");
}

function stopRecording() {
  clearInterval(recordInterval);
  recordInterval = null;
  recording = false;

  var screenHeight = 0;
  if (window.screen && window.screen.height) {
    screenHeight = window.screen.height;
  }

  $(".form-userdata").show();
  $("#record-status").hide();

  if (recordDuration < 15) {
    showStatus("Please record at least 15 seconds of walking", "danger");
    recordDuration = 0;
    return;
  }
  recordDuration = 0;
  var data = {
    age: age,
    weight: weight,
    height: height,
    gender: gender,
    accel: accelData,
    gyro: gyroData,
    screenHeight: screenHeight
  };
  
  $.ajax({
    type: "POST",
    url: "/post",
    data: JSON.stringify(data),
    dataType: "json",
    contentType: 'application/json'
  }).done(function(data) {
    if (data.success) {
      showStatus("Successfully uploaded data!", "success");
    } else {
      showStatus("Error uploading data: " + data.message + "!", "danger");
    }
  }).fail(function(jqXHR, textStatus) {
    showStatus("Error uploading data! Please try again.", "danger");
  });
  showStatus("Uploading data...", "info");
}
