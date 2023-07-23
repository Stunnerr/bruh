// ==UserScript==
// @name         r/Place Hotkeys
// @downloadURL  https://github.com/Stunnerr/bruh/raw/master/placehotkeys.user.js
// @updateURL    https://github.com/Stunnerr/bruh/raw/master/placehotkeys.user.js
// @namespace    https://stunner.su/
// @version      1.0
// @description  немного хоткеев на цвета(1234567890qwertyuiop + Shift) и установку пикселя (enter/space)
// @author       Stunner
// @match        https://garlic-bread.reddit.com/embed*
// @match	     https://hot-potato.reddit.com/embed*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const colorKeys = [
        'Digit1',
        'Digit2',
        'Digit3',
        'Digit4',
        'Digit5',
        'Digit6',
        'Digit7',
        'Digit8',
        'Digit9',
        'Digit0',
        'KeyQ',
        'KeyW',
        'KeyE',
        'KeyR',
        'KeyT',
        'KeyY',
        'KeyU',
        'KeyI',
        'KeyO',
        'KeyP'
    ];
    const placeKeys = ['Space', 'Enter', 'NumpadEnter'];
    var garlicEmbed, garlicEmbedRoot, garlicPlaceButtonContainer, garlicPaletteContainer, garlicPaletteColors, garlicPaletteCancelBtn, garlicPaletteConfirmBtn;
    console.log("Hotkeys loading on", document.location.href);
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async function start() {
      while (document.readyState !== 'complete') {
            console.log("Hotkey loader sleeping for 1 second because document isn't ready yet.");
            await sleep(1000);
        }
        console.log("DOM complete, preparing...");
        await initVars();
        await initEvent();
        console.log("Done!");
    }

    async function initVars() {
        garlicEmbed = document.querySelector('garlic-bread-embed');
        garlicEmbedRoot = garlicEmbed.shadowRoot;
        garlicPlaceButtonContainer = garlicEmbedRoot.querySelector('garlic-bread-status-pill').shadowRoot;
        garlicPaletteContainer = garlicEmbedRoot.querySelector('garlic-bread-color-picker').shadowRoot;
        garlicPaletteColors = garlicPaletteContainer.querySelector('.palette').children;
        garlicPaletteCancelBtn = garlicPaletteContainer.querySelector('button.cancel');
        garlicPaletteConfirmBtn = garlicPaletteContainer.querySelector('button.confirm');
    }
    async function initEvent() {
        document.addEventListener('keypress', (e) => {
            //console.log(e);
            let key = e.code,
                col = colorKeys.indexOf(key),
                plc = placeKeys.indexOf(key);
            if (col != -1) {
                chooseColor(e.shiftKey * 20 + col);
            }
            if (plc != -1) {
                e.preventDefault();
                place();
            }
        })
    }
    function openToolbar() {
        if (!hasToolbar()) {
            garlicPlaceButtonContainer.children[0].click();
        }
    }
    function hasToolbar() {
        return garlicPaletteContainer.children[0].style.opacity == '1'
    }
    function place() {
        openToolbar();
        if (!garlicPaletteConfirmBtn.disabled) {
            garlicPaletteConfirmBtn.click();
        }
    }
    function chooseColor(num){
        openToolbar();
        garlicPaletteColors[num].children[0].click();
    }
    start();
})();
