if(typeof console == undefined) {
	var console = {log: function() {}};
}

var filter = {
	gcalAddress: function(str)
	{
		if(!str) {
			return '';
		}

		var suffix = 'group.calendar.google.com';
		if(str.indexOf('@' + suffix) > -1 || str.indexOf('%40' + suffix) > -1) {
		} else {
			str += '@' + suffix;
		}

		return str;
	},
	url: function(str)
	{
		return str != 'http://' ? str : '';
	}
}

var dao = {
	getLoop: function()
	{
		return jQuery('#loopVideos').get(0).checked == true;
	},
	setLoop: function(bool)
	{
		jQuery('#loopVideos').get(0).checked = bool;
	},
	getAlarmFormat: function()
	{
		return jQuery('#alarmFormat').val();
	},
	setAlarmFormat: function(val)
	{
		jQuery('#alarmFormat').val(val).change();
	},
	isSingleAlarmFormat: function()
	{
		return jQuery('#alarmFormat').val() == 'singleAlarmFormat';
	},
	getSingleAlarm: function()
	{
		return jQuery('#alarm-value').val();
	},
	setSingleAlarm: function(str)
	{
		jQuery('#alarm-value').val(str);
	},
	isGcalAlarmFormat: function()
	{
		return jQuery('#alarmFormat').val() == 'gcalAlarmFormat';
	},
	setGcalAddress: function(str)
	{
		str = filter.gcalAddress(str);
		jQuery('#gcal-address').val(str);
	},
	getGcalAddress: function()
	{
		return filter.gcalAddress(jQuery('#gcal-address').val());
	},
	getGcalEventsWithin: function()
	{
		return parseInt(jQuery('#gcal-events-within').val(), 10);
	},
	setGcalEventsWithin: function(num)
	{
		jQuery('#gcal-events-within').val(num);
	},
	getGcalEventsPrior: function()
	{
		return parseInt(jQuery('#gcal-events-prior').val(), 10);
	},
	setGcalEventsPrior: function(num)
	{
		jQuery('#gcal-events-prior').val(num);
	},
	isOneEventPerDay: function()
	{
		return jQuery('#gcal-one-event-day').get(0).checked == true;
	},
	setOneEventPerDay: function(bool)
	{
		jQuery('#gcal-one-event-day').get(0).checked = bool;
	},
	is24HourFormat: function()
	{
		return jQuery('#24hourFormat').get(0).checked == true;
	},
	set24HourFormat: function(bool)
	{
		jQuery('#24hourFormat').get(0).checked = bool;
	},
	isShowSeconds: function()
	{
		return jQuery('#secondsFormat').get(0).checked == true;
	},
	setShowSeconds: function(bool)
	{
		jQuery('#secondsFormat').get(0).checked = bool;
	},
	isCountdownMode: function(bool)
	{
		return jQuery('#isCountdown').get(0).checked == true;
	},
	setCountdownMode: function(bool)
	{
		jQuery('#isCountdown').get(0).checked == bool;
	},
	getTimeFormat: function()
	{
		return jQuery('#timeFormat').val();
	},
	setTimeFormat: function(val)
	{
		jQuery('#timeFormat').val(val).change();
	},
	getCssUrl: function()
	{
		return filter.url(jQuery('#external-css').val());
	},
	setCssUrl: function(str)
	{
		jQuery('#external-css').val(filter.url(str));
	},
	getSkinUrl: function()
	{
		return jQuery('#css-skin').val();
	},
	setSkinUrl: function(str)
	{
		jQuery('#css-skin').val(str);
	},
	getDefaultAlarm: function()
	{
		return filter.url(jQuery('#default-alarm').val());
	},
	setDefaultAlarm: function(str)
	{
		jQuery('#default-alarm').val(filter.url(str));
	},
	getSourcesList: function()
	{
		var str = [];
		jQuery('#default-alarm option').each(function(i)
		{
			var $t = jQuery(this);
			str.push($t.attr('value')+'|=|'+$t.html());
		});
		return str.join('|&|');
	},
	setSourcesList: function(str)
	{
		if(!str || str.indexOf('|=|') == -1) return;

		var options = str.split('|&|');
		var html = [];
		for(var j=0,k=options.length; j<k; j++) {
			var option = options[j].split('|=|');
			html.push('<option value="'+option[0]+'">'+option[1]+'</option>');
		}
		jQuery('#default-alarm').html(html.join("\n"));
	}
};