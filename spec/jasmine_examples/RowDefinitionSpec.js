describe("Row definition", function(){
	var RowDefinition = require('../../js/settings-logic/row-definition.js');
	var defaultSettingsData = require("./defaultSettingsData.js");
	var instance;

	beforeEach(function(){
		instance = new RowDefinition(defaultSettingsData.rowDefinition);
	});

	it("should have max column index", function(){
		expect(instance.maxColumnIndex).toEqual(2);
	});

	it("should have default columns", function(){
		expect(instance.getDefinitionAtIndex(0).type).toBe("date");
		expect(instance.getDefinitionAtIndex(1).type).toBe("direction");
		expect(instance.getDefinitionAtIndex(2).type).toBe("amount");
	});

	describe("a newly created column", function(){
		var indexOfNewColumn = 3;
		var newColumn;

		beforeEach(function(){
			newColumn = instance.getNewDefinition(indexOfNewColumn);
		});

		it("should be nameless and of type 'string'",function(){
			expect(newColumn.name).toBe(undefined);
			expect(newColumn.type).toBe("string");
		});

		it("should not be added yet",function(){
			expect(instance.maxColumnIndex).toEqual(2);
			expect(instance.getDefinitionAtIndex(indexOfNewColumn)).toBe(undefined);
		});

		it("cannot be given certain names",function(){
			expect(function(){
				newColumn.name = "amount";
			}).toThrow();
			expect(function(){
				newColumn.name = "date";
			}).toThrow();
			expect(function(){
				newColumn.name = "direction";
			}).toThrow();
		});

		describe("when it is given a name",function(){
			var newName = "something";

			beforeEach(function(){
				newColumn.name = newName;
			});

			it("should be added",function(){
				expect(instance.maxColumnIndex).toEqual(indexOfNewColumn);
				expect(instance.getDefinitionAtIndex(indexOfNewColumn)).toBe(newColumn);
				expect(newColumn.name).toBe(newName);
			});

			describe("when the name is cleared",function(){

				beforeEach(function(){
					newColumn.name = undefined;
				});

				it("should be removed", function(){
					expect(instance.maxColumnIndex).toEqual(2);
					expect(instance.getDefinitionAtIndex(indexOfNewColumn)).toBe(undefined);
				});
			});
		});

	});
})