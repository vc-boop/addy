'use strict';

$(document).ready(function () {

	$('.notify-me').submit(function (e) {

		var form = $(this),
		    message = $('.widget-newsletter'),
		    message_input = $('.widget-newsletter input[type=email]'),
		    messageSuccess = 'Your email is sent',
		    messageInvalid = 'Please enter a valid email address',
		    messageSigned = 'This email is already signed',
		    messageErrore = 'Error request';

		e.preventDefault();

		$.ajax({
			url: 'php/notify-me.php',
			type: 'POST',
			data: form.serialize(),
			success: function success(data) {

				form.find('.btn').prop('disabled', true);

				switch (data) {
					case 0:

						message_input.attr("placeholder", messageSuccess);
						message_input.removeClass('error');
						message_input.addClass('valid');

						setTimeout(function () {
							form.trigger('reset');
						}, 2000);

						break;
					case 1:
						message_input.attr("placeholder", messageInvalid);
						message_input.addClass('error');

						break;
					case 2:
						message_input.attr("placeholder", messageSigned);
						message_input.addClass('error');

						setTimeout(function () {
							form.trigger('reset');
						}, 2000);

						break;
					default:
						message_input.attr("placeholder", messageErrore);
						message_input.addClass('error');
				}

				form.find('.btn').prop('disabled', false);
				message_input.val('');
			}
		});
	});

	$('.contact-form').submit(function (e) {

		var form = $('.contact-form');
		e.preventDefault();

		$.ajax({
			type: 'POST',
			url: 'php/contact.php',
			data: form.serialize(),
			success: function success(data) {


				var obj = JSON.parse(data);

				if (obj.nameMissed !== undefined) {
					$('input[name=name]').addClass('error');
					$('input[name=name]').attr("placeholder", "Please fill all fields");
				} else {
					$('input[name=name]').removeClass('error');
					$('input[name=name]').attr("placeholder", "Name");
				}

				if (obj.emailMissed !== undefined) {
					$('input[name=email]').addClass('error');
					$('input[name=email]').attr("placeholder", "Please fill all fields");
				} else {
					$('input[name=email]').removeClass('error');
					$('input[name=email]').attr("placeholder", "Email");
				}

				if (obj.commentMissed !== undefined) {
					$('textarea').addClass('error');
					$('textarea').attr("placeholder", "Please fill all fields");
				} else {
					$('textarea').removeClass('error');
					$('textarea').attr("placeholder", "Message");
				}

				//$('.form-message').html(data);

				console.log(obj);

				if (obj.status && obj.status === 'success') {
					// setTimeout(function () {

					console.log(obj.status);

					form.trigger('reset');

					//form.find('.btn').prop('disabled', false);
					//form.find('button').html('OK!');

					$('#contact button[type="submit"]').addClass('success');

					setTimeout(function () {
						$('#contact button[type="submit"]').removeClass('success');
					}, 2000);
					
					form.find('.btn').prop('disabled', true);

					// }, 100);
				}
			}
		});
	});

	$('.log-in-form').submit(function(e) {
		e.preventDefault();
	});

});
