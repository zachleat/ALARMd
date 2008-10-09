// John Resig's Easy Accordion:
// http://docs.jquery.com/Tutorials:Accordion_Menu_(Screencast)
jQuery(function()
{
	jQuery("dd:not(:first)").hide();
	jQuery("dt").click(function(){
		$("dd:visible").slideUp("slow");
		$(this).next().slideDown("slow");
		return false;
	});
});

// Cookies
var cookie = {
	create: function(name, value, days)
	{
		var str;
		if(typeof value == 'object') {
			str = [];
			for(var j in value) {
				str.push(encodeURIComponent(j) + '=' + encodeURIComponent(value[j]));
			}
			str = str.join('&');
		} else {
			str = encodeURIComponent(value);
		}
		var expires;
		if (days) {
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			expires = '; expires=' + date.toGMTString();
		} else {
			expires = '';
		}
		document.cookie = name + '=' + str + expires + '; path=/';
	},
	get: function(name)
	{
		var nameEQ = name + '=';
		var ca = document.cookie.split(';');
		for(var i=0, k=ca.length; i<k; i++) {
			var c = ca[i];
			while(c.charAt(0)==' ') {
				c = c.substring(1,c.length);
			}
			if(c.indexOf(nameEQ) == 0) {
				var value = c.substring(nameEQ.length,c.length);
				if(value.indexOf('=') > -1 || value.indexOf('&') > -1) {
					var obj = {};
					var split = value.split( '&' );
					for(var m=0, n=split.length; m<n; m++) {
						var keyval = split[m].split('=');
						obj[decodeURIComponent(keyval[0])] = decodeURIComponent(keyval[1]);
					}
					return obj;
				}
				return decodeURIComponent(value);
			}
		}
	},
	'delete': function(name)
	{
		cookie.create(name, '', -1);
	}
};

// Custom Util Functions
var util = {
	getRegex: function(pattern, value)
	{
		var r = new RegExp(pattern);
		return r.exec(value);
	},
	dom: {
		update: function(selector, val)
		{
			var $t = jQuery(selector);
			if($t.html() !== ''+val) {
				$t.html(val);
			}
		}
	},
	string: {
		padNumber: function(str)
		{
			var num = parseInt(str,10);
			return num < 10 ? '0' + num : num;
		}
	},
	parseTime: function(val) // accepts 20h, 20H, 20m, 20s 20 H, etc.
	{
		var node,
			time,
			now = new Date();
		var relativeTime = new RegExp(/([0-9]+)\s?([HhMmSs])/g); // @todo: add combinations of h, m, s together, or 01:01:01 syntax
		if((node = relativeTime.exec(val)) != null) {
			var multiplier 	= 0;

			if(node[2] && node[2].toUpperCase() == 'S') {
				multiplier = 1;
			} else if(node[2] && node[2].toUpperCase() == 'M') {
				multiplier = 60;
			} else { // default Hours
				multiplier = 60*60;
			}

			if(multiplier) {
				now.setTime(now.getTime() + parseInt(node[1], 10) * 1000 * multiplier);
			}

			return now;
		}
		var absoluteTime = new RegExp(/^(0?[0-9]|1[0-9]|2[0-3])[^0-9]?(0?[0-9]|[1-5][0-9])?[^0-9A-Za-z]?(am|AM|pm|PM)?$/);
		if((time = absoluteTime.exec(val)) != null) {
			var date = new Date();
			if(time[1]) {
				var hours = parseInt(time[1],10);
				if(time[3] == 'PM' || time[3] == 'pm') {
					hours = hours%12 + 12;
				}
				date.setHours(hours);
			}
			if(time[2]) {
				date.setMinutes(time[2]);
			}
			
			date.setSeconds(0);
			if(now.getTime() > date.getTime()) {
				date.setTime(date.getTime() + 1000*60*60*24); // +1 day
			}
			return date;
		}
	},
	date: {
		objToIso8601: function(obj)
	    {
	        if(!obj) obj = new Date();
	        return obj.getFullYear()
	            + '-' + util.string.padNumber(obj.getUTCMonth()+1)
	            + '-' + util.string.padNumber(obj.getUTCDate())
	            + 'T' + util.string.padNumber(obj.getUTCHours())
	            + ':' + util.string.padNumber(obj.getUTCMinutes())
	            + ':' + util.string.padNumber(obj.getUTCSeconds())
	            + 'Z';
	    }
	},
	loadCssUrl: function(url)
	{
		var link = document.createElement('link');
		link.setAttribute('rel', 'stylesheet');
		link.setAttribute('type', 'text/css');
		link.setAttribute('href', url);
		//jQuery('head').append(link); // this doesn't work?
		document.getElementsByTagName("head")[0].appendChild(link);
	}
};


/*
 * Javascript Humane Dates
 * Copyright (c) 2008 Dean Landolt (deanlandolt.com)
 * Re-write by Zach Leatherman (zachleat.com)
 * 
 * Adopted from the John Resig's pretty.js
 * at http://ejohn.org/blog/javascript-pretty-date
 * and henrah's proposed modification 
 * at http://ejohn.org/blog/javascript-pretty-date/#comment-297458
 * 
 * Licensed under the MIT license.
 */

function humane_date(date_str){
	var time_formats = [
		[60, 'Just Now'],
		[90, '1 Minute'], // 60*1.5
		[3600, 'Minutes', 60], // 60*60, 60
		[5400, '1 Hour'], // 60*60*1.5
		[86400, 'Hours', 3600], // 60*60*24, 60*60
		[129600, '1 Day'], // 60*60*24*1.5
		[604800, 'Days', 86400], // 60*60*24*7, 60*60*24
		[907200, '1 Week'], // 60*60*24*7*1.5
		[2628000, 'Weeks', 604800], // 60*60*24*(365/12), 60*60*24*7
		[3942000, '1 Month'], // 60*60*24*(365/12)*1.5
		[31536000, 'Months', 2628000], // 60*60*24*365, 60*60*24*(365/12)
		[47304000, '1 Year'], // 60*60*24*365*1.5
		[3153600000, 'Years', 31536000], // 60*60*24*365*100, 60*60*24*365
		[4730400000, '1 Century'], // 60*60*24*365*100*1.5
	];

	var time = ('' + date_str).replace(/-/g,"/").replace(/[TZ]/g," "),
		dt = new Date,
		seconds = ((dt - new Date(time) + (dt.getTimezoneOffset() * 60000)) / 1000),
		token = ' Ago',
		i = 0,
		format;

	if (seconds < 0) {
		seconds = Math.abs(seconds);
		token = '';
	}

	while (format = time_formats[i++]) {
		if (seconds < format[0]) {
			if (format.length == 2) {
				return format[1] + (i > 1 ? token : ''); // Conditional so we don't return Just Now Ago
			} else {
				return Math.round(seconds / format[2]) + ' ' + format[1] + (i > 1 ? token : '');
			}
		}
	}

	// overflow for centuries
	if(seconds > 4730400000)
		return Math.round(seconds / 4730400000) + ' Centuries' + token;

	return date_str;
};

if(typeof jQuery != 'undefined') {
	jQuery.fn.humane_dates = function(){
		return this.each(function(){
			var date = humane_date(this.title);
			if(date && jQuery(this).text() != date) // don't modify the dom if we don't have to
				jQuery(this).text(date);
		});
	};
}
