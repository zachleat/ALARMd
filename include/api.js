var youtube = (function()
{
	var cachedUrl 			= null,
		player,
		loaded				= false,
		cuedVideos			= [],
		totalVideoBytes,
		loadingFinished		= false;

	function getIdFromUrl(url)
	{
		var parsed = util.getRegex(/youtube\.com\/v\/([^\/]+)/g, url);
		if(parsed) {
			return parsed[1];
		}
	}

	function loadVideoAndCache(url)
	{
		var id = getIdFromUrl(url);
		if(id && player && player.loadVideoById) {
			player.loadVideoById(id, 0);
			player.pauseVideo();
			player.mute();
			loadingFinished = false;
			window.setTimeout(function()
			{
				player.pauseVideo();
				totalVideoBytes = player.getVideoBytesTotal();
			}, 2000);
		} else {
			youtubeError();
		}
	}

	return {
		onload: function()
		{
			var params = { allowScriptAccess: 'always' };
			var atts = { id: 'myytplayer' };
			// cachedUrl
			//var key = 'AI39si4z_iLZtEv5BXis1xhDhvS1OvTkWIbJH4TRePoiEEtMzFT61q24pUTHPSL7i_tEtPZJdCHivmihaC0OG10GW3cvdrvDWg';
			//swfobject.embedSWF('http://gdata.youtube.com/apiplayer?key='+key+youtube.config()+'&enablejsapi=1&playerapiid=ytplayer', 'ytapiplayer', '425', '356', '8', null, null, params, atts);
			var key = 'AI39si4z_iLZtEv5BXis1xhDhvS1OvTkWIbJH4TRePoiEEtMzFT61q24pUTHPSL7i_tEtPZJdCHivmihaC0OG10GW3cvdrvDWg';
			swfobject.embedSWF('http://gdata.youtube.com/apiplayer?version=3&key='+key+youtube.config()+'&enablejsapi=1&playerapiid=ytplayer', 'ytapiplayer', '425', '356', '8', null, null, params, atts);

			// when finished, calls onYouTubePlayerReady, which calls youtube.init()
		},
		init: function()
		{
			loaded = true;
			if(cuedVideos.length > 0) {
				loadVideoAndCache(cuedVideos[0]);
				cuedVideos = [];
			}
		},
		setPlayer: function(youtubePlayer)
		{
			player = youtubePlayer;
		},
		getPlayer: function()
		{
			return player;
		},
		is: function(url)
		{
			return (url || alarmd.getTarget(0)) == cachedUrl;
		},
		isVideo: function(url)
		{
			return url.indexOf('youtube.com') > -1; // TODO improve regex
		},
		resetCachedUrl: function()
		{
			cachedUrl = null;
		},
		isPlaying: function()
		{
			// Player State 1 is Playing
			return player && player.getPlayerState && player.getPlayerState() == 1; // && player.getVolume() > 0
		},
		cacheIndicator: function()
		{
			if(!jQuery('#youtube-cache-indicator').is('.error')) {
				var str = '';
				if(loadingFinished) {
					return;
				} else if(player && player.getVideoBytesLoaded && totalVideoBytes && !youtube.isPlaying()) { // may cause lag if try to update while the video is playing.
					var percent = Math.round(player.getVideoBytesLoaded() * 100 / totalVideoBytes);
					str = 'Video ' + percent + '% Loaded';
					if(percent == 100) {
						loadingFinished = true;
					}
				}
				util.dom.update('#youtube-cache-indicator', str);
			}
		},
		cache: function(url)
		{
			jQuery('#youtube-cache-indicator').removeClass('error');
			var tUrl = url || alarmd.getTarget(0);
			if(!youtube.isVideo(tUrl)) {
				return;
			}
			jQuery('#alarm').css('visibility', 'hidden');
			cachedUrl = tUrl;
			if(!loaded) {
				cuedVideos.push(cachedUrl);
			} else {
				window.setTimeout(function()
				{
					loadVideoAndCache(cachedUrl);
				}, 1000);
			}
		},
		play: function(bSecondTry)
		{
			if(player && player.seekTo) {
				player.seekTo(0, true);
				player.playVideo();
				player.unMute();
				player.setVolume(100);
			} else if(!bSecondTry) {
				window.setTimeout(function() {
					youtube.play(true);
				}, 800);
			} else {
				youtubeError();
			}
		},
		startOverAndPause: function()
		{
			if(player && player.seekTo) {
				player.seekTo(0, true);
				player.pauseVideo();
			}
		},
		hide: function()
		{
			jQuery('#alarm').css('visibility', 'hidden');
			if(player && player.pauseVideo) {
				player.pauseVideo();
			}
		},
		config: function()
		{
			return dao.getLoop() ? '&loop=1' : '';
		}
	};
})();

// Hooray, forced to use a global!
// Triggered every time the player is shown
function onYouTubePlayerReady(playerId) {
	if(playerId == 'ytplayer') {
		var player = document.getElementById('myytplayer');
		player.addEventListener('onError', 'youtubeError');
		player.addEventListener("onStateChange", "youtubeStateChange");
		youtube.setPlayer(player);
		youtube.init();
	}
};
function youtubeStateChange(state)
{
	//console.log('new state', state);
};
function youtubeError(errorCode)
{
	jQuery('#youtube-cache-indicator').addClass('error');
	util.dom.update('#youtube-cache-indicator', 'Video failed to load.');
};


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

