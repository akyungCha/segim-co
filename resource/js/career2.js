/* ============================================================
   채용 안내 페이지 전용 스크립트
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 묶음이 화면에 들어오면 .is-in 부여 (1회) — 순서·지연은 CSS가 처리
  function once(id, ratio) {
    var el = document.getElementById(id);
    if (!el) return;

    if (reduce || !('IntersectionObserver' in window)) {
      el.classList.add('is-in');
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        entries[i].target.classList.add('is-in');
        io.unobserve(entries[i].target);
      }
    }, { rootMargin: '0px 0px -12% 0px', threshold: ratio });

    io.observe(el);
  }

  once('cuCards', .2);
  once('stFlow', .35);

})();
