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
		var searchPhrase = "phrase";

		beforeEach(function(){
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

		describe("and that has searched and found two results", function(){
			var show1Spy, show2Spy, blur1Spy, blur2Spy, context;

			beforeEach(function(){
				var result1 = {show:function(){}, forget:function(){}, blur:function(){}};
				var result2 = {show:function(){}, forget:function(){}, blur:function(){}};
				show1Spy = spyOn(result1, 'show');
				show2Spy = spyOn(result2, 'show');
				blur1Spy = spyOn(result1, 'blur');
				blur2Spy = spyOn(result2, 'blur');
				onSearchHandler = function(_context){
					_context.addResult(result1);
					_context.addResult(result2);
				};
				onResultHandler = function(_context){
					context = _context;
				};
				instance.search(searchPhrase);
			});

			describe("and whose context moves down one result", function(){

				beforeEach(function(){
					context.moveDown();
				});

				it("should call show on the first result", function(){
					expect(show1Spy).toHaveBeenCalled();
				});
			});

			describe("and whose context moves down two results", function(){

				beforeEach(function(){
					context.moveDown();
					context.moveDown();
				});

				it("should call blur on the first result", function(){
					expect(blur1Spy).toHaveBeenCalled();
				});

				it("should call show on the second result", function(){
					expect(show2Spy).toHaveBeenCalled();
				});

				describe("and then up one result", function(){

					beforeEach(function(){
						context.moveUp();
					});

					it("should call blur on the second result", function(){
						expect(blur2Spy).toHaveBeenCalled();
					});
				});
			});
		});

		describe("and that is given a result when searching", function(){
			var forgetResult, otherSearchPhrase = "other";

			beforeEach(function(){
				forgetResult = function(){};
				onSearchHandler = function(context){
					context.addResult({
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