/* Based off http://onehackoranother.com/projects/jquery/jquery-grab-bag/text-effects.html */
function randomAlphaNum() {
	var rnd = Math.floor(Math.random() * 62);
	if (rnd >= 52) return String.fromCharCode(rnd - 4);
	else if (rnd >= 26) return String.fromCharCode(rnd + 71);
	else return String.fromCharCode(rnd + 65);
}

$.fn.scrambledWriter = function() {
	this.each(function() {
		var $ele = $(this), str = $ele.text(), progress = -40, replace = /[^\s]/g,
			random = randomAlphaNum, inc = 1;
		$ele.height($("#voting-label").height());
		$ele.text(str.replace(replace, random));
		var timer = setInterval(function() {
			$ele.text(str.substring(0, Math.max(0, progress)) + str.substring(Math.max(0, progress), str.length).replace(replace, random));
			if (progress >= str.length + inc) {
				clearInterval(timer);
				clearInterval(revealtimer);
				$ele.height("");
			}
		}, 20);
		var revealtimer = setInterval(function() {
			progress += inc
		}, Math.min(80, 4000/str.length));
	});
	return this;
};


var gui = require('nw.gui');

var results, currentcat, control;

$.getJSON("http://chatrealm.us/awards/results/2012winners/json", function (data) {
	results = data;
	$("#categories").html(Mustache.render('{{#categories}}<li data-id="{{id}}">{{text}}</li>{{/categories}}', results));
	$("#categories li").hide()

	control = gui.Window.open('controller.html', {
		width: 400,
		height: 450
	});
	$(window).unload(function () {control.close()});
	control.on("loaded", function () {
		$("#categories", global.controller.document).html(Mustache.render('{{#categories}}<li><input type="checkbox" class="cat-show" data-id="{{id}}" checked="checked" /><a href="#" data-id="{{id}}" class="cat-activate">{{text}}</a></li>{{/categories}}', results));
		$("#cats-show", global.controller.document).click(function () {
			$("#categories li").show()
			return false;
		});
		$("#cats-hide", global.controller.document).click(function () {
			$("#categories li").hide()
			return false;
		});
		$("#cats-show-anim", global.controller.document).click(function () {
			$("#categories li").hide()
			$("#categories li").each(function () {
				var $target = $(this);
				$("#categories").queue(function (next) {
					$target.addClass("jqanim").show("drop", 1500).effect("highlight", 300, function () {
						$target.removeClass("jqanim")
					});
					setTimeout(next, 400);
				})
			})
			return false;
		});
		$(".cat-activate", global.controller.document).click(function () {
			show($(this).data("id"))
			return false;
		});
		$(".cat-show", global.controller.document).change(function () {
			if(this.checked) {
				$("#categories li[data-id="+$(this).data("id")+"]").removeClass("faded")
			} else {
				$("#categories li[data-id="+$(this).data("id")+"]").addClass("faded")
			}
		});
		$("#current-clear", global.controller.document).click(function () {
			clearer()
			return false;
		});
		$("#current-reveal", global.controller.document).click(function () {
			reveal()
			return false;
		});
		$("#current-next", global.controller.document).click(function () {
			$("#content").dequeue()
			return false;
		});
	})
});
function clearer() {
	$("#content").clearQueue().hide("puff", 1000, function () {
		$(this).html()
	});
	$("#current-cat", global.controller.document).text("")
	$("#categories .active").removeClass("active")
	$("#categories").removeClass("offhide")
	$("#content").removeClass("full")
	currentcat = null
}
function show (categoryid) {
	clearer();
	$.each(results.categories, function (index, value) {
		if(value.id == categoryid) {
			currentcat = value
			return false;
		}
	});
	$("#categories li[data-id="+categoryid+"]").addClass("active")
	setTimeout(function () {
		$("#current-cat", global.controller.document).text(currentcat.text)
	}, 1000);
	setTimeout(function () {
		$("#content").show().html(Mustache.render(Mustache.render('<div id="title"><h4 id="award">The {{award}} award for</h4><h3 id="category">{{text}}</h3></div><div id="nominees"></div>', currentcat)))
		$("#award").hide().show("fade", 2000)
		$("#category").show("fade", 1000).scrambledWriter()
		$("#categories").addClass("offhide")
		$("#content").addClass("full")

		$("#content").queue(function (next) {
			// Dummy waiting
		}).queue(function (next) {
			$("#title").addClass("smaller")
		})
		$.each(currentcat.nominees, function (index, nominee) {
			var $el = $(Mustache.render('<div class=\"vote\" data-nominee=\"{{id}}\"><img src=\"{{image}}\" /><div class=\"vote-text\"><span class=\"vote-btn\" data-nominee=\"{{id}}\">?%</span><h4>{{text}}</h4></div></div>', nominee))
			$el.hide()
			$("#nominees").append($el)
			$("#content").queue(function (next) {
				$el.show("fade", 1000)
			});
		});
		$("#content").queue(function (next) {
			$("#title, #nominees").addClass("reposed")
			setTimeout(function () {
				next()
				$("body").animate({"background-color": "rgba(0, 0, 0, 0.1)"}).animate({"background-color": "transparent"})
			}, 1000);
		});
	}, 2000);
}
function reveal() {
	$("#title, #nominees").removeClass("reposed")
	$(".cat-show[data-id="+currentcat.id+"]", global.controller.document).removeAttr("checked").change()
	setTimeout(function () {
		var winner = 0, wincount = 0;
		$.each(currentcat.nominees, function (index, nominee) {
			var percentage = nominee.count / currentcat.total * 100
			var percenttxt = percentage.toString().substring(0, 5) + "%"
			$(".vote-btn[data-nominee="+nominee.id+"]").text(percenttxt).scrambledWriter()
			if(wincount < nominee.count) {
				winner = nominee.id
				wincount = nominee.count
			}
		});
		$("#content").queue(function (next) {
			// Dummy waiting
		}).queue(function (next) {
			$(".vote[data-nominee!="+winner+"]").animate({opacity: 0.2});
		}).queue(function (next) {
			$("#content").removeClass("full")
			$("#categories").removeClass("offhide")
		});

	}, 2000);
}