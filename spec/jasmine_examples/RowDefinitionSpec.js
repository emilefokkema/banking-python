describe("Row definition", function(){
	var RowDefinition = require('../../js/settings-logic/row-definition.js');
	var instance;

	beforeEach(function(){
		instance = new RowDefinition({
			amount:{
				columnIndex:2
			},
			date:{
				columnIndex:0,
				pattern:"yyyymmdd"
			},
			direction:{
				columnIndex:1,
				incoming:"Credit",
				outgoing:"Debit"
			},
			additional:[
			]
		});
	});

	it("should have max column index", function(){
		expect(instance.maxColumnIndex).toEqual(2);
	});
})