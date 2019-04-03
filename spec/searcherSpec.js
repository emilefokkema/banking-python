describe("A searcher", function(){
	var Searcher = require("../js/searcher");
	var instance;

	beforeEach(function(){
		instance = new Searcher();
	});

	describe("that is subscribed to", function(){
		var onSearchHandler;
		var onNoResultHandler;
		var onResultHandler;
		var searchPhrase;

		beforeEach(function(){
			searchPhrase = "phrase";
			onSearchHandler = function(){};
			onNoResultHandler = function(){};
			onResultHandler = function(){};
			instance.onSearch.add(function(context){
				onSearchHandler(context);
			});
			instance.onNoResult.add(function(){
				onNoResultHandler();
			});
			instance.onResult.add(function(context){
				onResultHandler(context);
			});
		});

		it("should pass a context to onSearch when searching", function(){
			onSearchHandler = function(context){
				expect(context).toBeTruthy();
			};
			instance.search(searchPhrase);
		});

		it("should call onNoResult after searching", function(){
			var called = false;
			onNoResultHandler = function(){called = true;};
			instance.search(searchPhrase);
			expect(called).toBe(true);
		});

		it("should not call onResult after searching", function(){
			var called = false;
			onResultHandler = function(){called = true;};
			instance.search(searchPhrase);
			expect(called).toBe(false);
		});

		it("should be able to split up a string when searching", function(){
			var split, nonMatchingPart = "other";
			onSearchHandler = function(context){
				split = context.subdivide(searchPhrase + nonMatchingPart);
			};
			instance.search(searchPhrase);
			expect(split).toEqual([
				{match:true, text: searchPhrase},
				{match:false, text: nonMatchingPart}
			]);
		});

		describe("and that is given a result when searching", function(){
			var showResult, forgetResult, otherSearchPhrase = "other";

			beforeEach(function(){
				showResult = function(){};
				forgetResult = function(){};
				onSearchHandler = function(context){
					context.addResult({
						show:function(){showResult();},
						forget:function(){forgetResult();}
					});
				};
			});

			it("should call onResult when searching", function(){
				var called = false;
				onResultHandler = function(){called = true;};
				instance.search(searchPhrase);
				expect(called).toBe(true);
			});

			it("should not call onNoResult after searching", function(){
				var called = false;
				onNoResultHandler = function(){called = true;};
				instance.search(searchPhrase);
				expect(called).toBe(false);
			});

			it("should forget the result when stopping the search", function(){
				var called = false;
				forgetResult = function(){called = true;};
				instance.search(searchPhrase);
				instance.stopSearch();
				expect(called).toBe(true);
			});

			it("should forget the result when searching for something else", function(){
				var called = false;
				forgetResult = function(){called = true;};
				instance.search(searchPhrase);
				onSearchHandler = function(){};
				instance.search(otherSearchPhrase);
				expect(called).toBe(true);
			});
		});
	});
});