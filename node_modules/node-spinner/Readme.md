
# node-spinner

Port of [visionmedia/go-spin](https://github.com/visionmedia/go-spin) to node.

## Installation

```
$ npm install node-spinner
```

## Example

```js
var s = Spinner();

setInterval(function(){
	process.stdout.write('\r \033[36mcomputing\033[m ' + s.next());
}, 250);
```

# License

 MIT