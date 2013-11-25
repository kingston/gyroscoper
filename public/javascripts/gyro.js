var gyroData = [];
var accelData = [];
var gyroscoperEnabled = false;

$(function() {
  if (!window.DeviceOrientationEvent &&  !window.DeviceMotionEvent) {
    showStatus("Sorry, your device does not support accelerometer recording.", "danger");
    $("#record-button").attr("disabled", "disabled");
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
});

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
  if (recording) {
    accelData.push({
      time: recordTimestamp(),
      x: acc.x,
      y: acc.y,
      z: acc.z
    });
  }
}

var recording = false;
var recordDuration = 0;
var recordStart = null;
var recordInterval = null;
var gyroGraphData = null;

function updateRecordingStatus() {
  recordDuration += 1;

  $("#record-duration").text(recordDuration + "s");
}

function startRecording() {
  $(".form-userdata").hide();
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
  recordDuration = 0;

  var data = {
    name: $("#form-name").val(),
    accel: accelData,
    gyro: gyroData
  }
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
      showStatus("Error uploading data! Please try again.", "danger");
    }
  }).fail(function(jqXHR, textStatus) {
    showStatus("Error uploading data! Please try again.", "danger");
  });

  $(".form-userdata").show();
  $("#record-status").hide();
  showStatus("Uploading data...", "info");
}
