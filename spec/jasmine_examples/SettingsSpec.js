describe("Settings", function(){
	var expectedSerialization = require("./expected-serialization.js");
	var Settings = require("../../js/settings-logic/settings-logic.js");
	var getDefaultSettingsData = require("./getDefaultSettingsData.js");
	var instance, incoming, outgoing;
	var getExpectedSerialization;
	var makeNewCategoryAndAppendToParent = function(parent, name){
		var result = parent.getNewCategory();
		result.name = name;
		parent.addCategory(result);
		return result;
	};
	var checkSerialization = function(){
		it("should be serializable", function(){
			expect(JSON.stringify(instance)).toBe(getExpectedSerialization());
		});
	};

	beforeEach(function(){
		getExpectedSerialization = expectedSerialization.settings();
		instance = new Settings(getDefaultSettingsData());
		incoming = instance.categories.incoming;
		outgoing = instance.categories.outgoing;
	});

	it("should be there", function(){
		expect(instance).toBeTruthy();
	});

	checkSerialization();

	it("should have two categories", function(){
		expect(incoming).toBeTruthy();
		expect(outgoing).toBeTruthy();
	});

	describe("whose outgoing has a descendant category", function(){
		var newCategory, nameOfNewCategory = "category";

		beforeEach(function(){
			newCategory = makeNewCategoryAndAppendToParent(outgoing, nameOfNewCategory);
			getExpectedSerialization = getExpectedSerialization.whereOutgoingHasAChildCategory(nameOfNewCategory);
		});

		checkSerialization();

		describe("that is once per period", function(){

			beforeEach(function(){
				newCategory.oncePerPeriod = true;
			});

			it("should have onceOverridden on other categories", function(){
				expect(outgoing.onceOverridden).toBe(true);
				expect(incoming.onceOverridden).toBe(true);
			});
		});

		describe("that uses an additional property", function(){
			var propertyInUse, nameOfUsedProperty = "property";

			beforeEach(function(){
				propertyInUse = instance.rowDefinition.getNewDefinition(3);
				propertyInUse.name = nameOfUsedProperty;
				newCategory.toggleFilter();
			});

			it("the property should be in use", function(){
				expect(propertyInUse.inUse).toBe(true);
			});
		});

		describe("that has siblings", function(){
			var newCategory2,
				nameOfNewCategory2 = "category2",
				newCategory3,
				nameOfNewCategory3 = "category3";

			beforeEach(function(){
				newCategory2 = makeNewCategoryAndAppendToParent(outgoing, nameOfNewCategory2);
				newCategory3 = makeNewCategoryAndAppendToParent(outgoing, nameOfNewCategory3);
				getExpectedSerialization = getExpectedSerialization.parent.whereOutgoingHasThreeChildCategories(nameOfNewCategory, nameOfNewCategory2, nameOfNewCategory3);
			});

			checkSerialization();

			it("now the last can be inserted before the first", function(){
				instance.insertCategoryBefore(newCategory3, newCategory);
				expect(JSON.stringify(instance)).toBe(getExpectedSerialization.parent.whereOutgoingHasThreeChildCategories(nameOfNewCategory3, nameOfNewCategory, nameOfNewCategory2)());
			});
		});
	});
});