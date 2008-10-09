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
			var key = 'AI39si4z_iLZtEv5BXis1xhDhvS1OvTkWIbJH4TRePoiEEtMzFT61q24pUTHPSL7i_tEtPZJdCHivmihaC0OG10GW3cvdrvDWg';
			swfobject.embedSWF('http://gdata.youtube.com/apiplayer?key='+key+youtube.config()+'&enablejsapi=1&playerapiid=ytplayer', 'ytapiplayer', '425', '356', '8', null, null, params, atts);
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
			jQuery('#alarm').show().css('visibility', 'hidden');
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
		hide: function()
		{
			jQuery('#alarm').css('visibility', 'hidden');
			if(player) {
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