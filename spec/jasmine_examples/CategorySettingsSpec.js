describe("Category settings", function(){
	var expectedSerialization = require("./expected-serialization.js");
	var CategorySettings = require("../../js/settings-logic/category-settings.js");
	var RowDefinition = require('../../js/settings-logic/row-definition.js');
	var getDefaultSettingsData = require("./getDefaultSettingsData.js");
	var categoryName = "category";
	var nameOfPropertyToUse = "property";
	var rowDefinition;
	var propertyToUse;
	var instance;
	var getExpectedSerialization;
	var checkSerialization = function(){
		it("should be serializable", function(){
			expect(JSON.stringify(instance)).toBe(getExpectedSerialization());
		});
	};

	beforeEach(function(){
		var defaultSettingsData = getDefaultSettingsData();
		rowDefinition = new RowDefinition(defaultSettingsData.rowDefinition);
		propertyToUse = rowDefinition.getNewDefinition(3);
		propertyToUse.name = nameOfPropertyToUse;
		instance = new CategorySettings({name:categoryName}, rowDefinition);
		getExpectedSerialization = expectedSerialization.category(categoryName);
	});

	checkSerialization();

	it("should not be using the property", function(){
		expect(instance.usesProperty(propertyToUse)).toBe(false);
	});

	describe("with a child category", function(){
		var childInstance;

		beforeEach(function(){
			childInstance = instance.getNewCategory();
			childInstance.name = categoryName;
			instance.addCategory(childInstance);
			getExpectedSerialization = getExpectedSerialization.withChild(categoryName);
		});

		checkSerialization();

		it("should be removable", function(){
			instance.removeCategory(childInstance);
			expect(JSON.stringify(instance)).toBe(getExpectedSerialization.parent());
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
				getExpectedSerialization = getExpectedSerialization.thatFiltersOnPropertyContains(nameOfPropertyToUse);
			});

			it("should be using the property", function(){
				expect(instance.usesProperty(propertyToUse)).toBe(true);
			});

			checkSerialization();

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
					getExpectedSerialization = getExpectedSerialization.parent.thatFiltersOnPropertyMatches(nameOfPropertyToUse)
				});

				it("should be using the property", function(){
					expect(instance.usesProperty(propertyToUse)).toBe(true);
				});

				checkSerialization();

				it("should remember the current filter after a toggle off", function(){
					childInstance.toggleFilter();
					expect(JSON.stringify(instance)).toBe(getExpectedSerialization.parent());
					childInstance.toggleFilter();
					expect(JSON.stringify(instance)).toBe(getExpectedSerialization());
				});
			});
		});

		describe("that collects rows using a property", function(){
			var collectedProperty;

			beforeEach(function(){
				childInstance.addRowCollection();
				collectedProperty = childInstance.rowCollection.properties[0];
				getExpectedSerialization = getExpectedSerialization.thatCollectsRows(nameOfPropertyToUse);
			});

			it("should be using the property", function(){
				expect(instance.usesProperty(propertyToUse)).toBe(true);
			});

			it("should have a row collection property", function(){
				expect(collectedProperty).toBeTruthy();
			});

			checkSerialization();

			it("should stop collecting rows if the one property is removed", function(){
				collectedProperty.remove();
				expect(JSON.stringify(instance)).toBe(getExpectedSerialization.parent());
			});

			describe("and now this property", function(){

				it("should not have a conversion", function(){
					expect(collectedProperty.conversion).toBeFalsy();
				});

				it("should have targetType string", function(){
					expect(collectedProperty.targetType).toBe("string");
				});

				describe("if it is given a stringMatch", function(){

					beforeEach(function(){
						collectedProperty.stringMatch = "\\d+";
					});

					it("should have targetType string", function(){
						expect(collectedProperty.targetType).toBe("string");
					});

					it("should have a stringMatch", function(){
						expect(collectedProperty.stringMatch).toBe("\\d+");
					});

					it("should have no conversion if stringMatch is removed", function(){
						collectedProperty.stringMatch = null;
						expect(collectedProperty.conversion).toBeFalsy();
					});

				});

				describe("if its targetType is set to 'date'", function(){

					beforeEach(function(){
						collectedProperty.targetType = "date";
						getExpectedSerialization = getExpectedSerialization.usingAPropertyWithDateConversion()
					});

					it("should have targetType 'date'", function(){
						expect(collectedProperty.targetType).toBe("date");
					});

					it("should have a date conversion", function(){
						expect(collectedProperty.conversion).toBeTruthy();
						expect(collectedProperty.conversion.type).toBe("date");
						expect(collectedProperty.conversion.pattern).toBe("%Y%m%d");
					});

					checkSerialization();

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