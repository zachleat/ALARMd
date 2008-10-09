/* Loads the Google data JavaScript client library */
google.load("gdata", "1");

function init() {
  // init the Google data JS client library with an error handler
  google.gdata.client.init(handleGDError);
  // load the code.google.com developer calendar
}

/**
 * Determines the full calendarUrl based upon the calendarAddress
 * argument and calls loadCalendar with the calendarUrl value.
 *
 * @param {string} calendarAddress is the email-style address for the calendar
 */ 
function loadCalendarByAddress(calendarAddress) {
  var calendarUrl = 'http://www.google.com/calendar/feeds/' +
                    calendarAddress + 
                    '/public/full';
  loadCalendar(calendarUrl);
}

/**
 * Uses Google data JS client library to retrieve a calendar feed from the specified
 * URL.  The feed is controlled by several query parameters and a callback 
 * function is called to process the feed results.
 *
 * @param {string} calendarUrl is the URL for a public calendar feed
 */  
function loadCalendar(calendarUrl) {
  var service = new 
      google.gdata.calendar.CalendarService('alarmd-get-alarm-feed');
  var query = new google.gdata.calendar.CalendarEventQuery(calendarUrl);
  query.setOrderBy('starttime');
  query.setSortOrder('ascending');
  query.setFutureEvents(true);
  query.setSingleEvents(true);
  //var now = new Date;
  //query.setStartMax(util.date.parseObjToIso8601(now.setTime(now.getTime() + 1000*60*60*24*7))); // 1 week out
  query.setMaxResults(15);

  service.getEventsFeed(query, listEvents, function(e){
	alarmd.eraseUrl();
	handleGDError(e);
  });
}

/**
 * Callback function for the Google data JS client library to call when an error
 * occurs during the retrieval of the feed.  Details available depend partly
 * on the web browser, but this shows a few basic examples. In the case of
 * a privileged environment using ClientLogin authentication, there may also
 * be an e.type attribute in some cases.
 *
 * @param {Error} e is an instance of an Error 
 */
function handleGDError(e) {
  var msg;
  if (e instanceof Error) {
    /* alert with the error line number, file and message */
    msg = e.message;

    /* if available, output HTTP error code and status text */
    if (e.cause) {
      var status = e.cause.status;
      var statusText = e.cause.statusText;
      msg += ' (HTTP error ' + status + ': ' + statusText + ')';
    }
  } else {
	msg = e.toString();
  }
  util.dom.update('#error-message', 'Google GDATA Error: ' + msg);
}

/**
 * Callback function for the Google data JS client library to call with a feed 
 * of events retrieved.
 *
 * Creates an unordered list of events in a human-readable form.  This list of
 * events is added into a div called 'events'.  The title for the calendar is
 * placed in a div called 'calendarTitle'
 *
 * @param {json} feedRoot is the root of the feed, containing all entries 
 */ 
function listEvents(feedRoot) {
  var entries = feedRoot.feed.getEntries();
  jQuery('#serverZone').html(feedRoot.feed.getTimeZone().getValue());
  /* create a new unordered list */
  alarmd.setTitle(feedRoot.feed.title.$t);

  var firstNextDay;
  /* loop through each event in the feed */
  var len = entries.length;
  for (var i = 0; i < len; i++) {
    var entry = entries[i],
        title = entry.getTitle().getText(),
        label = title,
        date,
        jsDate,
        times = entry.getTimes();

    if (times.length > 0) {
        jsDate = times[0].getStartTime();
        if(!jsDate.isDateOnly()) {
            date = jsDate.getDate();

            if (entry.getHtmlLink() != null) {
                label = '<a href="' + entry.getHtmlLink().getHref() + '">' + title + '</a>';
            }
            //var target = entry.getContent().getText();
            alarmd.addAlarmDate(date, label);
        }
    }
  }
  sources.gcal.callback();
}

google.setOnLoadCallback(init);