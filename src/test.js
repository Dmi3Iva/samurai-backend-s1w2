debugger;
var a = "a";

var a = "c";
let b = "1";
console.log("inner", a);
{
  var a = "b";
  let b = "2";
  console.log("outer", a);

  while (1) {
    debugger;
  }
}
console.log("inner 2", a);
