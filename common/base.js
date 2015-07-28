(function($){

	/**
	 * [Base class for control base template]
	 * @author xuzhongyong
	 */
	$.Base = function(){
	}

	/**
	 * global variables
	 * callback for register handler when login and logout
	 * username for save user data
	 * WELCOME_INFO_SELECTOR for selector configuration
	 * @author xuzhongyong
	 */
	$.Base.loginCallbacks = $.Callbacks();
	$.Base.logoutCallbacks = $.Callbacks();
	var username;
	var WELCOME_INFO_SELECTOR = "#header .welcome-info";

	/**
	 * [
	 * getUsernameCallback preserve username when logged in
	 * resetUsernameCallback clear saved username
	 * ]
	 * @param  {string} name
	 * @author xuzhongyong
	 */
	var getUsernameCallback = function(name){
		username = name;
	}
	var resetUsernameCallback = function () {
		// body...
		username = undefined;
	}

	/**
	 * register callbacks for login and logout
	 */
	$.Base.loginCallbacks.add(getUsernameCallback);
	$.Base.logoutCallbacks.add(resetUsernameCallback);

	/**
	 * showing welcome information during header
	 * @param  {string} username [username returned by back-end when login]
	 * @return {none}       
	 * @author xuzhongyong
	 */
	$.Base.showWelcomeInfo = function () {

		if (undefined == username) {
			$.Base.hideWelcomeInfo();
			console.log("username is undefined. Hide welcome info directly");
			return $.Base.isShowingWelcome();
		}


		if ($.Base.isShowingWelcome()) {
			console.log("welcome info is already showing, update username only");
		}
		else{
			var tmpHtml;
			tmpHtml = 	"<div class=\"welcome-info\">" +
							"<span class=\"logout-span\">" + 
								"<a href=\"#\" id=\"logout\" title=\"End tpCamera journey?\" class=\"lang text\">Logout</a>" +
							"</span>" + 
							"<span id=\"username\" class=\"text\">" + "test" + "</span>" +
							"<span id=\"greetings\" class=\"lang text\">Welcome,&nbsp;</span>" +
						"</div>";
			$("#header .container .link").after(tmpHtml);
		}

		$("#header #username").text(username);

		return $.Base.isShowingWelcome();
	}

	/**
	 * [isShowingWelcome is used to help caller to find is currentlly showing welcome information]
	 * @return {Boolean} [returned true when currentlly showing the welcome information, otherwise false]
	 * @author xuzhongyong
	 */
	$.Base.isShowingWelcome = function (){
		var selector = WELCOME_INFO_SELECTOR;
		return $(selector).length > 0 && !$(selector).is(":hidden");
	}

	/**
	 * [hideWelcomeInfo hide welcome info]
	 * @return {none}
	 * @author xuzhongyong
	 */
	$.Base.hideWelcomeInfo = function () {
		// body...
		var selector = WELCOME_INFO_SELECTOR;
		$(selector).hide();
	}


})(jQuery);