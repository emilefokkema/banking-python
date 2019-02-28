describe("Category settings", function(){
	var CategorySettings = require("../../js/settings-logic/category-settings.js");
	var RowDefinition = require('../../js/settings-logic/row-definition.js');
	var getDefaultSettingsData = require("./getDefaultSettingsData.js");
	var categoryName = "category";
	var nameOfPropertyToUse = "property";
	var expectedSerialization = "{\"name\":\""+categoryName+"\",\"categories\":[]}";
	var expectedSerializationWithChild = "{\"name\":\""+categoryName+"\",\"categories\":[{\"name\":\""+categoryName+"\",\"categories\":[]}]}";
	var expectedSerializationWithChildThatFiltersOnPropertyContains = "{\"name\":\""+categoryName+"\",\"categories\":[{\"name\":\""+categoryName+"\",\"categories\":[],\"acceptRow\":{\"propertyContains\":{\"name\":\""+nameOfPropertyToUse+"\",\"values\":[]}}}]}";
	var expectedSerializationWithChildThatFiltersOnPropertyMatches = "{\"name\":\""+categoryName+"\",\"categories\":[{\"name\":\""+categoryName+"\",\"categories\":[],\"acceptRow\":{\"propertyMatches\":{\"name\":\""+nameOfPropertyToUse+"\"}}}]}";
	var expectedSerializationWithChildThatCollectsRows = "{\"name\":\""+categoryName+"\",\"categories\":[{\"name\":\""+categoryName+"\",\"categories\":[],\"rowCollection\":{\"properties\":[{\"name\":\""+nameOfPropertyToUse+"\",\"source\":\""+nameOfPropertyToUse+"\"}]}}]}";
	var expectedSerializationWithChildThatCollectsRowsUsingAPropertyWithDateConversion = "{\"name\":\""+categoryName+"\",\"categories\":[{\"name\":\""+categoryName+"\",\"categories\":[],\"rowCollection\":{\"properties\":[{\"name\":\""+nameOfPropertyToUse+"\",\"source\":\""+nameOfPropertyToUse+"\",\"conversion\":{\"type\":\"date\",\"pattern\":\"%Y%m%d\"}}]}}]}";
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

			describe("on a different property", function(){
				var differentPropertyName = "other";

				beforeEach(function(){
					childInstance.acceptRow.propertyContains.name = differentPropertyName;
				});

				it("should not be using the property", function(){
					expect(instance.usesProperty(propertyToUse)).toBe(false);
				});

				it("should remember the current filter after a switch", function(){
					childInstance.filterByPropertyMatches();
					expect(function(){
						var name = childInstance.acceptRow.propertyContains.name;
					}).toThrow();
					childInstance.filterByPropertyContains();
					expect(childInstance.acceptRow.propertyContains.name).toBe(differentPropertyName);
				});

				it("should remember the current filter after a toggle off", function(){
					childInstance.toggleFilter();
					expect(function(){
						var name = childInstance.acceptRow.propertyContains.name;
					}).toThrow();
					childInstance.toggleFilter();
					expect(childInstance.acceptRow.propertyContains.name).toBe(differentPropertyName);
				});

			});

			describe("on property matches", function(){

				beforeEach(function(){
					childInstance.filterByPropertyMatches();
				});

				it("should be using the property", function(){
					expect(instance.usesProperty(propertyToUse)).toBe(true);
				});

				it("should be serializable", function(){
					expect(JSON.stringify(instance)).toBe(expectedSerializationWithChildThatFiltersOnPropertyMatches);
				});

				it("should remember the current filter after a toggle off", function(){
					childInstance.toggleFilter();
					expect(JSON.stringify(instance)).toBe(expectedSerializationWithChild);
					childInstance.toggleFilter();
					expect(JSON.stringify(instance)).toBe(expectedSerializationWithChildThatFiltersOnPropertyMatches);
				});
			});
		});

		describe("that collects rows using a property", function(){
			var collectedProperty;

			beforeEach(function(){
				childInstance.addRowCollection();
				collectedProperty = childInstance.rowCollection.properties[0];
			});

			it("should be using the property", function(){
				expect(instance.usesProperty(propertyToUse)).toBe(true);
			});

			it("should have a row collection property", function(){
				expect(collectedProperty).toBeTruthy();
			});

			it("should be serializable", function(){
				expect(JSON.stringify(instance)).toBe(expectedSerializationWithChildThatCollectsRows);
			});

			it("should stop collecting rows if the one property is removed", function(){
				collectedProperty.remove();
				expect(JSON.stringify(instance)).toBe(expectedSerializationWithChild);
			});

			describe("and now this property", function(){

				it("should not have a conversion", function(){
					expect(collectedProperty.conversion).toBeFalsy();
				});

				it("should have targetType string", function(){
					expect(collectedProperty.targetType).toBe("string");
				});

				describe("if its targetType is set to 'date'", function(){

					beforeEach(function(){
						collectedProperty.targetType = "date";
					});

					it("should have targetType 'date'", function(){
						expect(collectedProperty.targetType).toBe("date");
					});

					it("should have a date conversion", function(){
						expect(collectedProperty.conversion).toBeTruthy();
						expect(collectedProperty.conversion.type).toBe("date");
						expect(collectedProperty.conversion.pattern).toBe("%Y%m%d");
					});

					it("should be serializable", function(){
						expect(JSON.stringify(instance)).toBe(expectedSerializationWithChildThatCollectsRowsUsingAPropertyWithDateConversion);
					});

					describe("and then back to 'string'", function(){

						beforeEach(function(){
							collectedProperty.targetType = "string";
						});

						it("should not have a conversion", function(){
							expect(collectedProperty.conversion).toBeFalsy();
						});
					});
				});
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