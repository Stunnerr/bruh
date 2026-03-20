// ==UserScript==
// @name         PixelTools for итд.com
// @match        https://pixel.xn--d1ah4a.com/*
// @description  sub2brff
// @version      v1.0
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    let internal = {
        inst: null,
        hooks: null,
        template: { img: null, x: 0, y: 0, w: 0, h: 0, opacity: 0.5, canvas: null },
        // We will find these dynamically. -1 means "not found yet".
        idx: {
            selectedColor: 2,   // This one is usually stable
            selection: 6,       // This one is also quite stable
            size: -1,           // The board size (e.g., 1024)
            board: -1,          // The Uint8Array with pixel data
        },
        status: "Loading...",
        moveKeys: new Set()
    };

    internal.settings = JSON.parse(GM_getValue("pixeltools.settings", '{"protected":true,"opacity":0.5,"templates":[]}'));
    // --- DYNAMIC HOOK FINDING ---
    function syncAndMapHooks() {
        // Step 1: Find the main component instance
        const root = document.getElementById('root');
        if (!root || !root.__k) {
            internal.status = "Error: Root not found.";
            return false;
        }

        const findInstance = (node) => {
            if (node?.__c?.__H?.__.length > 10) return node.__c;
            if (node?.__k) {
                for (const k of Array.isArray(node.__k) ? node.__k : [node.__k]) {
                    const res = findInstance(k);
                    if (res) return res;
                }
            }
            return null;
        };

        const inst = findInstance(root.__k);
        if (!inst) {
            internal.status = "Waiting for game instance...";
            return false;
        }

        internal.inst = inst;
        internal.hooks = inst.__H.__;

        // Step 2: Find the indices by their "signature"
        // Find the board data: a very large Uint8Array
        internal.idx.board = internal.hooks.findIndex(h =>
                                                      h.__?.current instanceof Uint8Array && h.__.current.length > 500000 // e.g., 1024*1024
                                                     );

        if (internal.idx.board === -1) {
            internal.status = "Waiting for board data...";
            return false;
        }

        // Find the board size: a number that, when squared, matches the board length
        const boardLength = internal.hooks[internal.idx.board].__.current.length;
        internal.idx.size = internal.hooks.findIndex(h =>
                                                     typeof h.__?.current === 'number' && (h.__.current * h.__.current) === boardLength
                                                    );

        if (internal.idx.size === -1) {
            internal.status = "Board size hook not found";
            return false;
        }
        for (let i = 10; i < internal.hooks.length - 2; i++) {
            const z = internal.hooks[i].__?.current;
            const x = internal.hooks[i+1].__?.current;
            const y = internal.hooks[i+2].__?.current;
            if (typeof z === 'number' && typeof x === 'number' && typeof y === 'number') {
                if (z >= 0.1 && z <= 40 && i !== internal.idx.size) {
                    internal.idx.zoom = i;
                    internal.idx.camX = i + 1;
                    internal.idx.camY = i + 2;
                    break;
                }
            }
        }

        internal.placeBtn = document.querySelector("div:nth-of-type(10)").parentNode.parentNode.parentNode.parentNode.querySelector("button")

        internal.status = `Hooked! [sz=${internal.idx.size}, brd=${internal.idx.board}, cam=${internal.idx.zoom}]`;
        let data = internal.settings.templates[0];
        if (data) pb.setTemplate(data.img, data.x, data.y, data.w, data.h, internal.settings.opacity)
        return true;
    }


    // --- TEMPLATE DRAWING ---
    const overlay = document.createElement('canvas');
    overlay.style = "position:fixed; top:0; left:0; pointer-events:none; z-index:4;";
    document.body.appendChild(overlay);

    function renderTemplate() {
        if (!internal.template.img || internal.idx.zoom === -1) {
            overlay.getContext('2d').clearRect(0, 0, overlay.width, overlay.height);
            return;
        }

        const ctx = overlay.getContext('2d');
        overlay.width = window.innerWidth;
        overlay.height = window.innerHeight;

        const zoom = internal.hooks[internal.idx.zoom].__.current;
        const offX = internal.hooks[internal.idx.camX].__.current;
        const offY = internal.hooks[internal.idx.camY].__.current;

        ctx.clearRect(0, 0, overlay.width, overlay.height);
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Sync with game's internal camera transform
        ctx.translate(offX, offY);
        ctx.scale(zoom, zoom);

        ctx.globalAlpha = internal.template.opacity;
        ctx.drawImage(internal.template.img, internal.template.x, internal.template.y, internal.template.w, internal.template.h);
        ctx.restore();
    }


    // --- THE API (Uses dynamic indices) ---
    const pb = {
        getCanvasSize: () => internal.idx.size !== -1 ? internal.hooks[internal.idx.size].__.current : null,
        getBoardData: () => internal.idx.board !== -1 ? internal.hooks[internal.idx.board].__.current : null,

        getPixelColorAt: (x, y) => {
            const board = pb.getBoardData();
            const size = pb.getCanvasSize();
            if (!board || size === null || x < 0 || y < 0 || x >= size || y >= size) return null;
            return board[Math.floor(x) + Math.floor(y) * size];
        },

        getSelection: () => internal.hooks[internal.idx.selection].__[0],

        getSelectedPixelColor: () => {
            const sel = pb.getSelection();
            return sel ? pb.getPixelColorAt(sel.x, sel.y) : null;
        },

        setSelection: (x, y) => {
            const size = pb.getCanvasSize();
            if (size === null) return;
            internal.hooks[internal.idx.selection].__[1]({
                x: Math.max(0, Math.min(size - 1, x)),
                y: Math.max(0, Math.min(size - 1, y)),
            });
        },
        getColor: () => internal.hooks[internal.idx.selectedColor].__[0],
        setColor: (id) => internal.hooks[internal.idx.selectedColor].__[1](id),

        setTemplate: (url, x, y, w, h, opacity = 0.5) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = url;
            img.onload = () => {
                internal.template = { img, x, y, w, h, opacity };
                // Prepare a hidden canvas to read template pixel colors
                const c = document.createElement('canvas');
                c.width = w; c.height = h;
                c.getContext('2d').drawImage(img, 0, 0, w, h);
                internal.template.ctx = c.getContext('2d');
                console.log("Template Active");
            };
        },

        place: () => {
            const btn = internal.placeBtn;
            if (btn && !btn.disabled) btn.click();
        }
    };

    // --- DEBUG HUD ---
    const gui = document.createElement('div');
    gui.innerHTML = `
    <style>
            .text-gradient {
                color: #1c0f4a;
                background-image: linear-gradient(45deg, red, #ffa800 10%, pink 80%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                display: inline-block;
            }

            .pt-settings {
                border-bottom: 1px solid #555;
                margin-bottom: 8px;
                padding-bottom: 8px;
                font-size: 11px;
            }

            .pt-input {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;
            }

            .pt-input input {
                background: #222;
                color: #fff;
                border: 1px solid #444;
            }

            .pt-container {
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 12px;
                z-index: 9999;
                font-family: monospace;
                border-radius: 12px;
                backdrop-filter: blur(24px);
            }

            .pt-main {
                position: fixed;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
            }

            .pt-info {
                position: fixed;
                bottom: 10px;
                left: 10px;
            }
            .pt-button {
                appearance: none;
                outline: none;
                background: #fff1;
                border: none;

                color: white;
                border-radius: 12px;
                padding: 6px 12px;
                cursor: pointer;
            }
            .pt-button:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            .pt-button#open_settings {
                position: relative;
                left: 50%;
                width: 100%;
                transform: translateX(-50%) translateY(12px);
                margin: none;
            }
            .pt-settings {
                max-height: 0;
                padding: 10px;
                padding-bottom: 0;
                border: none;
                overflow: hidden;
                transition: max-height 0.2s ease-out;
            }

            input[type="text"],
            input[type="number"] {
                padding: 4px;
                border-radius: 8px;
            }
            .pt-settings section {
                border-bottom: 1px solid #ddd;
            }
        </style>
        <div class="pt-container pt-main" loading>
            <center>
                <span class="text-gradient">PixelTools</span> v1.1<br>
                Made with ❤️ by <a style="color:lightblue" href="https://stunner.su" target="_blank">Stunner</a>
            </center>
            <button id="open_settings" class="pt-button">Settings</button>
            <div class="pt-settings">
                <div class="pt-input">
                    <label>Auto-Lock (Same Color):</label>
                    <input type="checkbox" id="pt_lock" ${internal.settings.protected ? 'checked' : '' }>
                </div>
                <section>Templates</section>
                <div class="pt-input">
                    <label>Opacity:</label>
                    <input type="range" id="pt_opac" min="0" max="1" step="0.1" value="${internal.settings.opacity}"
                        style="width:50%">
                </div>
                <div class="pt-input">
                    <input type="text" name="url" id="url" placeholder="Template URL" value="${internal.settings.templates[0]?.url || ''}"><br>
                    <button class="pt-button" id="load_template">Load</button>
                </div>
            </div>
        </div>
        <div class="pt-container pt-info">
            Status: Loading...
        </div>
    </div>
    `

    document.body.appendChild(gui);

    function showHud() {
        const sel = pb.getSelection();
        const pixelColor = pb.getSelectedPixelColor() ?? "N/A";
        const drawColor = pb.getColor();
        const btnLock = internal.settings.protected ? `<span style="color:#00ff88">active</span>` : `<span style="color:#ff4444">inactive</span>`;
        // Only generate the full HTML if the container is empty (first run)
        if (gui.querySelector('.pt-main').attributes.loading) {
            console.log("enabling main hud")
            gui.querySelector('.pt-main').removeAttribute("loading");
            gui.querySelector("#open_settings").addEventListener("click", function () {
                var content = this.nextElementSibling;
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                }
            });
            // Listen for changes
            gui.querySelector('#pt_lock').onchange = (e) => internal.settings.protected = e.target.checked;
            gui.querySelector('#pt_opac').oninput = (e) => {
                internal.settings.opacity = parseFloat(e.target.value);
                if (internal.template) internal.template.opacity = internal.settings.opacity;
            };
            gui.querySelector('#load_template').onclick = () => {
                const urlContainer = gui.querySelector('.pt-settings input#url')
                let url = urlContainer.value;
                url = URL.parse(url);
                if (internal.settings.templates[0]?.url != url) {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: url,
                        onload: function(response) {
                            try {
                                let data = JSON.parse(response.responseText);
                                if (["img", "name", "x", "y", "w", "h"].every(field => field in data)){
                                    pb.setTemplate(data.img, data.x, data.y, data.w, data.h);
                                    data.url = url;
                                    internal.settings.templates[0] = data;
                                }
                            } catch (e) {
                                console.error("Ошибка парсинга JSON", e);
                            }
                        }
                    });
                }
            }
        }

        // Update only the dynamic status part
        gui.querySelector('.pt-info').innerHTML = `
            Status: ${internal.status}<br>
            Coords: ${sel ? `<b>${sel.x}, ${sel.y}</b>` : 'None'}<br>
            Pixel color: <span style="color:#aaa">${pixelColor}</span><br>
            Selected color: <span style="color:#fff">${drawColor}</span><br>
            Button lock: ${btnLock}
        `;
    }

    function protectButton() {
        const sel = pb.getSelection();
        const pixelColor = pb.getSelectedPixelColor();
        const drawColor = pb.getColor()
        const cooldown = internal.placeBtn.classList.length > 1
        if (pixelColor == drawColor && !cooldown) {
            internal.placeBtn.disabled = 1;
            internal.placeBtn.style.background = "gray"
            internal.placeBtn.innerText = "НЕ СТАВЬ!!"
            return true;
        }
        else {
            internal.placeBtn.style = "";
            if (!cooldown) {
                internal.placeBtn.innerText = "ПОСТАВИТЬ";
                internal.placeBtn.disabled = false;
            }
            return false;
        }
    }


    // --- LAG-FREE MOVEMENT & INPUT HANDLING ---
    function updateLoop(ts) {
        if (internal.moveKeys.size > 0) { // 60fps cap
            const sel = pb.getSelection();
            if (sel) {
                let dx = 0, dy = 0;
                if (internal.moveKeys.has('KeyW')) dy -= 1;
                if (internal.moveKeys.has('KeyS')) dy += 1;
                if (internal.moveKeys.has('KeyA')) dx -= 1;
                if (internal.moveKeys.has('KeyD')) dx += 1;
                if (internal.moveKeys.shift) {dx *=10; dy*=10;}
                internal.moveKeys.clear();
                if (dx !== 0 || dy !== 0) {
                    pb.setSelection(sel.x + dx, sel.y + dy);
                    internal.lastUpdate = ts;
                }
            }
        }
        if (internal.idx.board !== -1) {
            showHud();
            pb.protected = protectButton();
        }
        renderTemplate();
        requestAnimationFrame(updateLoop);
    }

    unsafeWindow.addEventListener('keydown', (e) => {
        if (internal.idx.board === -1 && !syncAndMapHooks()) return;

        if (document.activeElement.tagName === 'INPUT') return;

        const key = e.code;
        internal.moveKeys.shift = e.shiftKey;
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(key)) internal.moveKeys.add(key);

        if (e.code === 'Space') {
            e.preventDefault();
            pb.place();
        }

        if (/^[0-9]$/.test(key)) {
            pb.setColor(key === '0' ? 9 : parseInt(key) - 1);
        }

        if (key === 'c') {
            const colorId = pb.getSelectedPixelColor();
            if (colorId !== null) pb.setColor(colorId);
        }
    });

    unsafeWindow.addEventListener('keyup', (e) => {
        internal.moveKeys.delete(e.code);
    });


    setInterval(() => {
        if (internal.idx.board === -1) {
            syncAndMapHooks(); // Keep trying if it failed
            showHud();
        }
    }, 500);

    setInterval(() => {
        GM_setValue("pixeltools.settings", JSON.stringify(internal.settings));
    }, 5000);

    requestAnimationFrame(updateLoop);
    unsafeWindow.pb = pb;
})();
