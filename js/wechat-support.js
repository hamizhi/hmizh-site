(function () {
    'use strict';
    var wechatId = 'gptpro5566';
    var notice = document.querySelector('.wechat-notice');
    var noticeTimer;

    function notify(message) {
        if (!notice) return;
        clearTimeout(noticeTimer);
        notice.textContent = message;
        noticeTimer = setTimeout(function () { notice.textContent = ''; }, 6500);
    }

    function fallbackCopy() {
        var previousFocus = document.activeElement;
        var input = document.createElement('textarea');
        input.value = wechatId;
        input.setAttribute('readonly', '');
        input.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px;';
        document.body.appendChild(input);
        input.focus({ preventScroll: true });
        input.select();
        input.setSelectionRange(0, input.value.length);
        var copied = false;
        try { copied = document.execCommand('copy'); }
        catch (error) { /* Show the visible ID for manual copy below. */ }
        input.remove();
        if (previousFocus && previousFocus.focus) previousFocus.focus({ preventScroll: true });
        return copied;
    }

    document.addEventListener('click', async function (event) {
        var button = event.target.closest('[data-wechat-copy]');
        if (!button) return;
        var copied = false;
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(wechatId);
                copied = true;
            }
        } catch (error) { /* Try the legacy copy path if clipboard access is denied. */ }
        if (!copied) copied = fallbackCopy();
        notify(copied
            ? '已复制 ' + wechatId + '。打开微信 → 添加朋友 → 粘贴搜索，说明你遇到的问题。'
            : '自动复制未成功，请手动复制微信号：' + wechatId + '，到微信「添加朋友」中搜索。');
    });
}());
