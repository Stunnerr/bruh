// ==UserScript==
// @name Yandex.Music progressbar fix
// @namespace Stunner
// @description Удалялка ракет и прочего говна с прогрессбара яндекс музыки
// @match *://music.yandex.ru/*
// @grant none
// @updateUrl 
// ==/UserScript==

var fixed = false;
function fix(){
  var a = document.getElementsByClassName("progress")[0];
  if (a){
    var b = a.classList;
    while (b.length > 4) b.remove(b.item(4));
    fixed = true;
  }
  if (!fixed){
    setTimeout(fix, 500);
  }
}
fix();
