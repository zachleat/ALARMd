var alarmd = (function()
{
	var DEFAULT_VIDEO = 'http://www.youtube.com/v/42peBWLbYto';

	var alarms = [],
        targets = [],
		months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		offset = 0, // in seconds;
		keyMashCounter = 0,
		keyMashTimeout,
		cachedParameters,
		interval;

	function formatDate(obj, bIgnoreSeconds)
	{
		if(!obj) obj = new Date();
		return obj.getDate() + ' ' +
                months[obj.getMonth()].substr(0,3) + ' ' +
				obj.getFullYear() + ' ' +
				getTimeString(obj, bIgnoreSeconds);
	};

	function getDateHours(obj)
	{
		return (dao.is24HourFormat() ? util.string.padNumber(obj.getHours()) : (obj.getHours() == 12 || obj.getHours() == 0 ? 12 : obj.getHours() % 12));
	};

	function getDateMinutes(obj)
	{
		return util.string.padNumber(obj.getMinutes());
	};

	function getDateMinor(obj, bIgnoreSeconds)
	{
		return (!bIgnoreSeconds && dao.isShowSeconds() ? ':' + util.string.padNumber(obj.getSeconds()) : '') + (dao.is24HourFormat() ? '' : (obj.getHours() >= 12 ? 'PM' : 'AM'));
	};

	function getTimeString(obj, bIgnoreSeconds)
	{
		if(!obj) obj = new Date();
		return getDateHours(obj) + ':' + getDateMinutes(obj) + getDateMinor(obj, bIgnoreSeconds);
	};

	function hideOptions()
	{
		if(jQuery('#options').is(':visible')) {
			jQuery('#toggle-options').click();
		}
	};

	function loadCss(skin, css)
	{
		// Load Css
		jQuery('link[href!="include/alarmd.css"]').remove();
		if(skin) { // make sure it's not empty if we're going to load it.
			util.loadCssUrl(skin);
		}
		if(css) {
			util.loadCssUrl(css);
		}
	}

	function appendKillSwitch(div)
	{
		div.append('<span id="kill-button">OFF</span><span id="kill-note">Click Here or Mash your Keyboard</span>');
		jQuery('span',div).click(alarmd.kill);
	}

	function removeKillSwitch()
	{
		jQuery('#kill-button, #kill-note').remove();
	}

	var formats = {
		unixTimeFormat: function(date)
		{
			var t = Math.floor(date.getTime()/1000);
			util.dom.update('#unixTimeFormat', t);
		},
		unitcircleTimeFormat: function(date)
		{
			function getGCD(x, y) {
				var w;
				while (y != 0) {
					w = x % y;
					x = y;
					y = w;
				}
				return x;
			}
			// TODO countdown time
			var percentIn = ((date.getHours()%12)*60*60 + date.getMinutes()*60 + date.getSeconds())/(12*60*60),
				radians = percentIn * 2*Math.PI,
				unitCircleRadians = -1*(radians-Math.PI/2),
				degrees,
				gcd,
				major,
				minor;

			if(unitCircleRadians < 0) {
				unitCircleRadians += 2*Math.PI;
			}
			degrees = Math.round(unitCircleRadians * 180/Math.PI);
			gcd = getGCD(degrees, 180);
			if(gcd > 1) {
				degrees /= gcd;
			}

			minor = gcd == 180 ? '' : '/' + (180/gcd); //no denominator for pi, 2pi, 3pi, etc
			var numerator;
			if(degrees === 0) {
				major = ''+degrees;
				minor = ''; // no denominator for 0
				jQuery('#unitcircle-pi').hide();
			} else {
				major = degrees == 1 ? '' : degrees; // no numerator for 1
				jQuery('#unitcircle-pi').show();
			}
			util.dom.update('#unitcircle-numerator', major);
			util.dom.update('#unitcircle-denominator', minor);
		},
		metricTimeFormat: function(date)
		{
			// TODO countdown time
			var metric = date.getHours()/0.24 + date.getMinutes()/14.4 + date.getSeconds()/864;
			var centidays = Math.floor(metric);
			util.dom.update('#metric-centidays', util.string.padNumber(centidays));
			util.dom.update('#metric-centidays-fraction', (metric - centidays).toString().substr(2, 3));
		},
		standardTimeFormat: function(date)
		{
			function update(h, m, s)
			{
				util.dom.update('#hours', h);
				util.dom.update('#minutes', m);
				util.dom.update('#seconds', s);
			}

			var firstAlarm = alarmd.getAlarm(0);
			if(dao.isCountdownMode() && firstAlarm) {
				var diff 		= (firstAlarm.getTime() - (new Date).getTime())/1000;
					h			= Math.floor(diff/(60*60)),
					m			= Math.floor(diff/60) - h*60,
					mUp			= Math.ceil(diff/60) - h*60,
					s			= diff % 60,
					isFuture 	= s > 0;

				// independent of 24 hour format
				if(isFuture) {
					update(
						util.string.padNumber(h),
						util.string.padNumber(dao.isShowSeconds() ? m : mUp),
						dao.isShowSeconds() ? ':' + util.string.padNumber(s) : ''
					);
				} else {
					update('00', '00', dao.isShowSeconds() ? ':00' : '');
				}
			} else {
				update(getDateHours(date), getDateMinutes(date), getDateMinor(date));
			}
		},
		readableTimeFormat: function(date)
		{
			var hours = ['Twelve', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven'];
			var str = [];
			var m = date.getMinutes();
			var h = date.getHours();
			if(m < 8) {
				str.push('About');
			} else if(m < 12) { 
				str.push('Ten after');
			} else if(m < 18) {
				str.push('Quarter past');
			} else if(m < 24) {
				str.push('Twenty after');
			} else if(m < 36) {
				str.push('Half past');
			} else if(m < 42) {
				str.push('Twenty til');
			} else if(m < 48) {
				str.push('Quarter til');
			} else if(m < 52) {
				str.push('Ten til');
			} else {
				str.push('Almost');
			}
			if(m>=36) {
				h++;
			}
			str.push(hours[h%12]);

			var firstAlarm = jQuery('#alarmKey0 .dateDiff');
			if(dao.isCountdownMode() && firstAlarm.length > 0) {
				util.dom.update('#readableTimeFormatDisplay', firstAlarm.text());
			} else {
				util.dom.update('#readableTimeFormatDisplay', str.join(' '));
			}
		}
	};

	function getAlarmContent(url)
	{
		function isMp3(url) {
			return url.indexOf('.mp3') > -1;
		}
		function isYouTube(url) {
			return url.indexOf('youtube.com') > -1;
		}
		function isLastFm(url) {
			return url.indexOf('last.fm') > -1;
		}

		if(isMp3(url)) {
			return '<embed src="lib/flash_mp3_player/mp3player.swf" width="425" height="20" allowfullscreen="true" flashvars="&file=' + url + '&height=20&width=425&showdigits=false&autostart=true&repeat='+(dao.getLoop()?'true':'false')+'&shuffle=false&volume=100&useaudio=false&usecaptions=false&usefullscreen=false&usekeys=false" />';
		} else if(isYouTube(url)) {
			url = url.replace(/watch\?v\=/, 'v/');
			//<object width="425" height="355"><param name="movie" value="http://www.youtube.com/v/CQzUsTFqtW0&rel=1&border=0"></param><param name="wmode" value="transparent"></param><embed src="http://www.youtube.com/v/CQzUsTFqtW0&rel=1&border=0" type="application/x-shockwave-flash" wmode="transparent"width="425" height="355"></embed></object>
			return '<embed id="youtube-player" src="' + url + youtube.config() + '&autoplay=1" type="application/x-shockwave-flash" wmode="transparent" width="425" height="350"></embed>';
		} else if(isLastFm(url)) {
			//content = '<style type="text/css">table.lfmWidget20070527022148 td {margin:0 !important;padding:0 !important;border:0 !important;}table.lfmWidget20070527022148 tr.lfmHead a:hover {background:url(http://panther1.last.fm/widgets/images/en/header/radio/regular_black.gif) no-repeat 0 0 !important;}table.lfmWidget20070527022148 tr.lfmEmbed object {float:left;}table.lfmWidget20070527022148 tr.lfmFoot td.lfmConfig a:hover {background:url(http://panther1.last.fm/widgets/images/en/footer/black_np.gif) no-repeat 0 0 !important;;}table.lfmWidget20070527022148 tr.lfmFoot td.lfmView a:hover {background:url(http://panther1.last.fm/widgets/images/en/footer/black_np.gif) no-repeat -85px 0 !important;}table.lfmWidget20070527022148 tr.lfmFoot td.lfmPopup a:hover {background:url(http://panther1.last.fm/widgets/images/en/footer/black_np.gif) no-repeat -159px 0 !important;}</style>';
			//content += '<table class="lfmWidget20070527022148" cellpadding="0" cellspacing="0" border="0" style="width:184px;"><tr class="lfmHead"><td><a title="Music tagged indie " href="http://www.last.fm/listen/globaltags/indie" target="_blank" style="display:block;overflow:hidden;height:20px;width:184px;background:url(http://panther1.last.fm/widgets/images/en/header/radio/regular_black.gif) no-repeat 0 -20px;text-decoration:none;"></a></td></tr><tr class="lfmEmbed"><td><object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" width="184" height="140" codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab%23version=7,0,0,0" style="float:left;"><param name="bgcolor" value="000000" /><param name="movie" value="http://panther1.last.fm/widgets/radio/3.swf" /><param name="quality" value="high" /><param name="allowScriptAccess" value="sameDomain" /><param name="FlashVars" value="lfmMode=radio&amp;radioURL=globaltags%2Findie&amp;title=Music+tagged+indie+&amp;theme=black&amp;autostart=1" /><embed src="http://panther1.last.fm/widgets/radio/3.swf" type="application/x-shockwave-flash" name="widgetPlayer" bgcolor="000000" width="184" height="140" quality="high" pluginspage="http://www.macromedia.com/go/getflashplayer"  FlashVars="lfmMode=radio&amp;radioURL=globaltags%2Findie&amp;title=Music+tagged+indie+&amp;theme=black&amp;autostart=1" allowScriptAccess="sameDomain"></embed></object></td></tr><tr class="lfmFoot"><td style="background:url(http://panther1.last.fm/widgets/images/footer_bg/black.gif) repeat-x 0 0;text-align:right;"><table cellspacing="0" cellpadding="0" border="0" style="width:184px;"><tr><td class="lfmConfig"><a href="http://www.last.fm/widgets/?widget=radio&amp;url=globaltags%2Findie&amp;colour=black&amp;width=regular&amp;autostart=1&amp;from=widget" title="Get your own" target="_blank" style="display:block;overflow:hidden;width:85px;height:20px;float:right;background:url(http://panther1.last.fm/widgets/images/en/footer/black_np.gif) no-repeat 0 -20px;text-decoration:none;"></a></td><td class="lfmView" style="width:74px;"><a href="http://www.last.fm/" title="Visit Last.fm" target="_blank" style="display:block;overflow:hidden;width:74px;height:20px;background:url(http://panther1.last.fm/widgets/images/en/footer/black_np.gif) no-repeat -85px -20px;text-decoration:none;"></a></td><td class="lfmPopup"style="width:25px;"><a href="http://www.last.fm/widgets/popup/?widget=radio&amp;url=globaltags%2Findie&amp;colour=black&amp;width=regular&amp;autostart=1&amp;from=widget&amp;resize=1" title="Load this radio in a pop up" target="_blank" style="display:block;overflow:hidden;width:25px;height:20px;background:url(http://panther1.last.fm/widgets/images/en/footer/black_np.gif) no-repeat -159px -20px;text-decoration:none;" onclick="window.open(this.href + \'&amp;resize=0','lfm_popup','height=240,width=234,resizable=yes,scrollbars=yes\'); return false;"></a></td></tr></table></td></tr></table>';
			var mode = url.split( '/' );
			if(mode[1].toLowerCase() == 'tag') {
				var tag = mode[2] || 'indie';
				return '<embed src="http://panther1.last.fm/widgets/radio/3.swf" type="application/x-shockwave-flash" name="widgetPlayer" bgcolor="000000" width="184" height="140" quality="high" pluginspage="http://www.macromedia.com/go/getflashplayer"  FlashVars="lfmMode=radio&amp;radioURL=globaltags%2F' + tag + '&amp;title=Music+tagged+' + tag + '+&amp;theme=black&amp;autostart=1" allowScriptAccess="sameDomain"></embed>';
			} else if(mode[1].toLowerCase() == 'user') {
				var user = mode[2] || 'theweezel';
				return '<embed src="http://panther1.last.fm/widgets/radio/3.swf" type="application/x-shockwave-flash" name="widgetPlayer" bgcolor="000000" width="184" height="140" quality="high" pluginspage="http://www.macromedia.com/go/getflashplayer"  FlashVars="lfmMode=radio&amp;radioURL=user%2F' + user + '%2Fpersonal&amp;title=' + user + '%E2%80%99s+Radio+Station&amp;theme=black&amp;autostart=1" allowScriptAccess="sameDomain"></embed>';
			} else if(mode[1].toLowerCase() == 'playlist') {
				// content = '<embed src="http://panther1.last.fm/widgets/playlist/3.swf" type="application/x-shockwave-flash" name="widgetPlayer" bgcolor="000000" width="184" height="284" quality="high" pluginspage="http://www.macromedia.com/go/getflashplayer"  FlashVars="lfmMode=playlist&amp;resourceType=37&amp;resourceID=101470&amp;radioURL=user%2F' + user + '%2Fplaylist&amp;username=' + user + '&amp;title=' + user + '%E2%80%99s+Playlist&amp;theme=black&amp;autostart=1" allowScriptAccess="sameDomain"></embed>';
				return '';
			}
		}
		return false; // open new window with url
	};

	return {
		setInterval: function(time)
		{
			if(interval) {
				window.clearInterval(interval);
			}
			interval = window.setInterval(alarmd.updateClock, time || 1000);
		},
		updateClock: function()
		{
			var obj = new Date();

			var firstAlarm = jQuery('#alarmKey0 .dateDiff');
            firstAlarm.humane_dates();

			var format 	= dao.getTimeFormat();
			var content = formats[format](obj);
			util.dom.update('#'+format+'Display', content);

			var firstAlarmDate = alarmd.getAlarm(0),
				currentTime = (new Date).getTime();
			if(firstAlarmDate) {
				var alarmTime = firstAlarmDate.getTime();
				if(alarmTime < currentTime) {
					if(!jQuery('#alarmKey0').is('.triggered')) {
						jQuery('body')
							.removeClass('alarmWithin1Minute')
							.addClass('alarmActive');
						alarmd.trigger(0);
					}
				} else if(alarmTime - currentTime < 1000*60) {
					jQuery('body')
						.removeClass('alarmWithin5Minutes')
						.addClass('alarmWithin1Minute');
				} else if(alarmTime - currentTime < 1000*60*5) {
					jQuery('body')
						.removeClass('alarmWithin15Minutes')
						.addClass('alarmWithin5Minutes');
				} else if(alarmTime - currentTime < 1000*60*15) {
					jQuery('body')
						.removeClass('alarmWithin30Minutes')
						.addClass('alarmWithin15Minutes');
				} else if(alarmTime - currentTime < 1000*60*30) {
					jQuery('body')
						.addClass('alarmWithin30Minutes');
				}
			}
			youtube.cacheIndicator();
		},
        setTitle: function(str)
        {
            document.title = 'ALARMd.com using ' + str;
            jQuery('#calendarTitle').html(' using ' + str);
        },
		resetAlarms: function()
		{
			alarms = [];
			jQuery('#alarm-list ul').html('');
		},
		getAlarm: function(key)
		{
			return alarms[key || 0];
		},
        addAlarmDate: function(date, label, target)
		{
			function isUniqueDay(date)
			{
				for(var j=0, k=alarms.length; j<k; j++) {
					if(alarms[j].getDate() == date.getDate() && alarms[j].getMonth() == date.getMonth() && alarms[j].getFullYear() == date.getFullYear()) {
						return false;
					}
				}
				return true;
			}

			if(!date) return;

			var minutesPrior = dao.getGcalEventsPrior();
			if(dao.isGcalAlarmFormat() && minutesPrior) {
				date.setTime(date.getTime() - minutesPrior*60*1000);
			}

            var key     		= alarms.length,
                content 		= [],
				daysInFuture 	= (date.getTime() - (new Date()).getTime())/(1000*60*60*24),
				isWithin		= !dao.getGcalEventsWithin() ? true : daysInFuture <= dao.getGcalEventsWithin(),
				isUnique		= !dao.isOneEventPerDay() ? true : isUniqueDay(date);

            if((key == 0 || !dao.isGcalAlarmFormat() || (isWithin && isUnique)) && daysInFuture > 0) {
                alarms[key] = date;
				if(target) {
					targets[key] = target;
				}
                if(key == 0) {
                    content.push('<div class="dateDiff" title="' + util.date.objToIso8601(date) + '">' + util.date.objToIso8601(date) + '</div>');
                }
                content.push('<div class="date">' + formatDate(date, true) + '</div>');
                if(label) {
                    content.push(' <div class="description">' + label + '</div>');
                }
                jQuery('#alarm-list ul').append('<li id="alarmKey'+key+'"' + (key > 0 ? ' class="hide-naked"' : '') + '>' + content.join('') + '</li>');
				if(key == 0) {
					jQuery('#alarm-list .dateDiff').humane_dates();
				}
				/* jQuery('#alarmKey'+key).click(function(event)
				{
					if(!jQuery(event.target).is('a')) {
						alarmd.test(key);
					}
				}); */
            }
		},
        trigger: function(key, bTesting)
        {
			var alarm = jQuery('#alarmKey' + key),
				alarmDisplay;

			if(alarm && (!alarm.is('.triggered') || bTesting)) {
				if(!bTesting) {
					alarm.addClass('triggered');
				}
				hideOptions();

				jQuery('#alarm').css('visibility', 'visible').show();
				var target = alarmd.getTarget(key);
				if(youtube.is(target)) {
					jQuery('#alarm-other').hide();
					jQuery('#alarm-youtube').show();
					youtube.play();
					if(!bTesting) {
						appendKillSwitch(jQuery('#alarm-youtube'));
					}
				} else {
					jQuery('#alarm-youtube').hide();
					alarmDisplay = jQuery('#alarm-other');
					alarmDisplay.show();
					alarmDisplay.html('');
					var content = getAlarmContent(target);
					if(false === content) {
						window.open(target, 'alarmdWindow');
						return;
					}

					alarmDisplay.html(content);
					if(!bTesting) {
						appendKillSwitch(alarmDisplay);
					}
				}
			}
        },
		test: function(key)
		{
			alarmd.trigger(key);
		},
		getCalendar: function(url) // called when saving (or loading)
		{
			alarmd.resetAlarms();
			loadCalendarByAddress(url);
		},
		reformatAlarmDates: function() //update alarm dates with a different format (ie: 24h to 12h)
		{
			jQuery('#alarm-list li').each(function(i)
			{
				var date = alarms[this.getAttribute('id').substr(8)];
				jQuery('.date', this).html(formatDate(date, true));
			});
		},
		save: function()
		{
			var oldParams 	= alarmd.getParameters() || {},
				url			= dao.getGcalAddress(),
				css 		= dao.getCssUrl(),
				skin		= dao.getSkinUrl(),
				singleAlarm = dao.getSingleAlarm(),
				alarmFormat = dao.getAlarmFormat(),
				eventWithin	= dao.getGcalEventsWithin(),
				eventPrior	= dao.getGcalEventsPrior(),
				oneEventDay	= dao.isOneEventPerDay(),
				target		= dao.getDefaultAlarm();

			var params = {
				'url': url,
				'eventWithin': eventWithin,
				'eventPrior': eventPrior,
				'oneEventDay': oneEventDay,
                'alarm': target,
				'format': dao.getTimeFormat(),
				'24hour': dao.is24HourFormat(),
				'seconds': dao.isShowSeconds(),
				'alarmFormat': alarmFormat,
				'singleAlarm': singleAlarm,
				'countdown': dao.isCountdownMode(),
				'loop': dao.getLoop(),
				'sources': dao.getSourcesList(),
				'css': css,
				'skin': skin
			};

			cachedParameters = params;
			cookie.create('alarmdPreferences', params, 9999);

			loadCss(skin, css);

			// Load Source
			var isAlreadyCached = false,
				isNewAlarm,
				isCacheVideo	= target != oldParams['alarm'];
			if(url && (
				(alarmFormat != oldParams['alarmFormat'] && dao.isGcalAlarmFormat())
				|| url != oldParams['url']
				|| eventWithin != oldParams['eventWithin']
				|| eventPrior != oldParams['eventPrior']
				|| oneEventDay != oldParams['oneEventDay']
			)) {
				isNewAlarm = sources.gcal.save(url, isCacheVideo);
			}
			if((alarmFormat != oldParams['alarmFormat'] && dao.isSingleAlarmFormat())
				|| singleAlarm != oldParams['singleAlarm']) {
				isNewAlarm = sources['transient'].save(singleAlarm, isCacheVideo);
			}
			// is not a new alarm, did not already perform video cache
			// if it was a newAlarm, and isCacheVideo was true, it would have cached inside of the save method
			if(!isNewAlarm && isCacheVideo) {
				youtube.cache();
			}
			hideOptions(); 
		},
		eraseUrl: function()
		{
			dao.setGcalAddress('');
			alarmd.save();
		},
		getParameters: function()
		{
			if(!cachedParameters) {
				cachedParameters = cookie.get('alarmdPreferences') || null;
			}
			return cachedParameters;
		},
		load: function()
		{
			jQuery('#alarm').hide().css('visibility', 'hidden');
			var params = alarmd.getParameters();

			if(params) {
				dao.setSourcesList(params['sources'] || '');
				dao.setDefaultAlarm(params['alarm'] || '');
				dao.setCssUrl(params['css'] || '');
				dao.setSkinUrl(params['skin'] || '');
				dao.setCountdownMode(params['countdown'] == 'true');
				dao.setTimeFormat(params['format'] || '');
				dao.set24HourFormat(params['24hour'] == 'true');
				dao.setShowSeconds(params['seconds'] == 'true');
				dao.setAlarmFormat(params['alarmFormat'] || '');
				dao.setLoop(params['loop'] == 'true');
				dao.setOneEventPerDay(params['oneEventDay'] == 'true');

				// for Google Calendar Alarm Format
				dao.setGcalEventsPrior(params['eventPrior']);
				dao.setGcalEventsWithin(params['eventWithin']);
				if(params['url']) {
					sources.gcal.load(params['url']);
				}
				if(params['singleAlarm']) {
					sources['transient'].load(params['singleAlarm']);
				}

				loadCss(dao.getSkinUrl(), dao.getCssUrl());
			}
		},
		getTarget: function(key)
		{
			if(key && targets[key]) {
				return targets[key];
			}

			var textField = dao.getDefaultAlarm();
			if(textField == '') {
				dao.setDefaultAlarm(DEFAULT_VIDEO);
				textField = DEFAULT_VIDEO;
			}
			return textField;
		},
		kill: function(bTesting)
		{
			jQuery('body').removeClass('alarmActive');
			if(youtube.is()) {
				youtube.hide();
				if(!bTesting) {
					youtube.resetCachedUrl();
					youtube.cache(); // prepare for next alarm
				}
			} else {
				util.dom.update('#alarm-other', '');
			}
			jQuery('#alarm').hide();
			removeKillSwitch();
			util.dom.update('#test-alarm', 'Test');
		},
		keymash: {
			execute: function()
			{
				if(keyMashTimeout) {
					window.clearTimeout(keyMashTimeout);
				}
				keyMashTimeout = window.setTimeout(function()
				{
					keyMashCounter = 0;
					keyMashTimeout = null;
				}, 1000 );

				keyMashCounter++;
				if(keyMashCounter > 5) {
					alarmd.kill();
					//alarmd.keymash.reset();
				}
			},
			reset: function()
			{
				keyMashCounter = 0;
				if(keyMashTimeout) {
					window.clearTimeout(keyMashTimeout);
				}
			}
		}
	};
})();
