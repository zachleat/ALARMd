var sources = {
	'transient': (function()
	{
		function addTransientAlarm(val)
		{
			alarmd.resetAlarms();
			var date = util.parseTime(val);
			if(date) {
				alarmd.addAlarmDate(date, 'Single Easy Alarm');
				return true;
			} 
			return false;
		};

		return {
			load: function(val)
			{
				return sources['transient'].save(val, true);
			},
			// returns if new alarm successfuly added
			save: function(val, loadAndCache)
			{
				dao.setSingleAlarm(val);
				if(dao.isSingleAlarmFormat()) {
					var b = addTransientAlarm(val);
					if(b && loadAndCache) {
						youtube.cache();
					} 
					return b;
				}
				return false;
			}
		};
	})(),
	'gcal': (function()
	{
		var cacheVideo;

		return {
			load: function(val)
			{
				return sources.gcal.save(val, true);
			},
			// returns if new alarm successfully added.
			save: function(val, loadAndCache)
			{
				cacheVideo = loadAndCache;
				dao.setGcalAddress(val);
				if(dao.isGcalAlarmFormat()) {
					alarmd.getCalendar(val);
					return true;
				}
				return false;
			},
			callback: function()
			{
				if(cacheVideo) {
					youtube.cache();
				}
			}
		};
	})()
};