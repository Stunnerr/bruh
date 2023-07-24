// ==UserScript==
// @name         safe_r/Place
// @downloadURL  https://github.com/Stunnerr/bruh/raw/master/saferplace.user.js
// @updateURL    https://github.com/Stunnerr/bruh/raw/master/saferplace.user.js
// @namespace    https://stunner.su/
// @version      1.0
// @description  запрет установки пикселя одного и того же цвета
// @author       Stunner / stunner.su / @stunnerer (разбаньте в тарахтелке пж....)
// @match        https://garlic-bread.reddit.com/embed*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var garlicEmbed, garlicEmbedRoot, garlicPaletteContainer, garlicPaletteConfirmBtn, garlicCanvas, warning;
    var currentX = 0, currentY = 0, currentCol = 0, timeout;
    console.log("Safe_r/Place loading on", document.location.href);
    var codeColors = {
        1: '#be0039',
        2: '#ff4500',
        3: '#ffa800',
        4: '#ffd635',
        6: '#00a368',
        7: '#00cc78',
        8: '#7eed56',
        9: '#00756f',
        10: '#009eaa',
        12: '#2450a4',
        13: '#3690ea',
        14: '#51e9f4',
        15: '#493ac1',
        16: '#6a5cff',
        18: '#811e9f',
        19: '#b44ac0',
        22: '#ff3881',
        23: '#ff99aa',
        24: '#6d482f',
        25: '#9c6926',
        27: '#000000',
        29: '#898d90',
        30: '#d4d7d9',
        31: '#ffffff'
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    function sameColor() {
        return garlicCanvas.getPixelColor({x: currentX, y: currentY}) == codeColors[currentCol];
    }
    function hasToolbar() {
        return garlicPaletteContainer.children[0].style.opacity == '1'
    }
    async function toggleButton() {
        if (sameColor()) {
            if (hasToolbar()) {
                warning.style.display = "block";
            }
            garlicPaletteConfirmBtn.classList.add("disabled");
            garlicPaletteConfirmBtn.disabled = true;
        }
        else {
            warning.style.display = "none";
            garlicPaletteConfirmBtn.className = "confirm disable-default-select";
            garlicPaletteConfirmBtn.disabled = false;
        }
        timeout = setTimeout(toggleButton, 100);
    }
    async function start() {
        while (document.readyState !== 'complete') {
            console.log("Saferplace sleeping for 1 second because document isn't ready yet.");
            await sleep(1000);
        }
        console.log("DOM complete, preparing...");
        await initVars();
        await initEvents();
        console.log("Done!");
    }

    async function initVars() {
        warning = document.createElement("h3");
        warning.innerText = "НЕ СТАВЬ ПИКСЕЛЬ ОН ТОГО ЖЕ ЦВЕТА!!!!"
        warning.style.color = "#000";
        warning.style.textAlign = "center";
        warning.style.width = "100%";
        warning.style.display = "none";
        garlicEmbed = document.querySelector('garlic-bread-embed');
        garlicEmbedRoot = garlicEmbed.shadowRoot;
        garlicPaletteContainer = garlicEmbedRoot.querySelector('garlic-bread-color-picker').shadowRoot;
        garlicPaletteConfirmBtn = garlicPaletteContainer.querySelector('button.confirm');
        garlicCanvas = garlicEmbed.canvas;
        garlicPaletteContainer.appendChild(warning);
    }
    async function initEvents() {
        garlicEmbed.addEventListener('move-camera', (e) => {
            let [x, y] = [e.detail.x, e.detail.y];
            currentX = Math.round(x);
            currentY = Math.round(y);
            if (currentCol != 0)
                toggleButton();
        });
        garlicEmbed.addEventListener('select-color', (e) => {
            currentCol = e.detail.color;
            toggleButton();
        });
        garlicEmbed.addEventListener('cancel-pixel', (e) => {
            currentCol = 0;
            toggleButton();
            clearTimeout(timeout);
        });
        garlicEmbed.addEventListener('confirm-pixel', (e) => {
            currentCol = 0;
            toggleButton();
            clearTimeout(timeout);
        });
    }
    start();
})();
