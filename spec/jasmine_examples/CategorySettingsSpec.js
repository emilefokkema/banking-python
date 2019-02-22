describe("Category settings", function(){
	var CategorySettings = require("../../js/settings-logic/category-settings.js");
	var RowDefinition = require('../../js/settings-logic/row-definition.js');
	var getDefaultSettingsData = require("./getDefaultSettingsData.js");
	var categoryName = "category";
	var nameOfPropertyToUse = "property";
	var expectedSerialization = "{\"name\":\""+categoryName+"\",\"categories\":[]}";
	var expectedSerializationWithChild = "{\"name\":\""+categoryName+"\",\"categories\":[{\"name\":\""+categoryName+"\",\"categories\":[]}]}";
	var expectedSerializationWithChildThatFiltersOnPropertyContains = "{\"name\":\""+categoryName+"\",\"categories\":[{\"name\":\""+categoryName+"\",\"categories\":[],\"acceptRow\":{\"propertyContains\":{\"name\":\""+nameOfPropertyToUse+"\",\"values\":[]}}}]}";
	var rowDefinition;
	var propertyToUse;
	var instance;

	beforeEach(function(){
		var defaultSettingsData = getDefaultSettingsData();
		rowDefinition = new RowDefinition(defaultSettingsData.rowDefinition);
		propertyToUse = rowDefinition.getNewDefinition(3);
		propertyToUse.name = nameOfPropertyToUse;
		instance = new CategorySettings({name:categoryName}, rowDefinition);
	});

	it("should be serializable", function(){
		expect(JSON.stringify(instance)).toBe(expectedSerialization);
	});

	it("should not be using the property", function(){
		expect(instance.usesProperty(propertyToUse)).toBe(false);
	});

	describe("with a child category", function(){
		var childInstance;

		beforeEach(function(){
			childInstance = instance.getNewCategory();
			childInstance.name = categoryName;
			instance.addCategory(childInstance);
		});

		it("should be serializable", function(){
			expect(JSON.stringify(instance)).toBe(expectedSerializationWithChild);
		});

		it("should be removable", function(){
			instance.removeCategory(childInstance);
			expect(JSON.stringify(instance)).toBe(expectedSerialization);
		});

		it("can override oncePerPeriod", function(){
			expect(childInstance.onceOverridden).toBe(false);
			expect(instance.onceOverridden).toBe(false);

			instance.oncePerPeriod = true;
			expect(childInstance.onceOverridden).toBe(true);
			expect(instance.onceOverridden).toBe(false);

			instance.oncePerPeriod = false;
			expect(childInstance.onceOverridden).toBe(false);
			expect(instance.onceOverridden).toBe(false);
		});


		describe("that filters", function(){

			beforeEach(function(){
				childInstance.toggleFilter();
			});

			it("should be using the property", function(){
				expect(instance.usesProperty(propertyToUse)).toBe(true);
			});

			it("should be serializable", function(){
				expect(JSON.stringify(instance)).toBe(expectedSerializationWithChildThatFiltersOnPropertyContains);
			});
		});

		describe("that is once per period", function(){

			beforeEach(function(){
				childInstance.oncePerPeriod = true;
			});

			it("should override oncePerPeriod for parent", function(){
				expect(instance.onceOverridden).toBe(true);
			});

			it("should free oncePerPeriod for parent if it is removed", function(){
				instance.removeCategory(childInstance);
				expect(instance.onceOverridden).toBe(false);
			});
		});

	});

});