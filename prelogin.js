/*
 * 
 * Klickrr CONFIDENTIAL
 * __________________
 * 
 *  Klickrr All Rights Reserved.
 * 
 * NOTICE:  All information contained herein is, and remains the property
 * of Klickrr and its suppliers, if any.  The intellectual and technical
 * concepts contained herein are proprietary to Klickrr and its suppliers
 * and may be covered by U.S. and Foreign Patents, patents in process, and are
 * protected by trade secret or copyright law. Dissemination of this information
 * or reproduction of this material is strictly forbidden unless prior written
 * permission is obtained from Klickrr.
 */
/**
 * @author prashantmahajan
 */

function PreLogin() { };

PreLogin.EMAILEXP = new RegExp(/^\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i);
PreLogin.redirectURL = null;
PreLogin.submitBtn = null;

PreLogin.handleForgotPassword = function(event) {
	let v_sEmail;
	try {
		event.preventDefault();
		if(!Context.isFormValid('recover')) {
			return;
		}
		PreLogin.submitBtn = $(".recoverBtn");
		PreLogin.submitBtn.prop("disabled", true).html(`<span class="spinner-border spinner-border-sm me-2"></span> Sending reset link...`);
		$.post({
			url: "/forgotPasswordRequest",
			data: {
				emailOrPhone: v_sEmail
			}
		}).done(function(prm_bData) {
			PreLogin.submitBtn.prop("disabled", false).html("Recover");
			toastr.error(
				"please check your email for password reset instructions.",
				"Your Password reset request has been submitted!",
				{ showMethod: "fadeIn", hideMethod: "fadeOut", timeOut: 2000 }
			);
		}).fail(function(prm_bData) {
			PreLogin.submitBtn.prop("disabled", false).html("Recover");
			toastr.error(
				"Please try after sometime.",
				"Something went wrong!",
				{ showMethod: "fadeIn", hideMethod: "fadeOut", timeOut: 2000 }
			);
		});
	} catch (e) {
		PreLogin.submitBtn.prop("disabled", false).html("Recover");
		console.error(e);
	}
};

PreLogin.loginUser = function(event) {
	try {
		event.preventDefault();

		if (!Context.isFormValid('sign-in')) {
			console.log("line no. 81");
			return;
		}
		PreLogin.submitBtn = $(".singinBtn");
		PreLogin.submitBtn.prop("disabled", true).html(`<span class="spinner-border spinner-border-sm me-2"></span> Signing in...`);
		$.post({
			url: "/login",
			data: {
				email: $("#emailId-login").val(),
				password: $("#password-login").val()
			},
			cache: false
		}).done(function(prm_hData) {
			Context.showPostLoginScreen("/dashboard");
		}).fail(function(prm_hData) {
			PreLogin.submitBtn.prop("disabled", false).html("Sign in");
				toastr.error(
					"Please Try again",
					"Username/Password Combination Is Incorrect!",
					{ showMethod: "fadeIn", hideMethod: "fadeOut", timeOut: 2000 }
				);
		});
	} catch (e) {
		PreLogin.submitBtn.prop("disabled", false).html("Sign in");
		console.error(e);
	}
};

