(function () {
    'use strict';

    var measurementId = 'G-S9SJ4DT159';
    var storageKey = 'aichongzhi_analytics_consent_v1';
    var bannerId = 'analytics-consent';
    var returnFocus = null;
    var loaded = false;
    var dataLayer = window.dataLayer = window.dataLayer || [];

    function queueGtag() {
        dataLayer.push(arguments);
    }

    // 默认拒绝所有非必要存储；只有用户明确接受后才加载 GA4。
    queueGtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        wait_for_update: 500
    });

    function readChoice() {
        try { return window.localStorage.getItem(storageKey); }
        catch (error) { return null; }
    }

    function writeChoice(value) {
        try { window.localStorage.setItem(storageKey, value); }
        catch (error) { /* 浏览器禁用存储时仅保留本页选择 */ }
    }

    function clearAnalyticsCookies() {
        document.cookie.split(';').forEach(function (entry) {
            var name = entry.split('=')[0].trim();
            if (name === '_ga' || name.indexOf('_ga_') === 0) {
                document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax';
                document.cookie = name + '=; Max-Age=0; path=/; domain=.aichongzhi.org; SameSite=Lax';
            }
        });
    }

    function loadAnalytics() {
        window['ga-disable-' + measurementId] = false;
        window.gtag = queueGtag;
        queueGtag('consent', 'update', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
        });
        if (loaded) return;
        loaded = true;
        queueGtag('js', new Date());
        queueGtag('config', measurementId, {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false
        });

        var script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
        script.onload = function () {
            window.dispatchEvent(new CustomEvent('aichongzhi:analytics-ready'));
        };
        document.head.appendChild(script);
    }

    function rejectAnalytics() {
        queueGtag('consent', 'update', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
        });
        window['ga-disable-' + measurementId] = true;
        if (window.gtag === queueGtag) delete window.gtag;
        clearAnalyticsCookies();
    }

    function hideBanner() {
        var banner = document.getElementById(bannerId);
        if (banner) banner.hidden = true;
        if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
        returnFocus = null;
    }

    function saveChoice(value) {
        writeChoice(value);
        hideBanner();
        if (value === 'granted') loadAnalytics();
        else rejectAnalytics();
    }

    function renderBanner() {
        returnFocus = document.activeElement;
        var existing = document.getElementById(bannerId);
        if (existing) {
            existing.hidden = false;
            existing.querySelector('[data-consent="denied"]').focus({ preventScroll: true });
            return;
        }

        var banner = document.createElement('section');
        banner.id = bannerId;
        banner.className = 'analytics-consent';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', '分析 Cookie 设置');
        banner.setAttribute('aria-describedby', 'analytics-consent-description');
        banner.innerHTML =
            '<div class="analytics-consent__header">' +
                '<p class="analytics-consent__title">分析 Cookie 设置</p>' +
                '<button type="button" class="analytics-consent__close" data-consent-close aria-label="关闭 Cookie 设置">×</button>' +
            '</div>' +
            '<p id="analytics-consent-description" class="analytics-consent__text">可选访问统计仅在同意后开启。<a href="/privacy">隐私政策</a></p>' +
            '<div class="analytics-consent__actions">' +
                '<button type="button" class="analytics-consent__button" data-consent="denied">仅必要</button>' +
                '<button type="button" class="analytics-consent__button analytics-consent__button--accept" data-consent="granted">接受分析</button>' +
            '</div>';
        banner.addEventListener('click', function (event) {
            if (event.target.closest('[data-consent-close]')) {
                hideBanner();
                return;
            }
            var button = event.target.closest('[data-consent]');
            if (button) saveChoice(button.getAttribute('data-consent'));
        });
        banner.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                hideBanner();
            }
        });
        document.body.appendChild(banner);
        banner.querySelector('[data-consent="denied"]').focus({ preventScroll: true });
    }

    function addSettingsLink() {
        var footer = document.querySelector('footer');
        if (!footer || footer.querySelector('.analytics-consent__settings')) return;
        var container = footer.querySelector('.footer-bottom-inner') || footer.querySelector('.footer-bottom') || footer;
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'analytics-consent__settings';
        button.textContent = 'Cookie 设置';
        button.setAttribute('aria-haspopup', 'dialog');
        button.addEventListener('click', renderBanner);
        container.appendChild(button);
    }

    window.AIchongzhiConsent = {
        open: renderBanner,
        accept: function () { saveChoice('granted'); },
        reject: function () { saveChoice('denied'); }
    };

    var choice = readChoice();
    if (choice === 'granted') {
        loadAnalytics();
    } else {
        rejectAnalytics();
    }

    // 不自动弹窗或抢焦点。未选择时保持统计关闭，用户可从页脚主动打开设置。
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addSettingsLink, { once: true });
    } else {
        addSettingsLink();
    }
})();
