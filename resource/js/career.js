/* ============================================================
   Careers(인재상) 페이지 전용 스크립트
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ---------- 페이드 스루 전환 ---------- */
  // 무대 스크롤 진행률(0~1)에 맞춰 색이 차오르고 그 위로 다음 장면이 떠오름
  function initStage() {
    var stage = document.getElementById('caStage');
    if (!stage || reduce) return;

    var scene2 = stage.querySelector('.ca-scene-2');
    var veil1 = stage.querySelector('.ca-veil-1');
    var veil2 = stage.querySelector('.ca-veil-2');
    var bubbles = stage.querySelector('.ca-bubbles');
    if (!scene2 || !veil1 || !veil2) return;

    var raf = 0;

    // 구간 [a, b] 사이에서 0 → 1
    function ramp(t, a, b) {
      var p = (t - a) / (b - a);
      return p < 0 ? 0 : (p > 1 ? 1 : p);
    }

    function draw() {
      raf = 0;

      var r = stage.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var run = r.height - vh;              // 화면이 고정된 채 흘러가는 총 거리
      var t = run > 0 ? -r.top / run : 0;
      if (t < 0) t = 0;
      if (t > 1) t = 1;

      // 1→2 : 어둠이 차오른 뒤 그 위에서 선언 문구가 떠오름
      veil1.style.opacity = ramp(t, .08, .32).toFixed(3);
      scene2.style.opacity = ramp(t, .30, .46).toFixed(3);

      // 2→3 : 크림색으로 밝아지며 인재상 섹션으로 넘어감
      veil2.style.opacity = ramp(t, .72, .95).toFixed(3);

      // 장면이 자리잡은 뒤 텍스트·버블 (되감아도 다시 재생하지 않음)
      if (t > .42) scene2.classList.add('is-on');
      if (t > .48 && bubbles) bubbles.classList.add('is-on');
    }

    function onScroll() {
      if (!raf) raf = requestAnimationFrame(draw);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    draw();
  }

  initStage();


  /* ---------- 레이더 차트 등장 (뷰포트 진입 시 1회) ---------- */
  function initRadar() {
    var radar = document.getElementById('caRadar');
    if (!radar) return;

    // 모바일은 차트를 감추고 카드만 쓰므로 애니메이션 자체를 걸지 않음
    // (카드 등장은 common.js의 공용 .reveal 옵저버가 처리)
    if (window.matchMedia && matchMedia('(max-width: 768px)').matches) return;

    // 모션 최소화 · 옵저버 미지원이면 완성 상태로 즉시 표시
    if (reduce || !('IntersectionObserver' in window)) {
      radar.classList.add('is-in');
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        entries[i].target.classList.add('is-in');
        io.unobserve(entries[i].target);   // 1회만
      }
    }, { rootMargin: '0px 0px -15% 0px', threshold: .25 });

    io.observe(radar);
  }

  initRadar();

})();
