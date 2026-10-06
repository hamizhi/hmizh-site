/* Nav Tool Dropdown — 切换逻辑（点击 + 悬停 + Esc + 外点关闭） */
(function () {
    'use strict';

    function initDropdown(wrap) {
        const btn = wrap.querySelector('.nav-tool-trigger');
        const panel = wrap.querySelector('.nav-tool-panel');
        if (!btn || !panel) return;

        let open = false;
        let hoverTimer;

        function placePanel() {
            const rect = btn.getBoundingClientRect();
            const panelWidth = Math.min(280, window.innerWidth - 24);
            const centeredLeft = rect.left + (rect.width / 2) - (panelWidth / 2);
            const left = Math.max(12, Math.min(centeredLeft, window.innerWidth - panelWidth - 12));
            wrap.style.setProperty('--nav-tool-panel-left', left + 'px');
            wrap.style.setProperty('--nav-tool-panel-top', (rect.bottom + 14) + 'px');
        }

        function setOpen(v) {
            open = v;
            if (v) {
                placePanel();
                panel.classList.add('is-fixed');
            } else {
                panel.classList.remove('is-fixed');
            }
            btn.setAttribute('aria-expanded', v ? 'true' : 'false');
            panel.classList.toggle('is-open', v);
        }

        // 点击切换
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            setOpen(!open);
        });

        // 桌面端悬停展开（移动端无 hover，不影响）
        wrap.addEventListener('mouseenter', function () {
            clearTimeout(hoverTimer);
            setOpen(true);
        });
        wrap.addEventListener('mouseleave', function () {
            hoverTimer = setTimeout(function () { setOpen(false); }, 200);
        });

        // 外部点击关闭
        document.addEventListener('click', function (e) {
            if (!wrap.contains(e.target)) setOpen(false);
        });

        // Esc 关闭
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && open) {
                setOpen(false);
                btn.focus();
            }
        });

        window.addEventListener('resize', function () {
            if (open) placePanel();
        });
        window.addEventListener('scroll', function () {
            if (open) placePanel();
        }, { passive: true });
    }

    function ready(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    ready(function () {
        document.querySelectorAll('.nav-tool').forEach(initDropdown);
    });
})();
