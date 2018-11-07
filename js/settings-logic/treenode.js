module.exports = (function(){
	var TreeNode = function(){
		Object.defineProperty(this, 'children', {value:[]});
	};
	TreeNode.prototype.add = function(n, blockReciprocate){
		this.children.push(n);
		if(!blockReciprocate){
			n.add(this, true);
		}
	};
	TreeNode.prototype.some = function(predicate, except){
		if(predicate(this)){
			return true;
		}
		for(var i=0;i<this.children.length;i++){
			var child = this.children[i];
			if(child != except && child.some(predicate, this)){
				return true;
			}
		}
		return false;
	};
	TreeNode.prototype.remove = function(n){
		var index = this.children.indexOf(n);
		if(index > -1){
			this.children.splice(index, 1);
		}
	};
	TreeNode.prototype.destroy = function(){
		for(var i=0;i<this.children.length;i++){
			this.children[i].remove(this);
		}
		this.children.splice(0, this.children.length);
	};
	return TreeNode;
})();