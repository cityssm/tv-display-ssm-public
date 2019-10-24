/* global window, tvDisplay, axios */

tvDisplay.tvContent = (function() {
  "use strict";

  let windowIntervalFn = null;

  let scheduleJSON = {};

  const timeEle = tvDisplay.contentContainer.getElementsByClassName("clock-time")[0];
  const departureEle = tvDisplay.contentContainer.getElementsByClassName("clock-departure")[0];


  function padNumber(num) {
    return ("0" + num.toString()).slice(-2);
  }


  function getScheduleArray(dateObj) {

    // try date

    const dateKey = dateObj.getFullYear() + "/" +
      padNumber(scheduleJSON.januaryIsOne ? dateObj.getMonth() + 1 : dateObj.getMonth()) + "/" +
      padNumber(dateObj.getDate());

    if (scheduleJSON.hasOwnProperty("schedule_date") && scheduleJSON.schedule_date.hasOwnProperty(dateKey)) {
      const scheduleName = scheduleJSON.schedule_date[dateKey];
      return scheduleJSON.schedules[scheduleName];
    }

    // try day of week

    const dayOfWeekKey = dateObj.getDay().toString();

    if (scheduleJSON.hasOwnProperty("schedule_day") && scheduleJSON.schedule_day.hasOwnProperty(dayOfWeekKey)) {
      const scheduleName = scheduleJSON.schedule_day[dayOfWeekKey];
      return scheduleJSON.schedules[scheduleName];
    }

    // use default

    const scheduleName = scheduleJSON.schedule_default;

    if (scheduleName) {
      return scheduleJSON.schedules[scheduleName];
    }

    return [];
  }


  function getNextDepartureDateObj(scheduleArray, dateObj) {

    const timeString = padNumber(dateObj.getHours()) + ":" + padNumber(dateObj.getMinutes());

    for (let scheduleIndex = 0, scheduleLength = scheduleArray.length; scheduleIndex < scheduleLength; scheduleIndex += 1) {

      const scheduleTimeString = ("0" + scheduleArray[scheduleIndex]).slice(-5);

      if (scheduleTimeString >= timeString) {

        const scheduleTimeStringSplit = scheduleTimeString.split(":");

        let nextDepartureDate = new Date(dateObj.getTime());
        nextDepartureDate.setHours(parseInt(scheduleTimeStringSplit[0]));
        nextDepartureDate.setMinutes(parseInt(scheduleTimeStringSplit[1]));

        return nextDepartureDate;
      }
    }

    return null;
  }


  function updateDisplay() {

    let currentTime = new Date();


    /*
     * clock
     */


    let tod = "AM";
    let hr = currentTime.getHours();

    if (hr >= 12) {
      tod = "PM";
      if (hr > 12) {
        hr -= 12;
      }
    } else if (hr === 0) {
      hr = 12;
    }

    timeEle.innerHTML = hr + ":" + padNumber(currentTime.getMinutes()) + " " + tod;


    /*
     * departure
     */


    let nextDepartureTime = null;
    const scheduleWindowMinutes = scheduleJSON.hasOwnProperty("scheduleWindowMinutes") ? scheduleJSON.scheduleWindowMinutes : 0;

    const currentTimeLessWindow = new Date(currentTime.getTime() - (scheduleWindowMinutes * 60000));

    let scheduleArray = getScheduleArray(currentTimeLessWindow);

    if (scheduleArray && scheduleArray.length > 0) {
      nextDepartureTime = getNextDepartureDateObj(scheduleArray, currentTimeLessWindow);
    }

    if (nextDepartureTime === null) {

      let tomorrow = new Date(currentTimeLessWindow.getTime());
      tomorrow.setHours(0);
      tomorrow.setMinutes(0);
      tomorrow.setSeconds(0);
      tomorrow.setDate(tomorrow.getDate() + 1);

      scheduleArray = getScheduleArray(tomorrow);

      if (scheduleArray && scheduleArray.length > 0) {
        nextDepartureTime = getNextDepartureDateObj(scheduleArray, tomorrow);
      }
    }

    if (nextDepartureTime === null) {
      departureEle.innerText = "unavailable";
    } else {

      const waitMinutes = Math.floor((nextDepartureTime.getTime() - currentTime.getTime()) / 60000);

      if (waitMinutes <= 0) {
        departureEle.innerText = "right now";
      }
      else if (waitMinutes <= scheduleWindowMinutes) {
        departureEle.innerText = "preparing to depart";

      } else if (waitMinutes >= 60) {
        departureEle.innerText = "in over an hour";

      } else {
        departureEle.innerHTML = "in " + waitMinutes + " minute" + (waitMinutes === 1 ? "" : "s");
      }
    }
  }


  return {
    init: function(contentJSON) {

      const remoteURL = tvDisplay.getContentProperty(contentJSON, "remoteURL") || "";

      axios.get(remoteURL + "content/clock-transit/schedule.json", {
          responseType: "json",
          params: {
            _: Math.floor(Date.now() / (3600 * 1000))
          }
        })
        .then(function(response) {
          return response.data;
        })
        .then(function(responseJSON) {
          scheduleJSON = responseJSON;

          updateDisplay();
          windowIntervalFn = window.setInterval(updateDisplay, 10 * 1000);
        })
        .catch(function() {
          try {
            window.console.error("clock-transit: Unable to load schedule.json");
          } catch (e) {
            // ignore
          }

          tvDisplay.next();
        });
    },
    destroy: function() {
      try {
        window.clearInterval(windowIntervalFn);
      } catch (e) {
        // ignore
      }
    }
  };
}());
