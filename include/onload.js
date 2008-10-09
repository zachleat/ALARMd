jQuery(function()
{
	// change wasn't firing in IE on a checkbox, click fires even when label is clicked
	jQuery('#naked-mode').click(function(event)
	{
		jQuery('body').toggleClass('naked-mode');
	});
	jQuery('#24hourFormat').change(alarmd.reformatAlarmDates);
	jQuery('#options-form').submit(function()
	{
		alarmd.save();
		return false;
	});
	jQuery('.toggle').click(function()
	{
		var id = jQuery(this).attr('id');
		var target = id.substr(id.split('-')[0].length + 1); // toggle- or cancel-
		jQuery('#'+target).slideToggle('slow', function()
		{
			// causes an error in IE.
			//jQuery('select:visible, input:visible', this).focus();
		});
	});
	jQuery('#test-alarm').click(function()
	{
		var str;
		if(jQuery(this).html() == 'Hide Test') {
			str = 'Test';
			alarmd.kill(true);
		} else {
			str = 'Hide Test';
			alarmd.trigger(0, true);
		}
		util.dom.update(this, str);
		return false;
	});
	jQuery('#calendar-help').click(function()
	{
		jQuery('#calendar-help-content').slideToggle();
	});
	jQuery('#calendar-help-content').click(function()
	{
		jQuery(this).slideToggle();
	});
	jQuery(document).keyup(function(event) // otherwise it will trigger by just holding it down.
	{
		if(!jQuery(event.target).is('input, select, button')) {
			// Unspecified IE error
			alarmd.keymash.execute();
		}
	});

	function optionChange()
	{
		var $t = jQuery(this);
		var format = $t.val();
		jQuery('.'+$t.attr('id')).hide();
		jQuery('#'+format+'Display').show();
		jQuery('#'+format).show();
	}

	jQuery('#timeFormat').change(function()
	{
		var val = jQuery(this).val();
		jQuery('#'+val+'Display').show();
		if(val == 'metricTimeFormat') {
			alarmd.setInterval(864);
		} else {
			alarmd.setInterval(1000);
		}
		optionChange.call(this);
	}).change();

	jQuery('#alarmFormat').change(optionChange).change();
	jQuery('#ok-add-new-alarm').click(function()
	{
		var val,
			label,
			source = jQuery('#add-alarm-value').val();

		switch(jQuery('#new-alarm-type').val()) {
			case 'youtube-id':
				val = 'http://www.youtube.com/v/'+source;
				break;
			case 'last-fm-tag':
				val = 'last.fm/tag/'+source;
				break;
			case 'last-fm-user':
				val = 'last.fm/user/'+source;
				break;
			default:
				val = source;
				break;
		}
		var label = jQuery('#add-alarm-label').val() || val;
		if(val) {
			jQuery('#default-alarm').append('<option value="'+val+'">'+label+'</option>');
		}
		jQuery('#add-new-alarm').slideToggle();
		return false;
	});
	jQuery('#delete-alarm-from-list').click(function()
	{
		var selected = jQuery('#default-alarm option:selected');
		if(confirm('Are you sure you want to delete '+selected.text()+'?')) {
			selected.remove();
		}
		return false;
	});

	youtube.onload();
	alarmd.load();
});
