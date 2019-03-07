describe("Settings", function(){
	var expectedSerialization = require("./expected-serialization.js");
	var Settings = require("../../js/settings-logic/settings-logic.js");
	var getDefaultSettingsData = require("./getDefaultSettingsData.js");
	var instance, incoming, outgoing;
	var getExpectedSerialization;

	beforeEach(function(){
		getExpectedSerialization = expectedSerialization.settings();
		instance = new Settings(getDefaultSettingsData());
		incoming = instance.categories.incoming;
		outgoing = instance.categories.outgoing;
	});

	it("should be there", function(){
		expect(instance).toBeTruthy();
	});

	it("should serialize correctly", function(){
		expect(JSON.stringify(instance)).toBe(getExpectedSerialization());
	});

	it("should have two categories", function(){
		expect(incoming).toBeTruthy();
		expect(outgoing).toBeTruthy();
	});

	describe("whose outgoing has a descendant category", function(){
		var newCategory;

		beforeEach(function(){
			newCategory = outgoing.getNewCategory();
			newCategory.name = "category";
			outgoing.addCategory(newCategory);
		});

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
	});
});