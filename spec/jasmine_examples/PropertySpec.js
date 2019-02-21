describe("Amount property", function(){
	var AmountProperty = require('../../js/settings-logic/amount-property.js');
	var instance = new AmountProperty({columnIndex:0});

	it("should have type amount", function(){
		expect(instance.type).toEqual("amount");
	});
})