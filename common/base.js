(function($){

	/**
	 * [Base class for control base template]
	 * @author xuzhongyong
	 */
	$.BaseController = function(){
	}

	$.BaseController.defaults = {
		username : "tplink-account"
	}

	/**
	 * global variables
	 * callback for register handler when login and logout
	 * username for save user data
	 * WELCOME_INFO_SELECTOR for selector configuration
	 * @author xuzhongyong
	 */
	$.BaseController.loginCallbacks = $.Callbacks();
	$.BaseController.logoutCallbacks = $.Callbacks();
	var username = $.cookie("username") || $.BaseController.defaults.username;
	var WELCOME_INFO_SELECTOR = "#header .welcome-info";

	function getUsername(){

	}

	function clearUsername () {
	}

	/**
	 * [
	 * getUsernameCallback preserve username when logged in
	 * resetUsernameCallback clear saved username
	 * ]
	 * @param  {string} name
	 * @author xuzhongyong
	 */
	var loginHandler = function(){
		// username = name;
		getUsername();
	}
	var logoutHandler = function () {
		// body...
		// username = undefined;
		clearUsername();
	}

	/**
	 * register callbacks for login and logout
	 */
	$.BaseController.loginCallbacks.add(loginHandler);
	$.BaseController.logoutCallbacks.add(logoutHandler);

	/**
	 * showing welcome information during header
	 * @param  {string} username [username returned by back-end when login]
	 * @return {none}       
	 * @author xuzhongyong
	 */
	$.BaseController.showWelcomeInfo = function () {

		if (undefined == username) {
			$.BaseController.hideWelcomeInfo();
			console.log("username is undefined. Hide welcome info directly");
			return $.BaseController.isShowingWelcome();
		}


		if ($.BaseController.isShowingWelcome()) {
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

		return $.BaseController;
	}

	/**
	 * [isShowingWelcome is used to help caller to find is currentlly showing welcome information]
	 * @return {Boolean} [returned true when currentlly showing the welcome information, otherwise false]
	 * @author xuzhongyong
	 */
	$.BaseController.isShowingWelcome = function (){
		var selector = WELCOME_INFO_SELECTOR;
		return $(selector).length > 0 && !$(selector).is(":hidden");
	}

	/**
	 * [hideWelcomeInfo hide welcome info]
	 * @return {none}
	 * @author xuzhongyong
	 */
	$.BaseController.hideWelcomeInfo = function () {
		// body...
		var selector = WELCOME_INFO_SELECTOR;
		$(selector).hide();
		return $.BaseController;
	}

	

				
})(jQuery);