PreLogin.isPasswordComplex = function(password) {
	const complexityRegex = /^(?=.*[a-zA-Z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
	return complexityRegex.test(password);
};

PreLogin.registerUser = function(event) {
	try {
		event.preventDefault();
		if (!Context.isFormValid('sign-up')) {
			return;
		}

		const password = $("#password-register").val();
		if (!PreLogin.isPasswordComplex(password)) {
			$("#password-register")[0].setCustomValidity('Password must be at least 8 characters long and include 1 special character, 1 uppercase letter, 1 number, and 1 alphabet.');
			$("#password-register")[0].reportValidity(); 
			toastr.error(
				"",
				"Password must be at least 8 characters long and include 1 special character, 1 uppercase letter, 1 number, and 1 alphabet.",
				{ showMethod: "fadeIn", hideMethod: "fadeOut", timeOut: 3000 }
			);
			return;
		}
		PreLogin.submitBtn = $(".singupBtn");
		PreLogin.submitBtn.prop("disabled", true).html(`<span class="spinner-border spinner-border-sm me-2"></span> Signing up...`);
		$.post({
			url: "/register",
			data: {
				email: $("#emailId-register").val(),
				name: $("#name-register").val(),
				password: $("#password-register").val(),
				phone: $("#phone-register").val(),
				referid: $("#refer-id").val()
			},
			cache: false
		}).done(function(prm_hData) {
			let searchURL;
			try {
				if (undefined != prm_hData.message && null != prm_hData.message) {
					PreLogin.submitBtn.prop("disabled", false).html("Sign up");
					toastr.error(
						"",
						`${prm_hData.message}`,
						{ showMethod: "fadeIn", hideMethod: "fadeOut", timeOut: 2000 }
					);
					return;
				}
				if (null != PreLogin.redirectURL) {
					Context.showPostLoginScreen(PreLogin.redirectURL + "?signup=true");
				} else {
					searchURL = new URLSearchParams(window.location.search);
					if (null == searchURL.get("plan")) {
					} else {
						Context.put('plan', searchURL.get("plan"));
					}
					try {
						gtag('event', 'conversion', { 'send_to': 'AW-742124445/b5SuCL-Etv8CEJ3X7-EC' });
					} catch (e) {
						console.error(e);
					}
					Context.showPostLoginScreen("/profile?signup=true");
				}
			} catch (e) {
				PreLogin.submitBtn.prop("disabled", false).html("Sign up");
				console.error(e);
			}
		});
	} catch (e) {
		console.error(e);
		PreLogin.submitBtn.prop("disabled", false).html("Sign up");
	}
};

PreLogin.resetPasswordSubmitted = function(event) {
	let v_sPassword1;
	let v_sPassword2;
	let input;
	try {
		event.preventDefault();
		if(!Context.isFormValid('reset')) {
			return;
		}
		v_sPassword1 = $('#password-reset').val();
		v_sPassword2 = $('#confirm-password-reset').val();
		input = document.getElementById('confirm-password-reset');
		if (v_sPassword2 != v_sPassword1) {
			input.setCustomValidity("Both password must match");
			return;
		}

		$.post({
			url: "/updatepassword",
			data: {
				password: v_sPassword1,
				id1: $('#id1').val(),
				id2: $('#id2').val(),
			}
		}).done(function(prm_bData) {
			if (prm_bData === 'true') {
				toastr.success(
					"Redirecting to login screen in 3 seconds",
					"Password updated!",
					{ showMethod: "fadeIn", hideMethod: "fadeOut", timeOut: 2000 }
				);
				setTimeout(function() { window.location.href = '/'; }, 3000);
			} else {
				toastr.error(
					"Please try after sometime.",
					"Password update failed",
					{ showMethod: "fadeIn", hideMethod: "fadeOut", timeOut: 2000 }
				);
			}
		}).fail(function(prm_bData) {
			toastr.error(
				"Please try after sometime.",
				"Password update failed",
				{ showMethod: "fadeIn", hideMethod: "fadeOut", timeOut: 2000 }
			);
		});
	} catch (e) {
		console.error(e);
	}
};

PreLogin.isRegistered = function(prm_sEmail) {
	try {
		$.get({
			url: "/is-email-registered?email=" + prm_sEmail,
			cache: false
		}).done(function(prm_bData) {
			$("#login-or-registration-dialog").addClass("hidden");
			if (prm_bData) {
				$("#emailId-login").val(prm_sEmail);
				TopNavigationPreLogin.kickLoginScreen();
			} else {
				$("#emailId-register").val(prm_sEmail);
				TopNavigationPreLogin.kickRegistrationScreen();
			}
		});
	} catch (e) {
		console.error(e);
	}
};