(function () {
    'use strict';

    var STATE = {
        items: [],
        index: 0,
        loading: false,
        loaded: false,
        timer: null
    };

    function isLgWebOs() {
        var ua = navigator.userAgent || '';

        return /(Web0S|webOS|LG Browser|WebAppManager)/i.test(ua);
    }

    if (!isLgWebOs()) {
        return;
    }

    document.documentElement.className += ' lg-b8-client';

    function isHome() {
        var hash = window.location.hash || '';
        return hash === '' ||
            hash.indexOf('#/home') === 0;
    }

    function getApiInfo() {
        var client = window.ApiClient;
        var userId = null;
        var token = null;
        var server = window.location.origin;
        var appName = 'Jellyfin Web';
        var appVersion = '12.1.0';
        var deviceName = 'LG webOS';
        var deviceId = 'lg-b8';
        var serverId = null;

        if (!client) {
            return null;
        }

        try {
            if (typeof client.getCurrentUserId === 'function') {
                userId = client.getCurrentUserId();
            } else if (client._currentUser) {
                userId = client._currentUser.Id;
            }
        } catch (e) {}

        try {
            if (typeof client.accessToken === 'function') {
                token = client.accessToken();
            } else if (client._serverInfo) {
                token = client._serverInfo.AccessToken;
            }
        } catch (e) {}

        try {
            if (typeof client.serverAddress === 'function') {
                server = client.serverAddress();
            } else if (client._serverAddress) {
                server = client._serverAddress;
            }
        } catch (e) {}

        try {
            if (typeof client.appName === 'function') {
                appName = client.appName();
            } else if (client._appName) {
                appName = client._appName;
            }

            if (typeof client.appVersion === 'function') {
                appVersion = client.appVersion();
            } else if (client._appVersion) {
                appVersion = client._appVersion;
            }

            if (typeof client.deviceName === 'function') {
                deviceName = client.deviceName();
            } else if (client._deviceName) {
                deviceName = client._deviceName;
            }

            if (typeof client.deviceId === 'function') {
                deviceId = client.deviceId();
            } else if (client._deviceId) {
                deviceId = client._deviceId;
            }
        } catch (e) {}

        try {
            if (typeof client.serverId === 'function') {
                serverId = client.serverId();
            } else if (client._serverInfo && client._serverInfo.Id) {
                serverId = client._serverInfo.Id;
            } else if (client._serverId) {
                serverId = client._serverId;
            }
        } catch (e) {}

        if (!userId || !token) {
            return null;
        }

        return {
            userId: userId,
            token: token,
            server: server,
            appName: appName,
            appVersion: appVersion,
            deviceName: deviceName,
            deviceId: deviceId,
            serverId: serverId
        };
    }

    function lgB8AuthHeader(api) {
        return 'MediaBrowser Client="' + api.appName +
            '", Device="' + api.deviceName +
            '", DeviceId="' + api.deviceId +
            '", Version="' + api.appVersion +
            '", Token="' + api.token + '"';
    }

    function lgB8OpenDetails() {
        var api = getApiInfo();
        var item;
        var url;

        if (!api || !STATE.items.length) {
            return;
        }

        item = STATE.items[STATE.index];

        if (!item || !item.Id) {
            return;
        }

        url = '/details?id=' + encodeURIComponent(item.Id);

        if (api.serverId) {
            url += '&serverId=' + encodeURIComponent(api.serverId);
        }

        if (window.Emby && window.Emby.Page &&
            typeof window.Emby.Page.show === 'function') {
            window.Emby.Page.show(url);
        } else {
            window.location.href = '#' + url;
        }
    }

    function lgB8ShowPlayMask() {
        var oldMask;
        var sourceImage;
        var mask;
        var image;

        oldMask = document.getElementById('lg-b8-play-mask');

        if (oldMask && oldMask.parentNode) {
            oldMask.parentNode.removeChild(oldMask);
        }

        sourceImage = document.getElementById('lg-b8-media-bar-image');

        mask = document.createElement('div');
        mask.id = 'lg-b8-play-mask';

        if (sourceImage && sourceImage.src) {
            image = document.createElement('img');
            image.id = 'lg-b8-play-mask-image';
            image.alt = '';
            image.src = sourceImage.src;
            mask.appendChild(image);
        }

        document.body.appendChild(mask);
    }

    function lgB8HidePlayMask(delay) {
        window.setTimeout(function () {
            var mask = document.getElementById('lg-b8-play-mask');

            if (!mask) {
                return;
            }

            mask.style.opacity = '0';

            window.setTimeout(function () {
                if (mask && mask.parentNode) {
                    mask.parentNode.removeChild(mask);
                }
            }, 250);
        }, delay || 0);
    }

    function lgB8PlayCurrent() {
        var api = getApiInfo();
        var item;
        var url;
        var attempts = 0;
        var maxAttempts = 100;
        var timer;

        if (!api || !STATE.items.length) {
            return;
        }

        item = STATE.items[STATE.index];

        if (!item || !item.Id) {
            return;
        }

        url = '/details?id=' + encodeURIComponent(item.Id);

        if (api.serverId) {
            url += '&serverId=' + encodeURIComponent(api.serverId);
        }

        lgB8ShowPlayMask();

        if (window.Emby &&
            window.Emby.Page &&
            typeof window.Emby.Page.show === 'function') {
            window.Emby.Page.show(url);
        } else {
            window.location.href = '#' + url;
        }

        timer = window.setInterval(function () {
            var hash;
            var buttons;
            var nativePlay = null;
            var i;
            var rect;
            var style;

            attempts += 1;
            hash = window.location.hash || '';

            /*
             * Não procurar Play enquanto a navegação
             * para os detalhes ainda não terminou.
             */
            if (hash.indexOf('details') === -1 &&
                hash.indexOf('item') === -1) {

                if (attempts >= maxAttempts) {
                    window.clearInterval(timer);
                }

                return;
            }

            buttons = document.querySelectorAll('.btnPlay');

            for (i = 0; i < buttons.length; i++) {
                try {
                    rect = buttons[i].getBoundingClientRect();
                    style = window.getComputedStyle ?
                        window.getComputedStyle(buttons[i]) :
                        null;

                    if (rect.width > 0 &&
                        rect.height > 0 &&
                        !buttons[i].disabled &&
                        (!style ||
                            (style.display !== 'none' &&
                             style.visibility !== 'hidden'))) {

                        nativePlay = buttons[i];
                        break;
                    }
                } catch (e) {}
            }

            if (nativePlay) {
                window.clearInterval(timer);

                window.setTimeout(function () {
                    try {
                        if (typeof nativePlay.focus === 'function') {
                            nativePlay.focus();
                        }

                        nativePlay.click();

                        lgB8HidePlayMask(1200);

                        console.log(
                            'LG B8 Media Bar: Play nativo visível accionado.'
                        );
                    } catch (e) {
                        lgB8HidePlayMask(0);

                        console.error(
                            'LG B8 Media Bar: erro no Play nativo:',
                            e
                        );
                    }
                }, 150);

                return;
            }

            if (attempts >= maxAttempts) {
                window.clearInterval(timer);
                lgB8HidePlayMask(0);

                console.error(
                    'LG B8 Media Bar: nenhum .btnPlay visível encontrado.'
                );
            }
        }, 100);
    }

    function lgB8FocusHomeNavigation() {
        var nodes;
        var node;
        var text;
        var aria;
        var title;
        var rect;
        var style;
        var i;

        nodes = document.querySelectorAll(
            'header button, header a, header [tabindex], ' +
            '.skinHeader button, .skinHeader a, .skinHeader [tabindex]'
        );

        for (i = 0; i < nodes.length; i++) {
            node = nodes[i];

            text = (node.textContent || '')
                .replace(/\s+/g, ' ')
                .replace(/^\s+|\s+$/g, '')
                .toLowerCase();

            aria = (node.getAttribute('aria-label') || '').toLowerCase();
            title = (node.getAttribute('title') || '').toLowerCase();

            if (
                text.indexOf('página inicial') === -1 &&
                text.indexOf('pagina inicial') === -1 &&
                aria.indexOf('página inicial') === -1 &&
                aria.indexOf('pagina inicial') === -1 &&
                title.indexOf('página inicial') === -1 &&
                title.indexOf('pagina inicial') === -1
            ) {
                continue;
            }

            try {
                rect = node.getBoundingClientRect();

                style = window.getComputedStyle ?
                    window.getComputedStyle(node) :
                    null;

                if (
                    rect.width <= 0 ||
                    rect.height <= 0 ||
                    (style &&
                        (style.display === 'none' ||
                         style.visibility === 'hidden'))
                ) {
                    continue;
                }

                try {
                    node.focus({ preventScroll: true });
                } catch (e) {
                    node.focus();
                }

                window.scrollTo(0, 0);

                console.log(
                    'LG B8 Media Bar: foco inicial em Página inicial.'
                );

                return true;
            } catch (e) {}
        }

        return false;
    }

    function lgB8ScheduleHomeFocus() {
        if (window.__lgB8HomeFocusScheduled) {
            return;
        }

        window.__lgB8HomeFocusScheduled = true;

        window.setTimeout(function () {
            lgB8FocusHomeNavigation();
        }, 1200);
    }

    function shuffle(items) {
        var i;
        var j;
        var temp;

        for (i = items.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            temp = items[i];
            items[i] = items[j];
            items[j] = temp;
        }

        return items;
    }

    function getBar() {
        return document.getElementById('lg-b8-media-bar');
    }

    function ensureBar() {
        var homeSections;
        var bar;
        var image;

        if (!isHome()) {
            bar = getBar();
            if (bar) {
                bar.style.display = 'none';
            }
            return null;
        }

        homeSections = document.querySelector('.homeSectionsContainer');

        if (!homeSections) {
            return null;
        }

        /*
         * LG B8: o CSS do Media Bar Enhanced original reserva
         * 65-73vh para a barra original. Como usamos uma barra
         * própria dentro de homeSectionsContainer, removemos
         * apenas na LG esse deslocamento.
         */
        homeSections.style.setProperty('top', '0', 'important');
        homeSections.style.setProperty('margin-top', '0', 'important');

        bar = getBar();

        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'lg-b8-media-bar';
            bar.setAttribute('aria-hidden', 'false');

            image = document.createElement('img');
            image.id = 'lg-b8-media-bar-image';
            image.alt = '';
            image.draggable = false;

            var imageFrame = document.createElement('div');
            imageFrame.id = 'lg-b8-media-bar-image-frame';

            imageFrame.appendChild(image);
            bar.appendChild(imageFrame);

            var overlay = document.createElement('div');
            overlay.id = 'lg-b8-media-bar-overlay';

            var title = document.createElement('div');
            title.id = 'lg-b8-media-bar-title';

            var meta = document.createElement('div');
            meta.id = 'lg-b8-media-bar-meta';

            var actions = document.createElement('div');
            actions.id = 'lg-b8-media-bar-actions';

            var playButton = document.createElement('button');
            playButton.id = 'lg-b8-media-bar-play';
            playButton.className = 'lg-b8-media-bar-button lg-b8-media-bar-play';
            playButton.type = 'button';
            playButton.tabIndex = 0;
            playButton.textContent = '▶  Reproduzir';
            playButton.onclick = function (event) {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }

                lgB8PlayCurrent();
            };

            var infoButton = document.createElement('button');
            infoButton.id = 'lg-b8-media-bar-info';
            infoButton.className = 'lg-b8-media-bar-button lg-b8-media-bar-info';
            infoButton.type = 'button';
            infoButton.tabIndex = 0;
            infoButton.textContent = 'ⓘ  Informação';
            infoButton.onclick = function (event) {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }

                lgB8OpenDetails();
            };

            actions.appendChild(playButton);
            actions.appendChild(infoButton);

            overlay.appendChild(title);
            overlay.appendChild(meta);
            overlay.appendChild(actions);
            bar.appendChild(overlay);

            if (homeSections.firstChild) {
                homeSections.insertBefore(bar, homeSections.firstChild);
            } else {
                homeSections.appendChild(bar);
            }
        }

        bar.style.display = 'block';

        lgB8ScheduleHomeFocus();

        return bar;
    }

    function buildImageUrl(item, api) {
        return api.server +
            '/Items/' +
            encodeURIComponent(item.Id) +
            '/Images/Backdrop/0' +
            '?maxWidth=1920' +
            '&quality=85' +
            '&api_key=' +
            encodeURIComponent(api.token);
    }

    function showCurrent() {
        var api;
        var item;
        var image;
        var preloader;
        var url;
        var title;
        var meta;
        var metaParts;
        var rating;

        if (!STATE.items.length) {
            return;
        }

        if (!ensureBar()) {
            return;
        }

        api = getApiInfo();

        if (!api) {
            return;
        }

        item = STATE.items[STATE.index];
        image = document.getElementById('lg-b8-media-bar-image');

        if (!image || !item) {
            return;
        }

        url = buildImageUrl(item, api);

        title = document.getElementById('lg-b8-media-bar-title');
        meta = document.getElementById('lg-b8-media-bar-meta');
        metaParts = [];

        if (title) {
            title.textContent = item.Name || '';
        }

        rating = parseFloat(item.CommunityRating);

        if (!isNaN(rating)) {
            metaParts.push('★ ' + rating.toFixed(1));
        }

        if (item.ProductionYear) {
            metaParts.push(String(item.ProductionYear));
        }

        if (item.OfficialRating) {
            metaParts.push(item.OfficialRating);
        }

        if (meta) {
            meta.textContent = metaParts.join('  •  ');
        }

        preloader = new Image();

        preloader.onload = function () {
            image.style.opacity = '0';

            window.setTimeout(function () {
                image.src = url;
                image.style.opacity = '1';
                lgB8SaveCachedItem(item);
            }, 200);
        };

        preloader.onerror = function () {
            STATE.index = (STATE.index + 1) % STATE.items.length;
        };

        preloader.src = url;
    }

    function lgB8SaveCachedItem(item) {
        var data;

        if (!item || !item.Id) {
            return;
        }

        data = {
            Id: item.Id,
            Name: item.Name || '',
            CommunityRating: item.CommunityRating,
            ProductionYear: item.ProductionYear,
            OfficialRating: item.OfficialRating || ''
        };

        try {
            window.localStorage.setItem(
                'lg-b8-media-bar-last-item',
                JSON.stringify(data)
            );
        } catch (e) {}
    }

    function lgB8ShowCachedSlide() {
        var raw;
        var item;

        if (window.__lgB8CachedSlideTried) {
            return;
        }

        window.__lgB8CachedSlideTried = true;

        try {
            raw = window.localStorage.getItem(
                'lg-b8-media-bar-last-item'
            );

            if (!raw) {
                return;
            }

            item = JSON.parse(raw);
        } catch (e) {
            return;
        }

        if (!item || !item.Id) {
            return;
        }

        STATE.items = [item];
        STATE.index = 0;

        showCurrent();

        console.log(
            'LG B8 Media Bar: imagem inicial carregada do cache.'
        );
    }

    function nextImage() {
        if (!STATE.items.length) {
            return;
        }

        STATE.index = (STATE.index + 1) % STATE.items.length;
        showCurrent();
    }

    function startRotation() {
        if (STATE.timer) {
            window.clearInterval(STATE.timer);
        }

        showCurrent();

        STATE.timer = window.setInterval(function () {
            if (isHome()) {
                nextImage();
            }
        }, 12000);
    }

    function loadItems() {
        var api;
        var url;

        if (STATE.loading || STATE.loaded) {
            return;
        }

        api = getApiInfo();

        if (!api) {
            return;
        }

        STATE.loading = true;

        url = api.server +
            '/Items' +
            '?IncludeItemTypes=Movie%2CSeries' +
            '&Recursive=true' +
            '&SortBy=DateCreated' +
            '&SortOrder=Descending' +
            '&Limit=30' +
            '&Fields=ProductionYear%2CCommunityRating%2COfficialRating%2CBackdropImageTags' +
            '&EnableUserData=true' +
            '&userId=' +
            encodeURIComponent(api.userId);

        fetch(url, {
            headers: {
                'Authorization':
                    'MediaBrowser Client="' + api.appName +
                    '", Device="' + api.deviceName +
                    '", DeviceId="' + api.deviceId +
                    '", Version="' + api.appVersion +
                    '", Token="' + api.token + '"'
            }
        })
        .then(function (response) {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            return response.json();
        })
        .then(function (data) {
            var items = data && data.Items ? data.Items : [];

            items = items.filter(function (item) {
                return item &&
                    item.Id &&
                    item.BackdropImageTags &&
                    item.BackdropImageTags.length > 0;
            });

            STATE.items = shuffle(items);
            STATE.index = 0;
            STATE.loaded = true;
            STATE.loading = false;

            if (STATE.items.length) {
                ensureBar();
                startRotation();
            }
        })
        .catch(function (error) {
            STATE.loading = false;
            console.log('LG B8 Media Bar:', error);
        });
    }

    function tick() {
        ensureBar();

        if (!STATE.loaded) {
            lgB8ShowCachedSlide();
            loadItems();
        }
    }

    window.addEventListener('hashchange', function () {
        if (!isHomePage()) {
            window.__lgB8HomeFocusScheduled = false;
        }

        window.setTimeout(tick, 500);
    });

    window.setInterval(tick, 1500);

    window.setTimeout(tick, 100);
}());
