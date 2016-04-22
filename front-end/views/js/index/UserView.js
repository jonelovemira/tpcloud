define(['UserModel', 'jquery', 'jquery.scrollLoading', 'jquery.checkbox'], function (UserModel, $) {
    function UserView() {
        this.model = null;
    };

    UserView.prototype = {
        constructor: UserView,
        tipsTimeoutObj: null,
        renderLoginError: function(errorTips) {
            if (undefined == errorTips) {
                console.error("args error in showLoginError");
            };

            this.clearPasswordInput();
            this.showTips(errorTips);
        },
        showTips: function(displayTips) {
            if (undefined == displayTips) {
                console.error("args error in showTips");
                return;
            };

            this.hideTips();

            var handel = "#Account";
            var top = -39;
            var left = 0;
            var text = displayTips;
            text = text || "Please chech up your enter without illegal";
            var a = "";
            a += "<div id='warningtips'>";
            a += "<span class='declare'>" + text + "</span>"
            a += "<span class='closetips'></span>"
            a += "</div>";
            $(handel).parent().append(a);
            $("#warningtips").css({
                top: top,
                left: left
            });

            this.tipsTimeoutObj = setTimeout("$('#warningtips').fadeOut('slow')", 5000);
        },
        hideTips: function() {
            $("#warningtips").remove();
            clearTimeout(this.tipsTimeoutObj);
        },
        clearPasswordInput: function() {
            $("#Password").val("");
        },
        renderInitRememberMe: function() {
            if (this.model.rememberMe && this.model.account) {
                var rememberMe = this.model.rememberMe == true ? true : false;
                rememberMe && !$("input.checkbox[name=remember]").is(":checked") && $("#remember").click();
                $("#Account").val(this.model.account);
                $("#Password").focus().select();
                $("#account-cover").hide();
                $("#password-cover").hide();
            }
        },
        init: function () {
            var initScrollLoading = function(){
                $(".loadingImg").scrollLoading();
            };

            $(function() {
                $(".checkbox").each(function() {
                    $(this).Checkbox();
                });
            });

            initScrollLoading();

            $("#floattitle-list .titlelist-cell").click(function() {
                var index = $(this).index()/2;
                
                if( index == 0 ){
                    $(".sectionmain").show();
                    $(".section_product_information").hide();
                    $(".section_cloud").hide();
                }
                if( index == 1 ){
                    $(".section_product_information").show();
                    $(".section_cloud").hide();
                    $(".sectionmain").hide();
                }
                if( index == 2 ){
                    $(".section_cloud").show();
                    $(".section_product_information").hide();
                    $(".sectionmain").hide();
                }

                $(".titlelist-cell").removeClass("titlelist-cell-select");
                $(this).addClass("titlelist-cell-select");
            });

            var backtotop = function()
            {
                var $window = $(window),$target = $("#backtop");
                $window.scroll(function() {
                    if ($window.scrollTop() > 200 && $target.css("display") == "none") {
                        $target.css("display", "block");
                    } else if ($window.scrollTop() == 0) {
                        $target.css("display", "none");
                    }
                });
                $target.click(function() {
                    $('html,body').animate({
                        scrollTop: 0
                    }, '500');
                });
            }
            backtotop();

            $("#account-cover").on('click', function(){
                $(this).hide();
                $("#Account").focus();
            });

            $("#Account").on('focus', function() {
                $("#account-cover").hide();
            });

            $("#Account").on('blur', function() {
                $("#account-cover").toggle(!$("#Account").val());
            });

            $("#Account").on('change', function() {
                $("#account-cover").hide();
                $("#Password").focus();
            });
            

            $("#password-cover").on('click', function() {
                $(this).hide();
                $("#Password").focus();
            });

            $("#Password").on('focus', function() {
                $("#password-cover").hide();
            });
            $("#Password").on('change', function() {
                $("#password-cover").hide();
            });
            $("#Password").on('blur', function() {
                $("#password-cover").toggle(!$("#Password").val());
            });
        }
    }

    return UserView;
});