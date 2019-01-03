(function(){
	var login = require("./login.js");


	var postget = require("./postget.js");
	var Complete = require("./complete.js");
	var periodItem = require("./period-item.js");
	var settings = require("./settings.js");
	window.addEventListener("load",function(){
		// Initialize Firebase
		var config = {
		  apiKey: "AIzaSyDZ3tU_ccASR1BzaSeN2NyAYUdEuwTsMUM",
		  authDomain: "expencsv.firebaseapp.com",
		  databaseURL: "https://expencsv.firebaseio.com",
		  projectId: "expencsv",
		  storageBucket: "expencsv.appspot.com",
		  messagingSenderId: "780194611024"
		};
		firebase.initializeApp(config);

		new Vue({
			el:"#app",
			data:{
				completePeriods: [],
				isMore:false,
				earliestDate:null,
				incompleteBeginningPeriods: [],
				incompleteEndingPeriods:[],
				incompletePeriods:[],
				errorMessage:undefined,
				fileName:undefined,
				settingsDirty:false,
				settingsSaved:false,
				loggedIn:false,
				loading:false,
				loggedInName:undefined,
				loadingStatus: new Complete()
			},
			components:{
				'period-item' : periodItem.build(document),
				'settings': settings.build(document)
			},
			mounted:function(){
				var self = this;
				login.onStateChanged(function(user){
					if (user) {
						self.loggedInName = user.displayName;
						self.refreshComplete();
						self.loggedIn = true;
					} else {
						self.loggedIn = false;
					}
				});
			},
			created:function(){
				var self = this;
				this.loadingStatus.onComplete(function(){self.loading = false;});
				this.loadingStatus.onIncomplete(function(){self.loading = true;})
			},
			computed:{
				earliestCompleteDate:function(){
					if(this.completePeriods.length == 0){
						return undefined;
					}
					return Math.min.apply(null, this.completePeriods.map(function(p){return p.file.from;}));
				}
			},
			methods:{
				signOut:function(){
          		console.log("signing out");
					firebase.auth().signOut();
				},
				setSettingsDirty:function(){
					this.settingsDirty = true;
				},
				setSettingsClean:function(){
					this.settingsDirty = false;
				},
				fileNameChange:function(){
					this.fileName = this.$refs.file.files[0].name;
				},
				loadMore:function(){
					var self = this;
					var loading = this.loadingStatus.getIncomplete();
					postget.doGet("/api/additional/"+this.earliestDate.toLocaleString("nl-NL",{year:"numeric",month:"numeric",day:"numeric"}),function(data){
						self.isMore = data.isMore;
						self.earliestDate = data.earliestDate;
						self.prependCompletePeriods(data.items);
						loading.complete();
					},function(msg){
						self.displayError(msg);
						loading.complete();
					});
				},
				refreshComplete:function(){
					var self = this;
					var loading = this.loadingStatus.getIncomplete();
					postget.doGet("/api/complete",function(data){
						self.isMore = data.isMore;
						self.earliestDate = data.earliestDate;
						self.addCompletePeriods(data.items);
						loading.complete();
					},function(msg){
						self.displayError(msg);
						loading.complete();
					});
				},
				onRemovePeriod:function(fileName){
					this.completePeriods = this.completePeriods.filter(function(p){return p.fileName !== fileName;});
				},
				periodComplement:function(plusPeriods, minusPeriods){
					return plusPeriods.filter(function(p){return !minusPeriods.some(function(pp){return p.fileName == pp.fileName;});});
				},
				addCompletePeriods:function(completePeriods){
					this.completePeriods = this.completePeriods.concat(this.periodComplement(completePeriods, this.completePeriods));
				},
				prependCompletePeriods:function(completePeriods){
					this.completePeriods = completePeriods.concat(this.completePeriods);
				},
				displayError:function(msg){
					this.errorMessage = msg || "Internal Server Error";
				},
				clearError:function(){
					this.errorMessage = undefined;
				},
				postCsv:function(){
					var files = this.$refs.file.files;
					if(files.length == 0){return;}
					var file = files[0];
					var self = this;
					var reader = new FileReader();
					var loading = this.loadingStatus.getIncomplete();
					reader.onload = function(){
						postget.doPost("/api/csv", reader.result, function(data){
							var complete = data.filter(function(p){return p.file.hasBeginning && p.file.hasEnd;});
							self.incompleteBeginningPeriods = data.filter(function(p){return p.file.hasBeginning && !p.file.hasEnd;});
							self.incompletePeriods = data.filter(function(p){return !p.file.hasBeginning && !p.file.hasEnd;});
							var incompleteEndingPeriods = data.filter(function(p){return !p.file.hasBeginning && p.file.hasEnd;});
							if(self.earliestCompleteDate){
								self.incompleteEndingPeriods = incompleteEndingPeriods.filter(function(p){return p.file.through < self.earliestCompleteDate;})
							}else{
								self.incompleteEndingPeriods = incompleteEndingPeriods;
							}
							self.addCompletePeriods(complete);
							self.$refs.file.value = "";
							self.fileName = "";
							loading.complete();
						},function(msg){
							self.displayError(msg);
							loading.complete();
						});
					};
					reader.readAsBinaryString(file);
				}
			}
		});
	})
})();