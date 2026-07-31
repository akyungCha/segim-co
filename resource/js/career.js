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

    var fill = initFill(radar);   // 삼각형 채우기 (없으면 null)

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          radar.classList.add('is-in');
          if (fill) fill.play();     // 다시 진입하면 다시 재생
        } else if (fill) {
          fill.reset();              // 화면을 벗어나면 중앙으로 되돌려 둠
        }
      }
    }, { rootMargin: '0px 0px -15% 0px', threshold: .25 });

    io.observe(radar);
  }


  /* ---------- 삼각형 채우기 : 중앙 → 각 꼭짓점으로 퍼짐 ----------
     폴리곤 points를 프레임마다 보간. 축마다 딜레이·속도를 달리 줘 제각각 퍼짐 */
  function initFill(radar) {
    var area = radar.querySelector('.rc-area');
    if (!area) return null;

    var CX = 200, CY = 200;                       // 차트 중심 (viewBox 기준)
    var dots = radar.querySelectorAll('.rc-dot');

    // 목표 꼭짓점 : 폴리곤의 원래 points를 그대로 사용
    var goal = area.getAttribute('points').trim().split(/\s+/).map(function (p) {
      var xy = p.split(',');
      return { x: parseFloat(xy[0]), y: parseFloat(xy[1]) };
    });

    // 꼭짓점마다 대응하는 점(dot) 찾기 (좌표가 가장 가까운 것)
    var dotOf = goal.map(function (g) {
      var best = null, bd = 1e9;
      Array.prototype.forEach.call(dots, function (d) {
        var dx = d.getAttribute('cx') - g.x, dy = d.getAttribute('cy') - g.y;
        var dist = dx * dx + dy * dy;
        if (dist < bd) { bd = dist; best = d; }
      });
      return best;
    });

    // 꼭짓점 먼저 : 하나씩 톡톡 등장
    var DOT_DELAY = [0, 150, 300];
    var DOT_DUR = 340;

    // 꼭짓점이 다 뜬 뒤 GAP 만큼 쉬었다가 삼각형이 축별로 퍼짐
    var GAP = 260;
    var AREA_AT = DOT_DELAY[DOT_DELAY.length - 1] + DOT_DUR + GAP;
    var DELAY = [AREA_AT, AREA_AT + 190, AREA_AT + 360];
    var DUR = [900, 1050, 820];
    var raf = 0, start = 0;

    radar.classList.add('is-fill');

    function ease(p) {                            // easeOutCubic (오버슈트 없음)
      var q = 1 - p;
      return 1 - q * q * q;
    }

    // 진행도 0~1 배열(점 / 삼각형)로 화면 갱신
    function render(dotPs, areaPs) {
      var pts = [];
      for (var i = 0; i < goal.length; i++) {
        var e = ease(areaPs[i]);
        pts.push((CX + (goal[i].x - CX) * e).toFixed(1) + ',' + (CY + (goal[i].y - CY) * e).toFixed(1));
        if (dotOf[i]) {
          var de = ease(dotPs[i]);
          dotOf[i].style.opacity = de.toFixed(3);
          dotOf[i].style.transform = 'scale(' + de.toFixed(3) + ')';
        }
      }
      area.setAttribute('points', pts.join(' '));
    }

    // 구간 [delay, delay+dur] 진행도
    function prog(t, delay, dur) {
      var p = (t - delay) / dur;
      return p < 0 ? 0 : (p > 1 ? 1 : p);
    }

    function frame(now) {
      if (!start) start = now;
      var t = now - start;
      var dotPs = [], areaPs = [], done = true;

      for (var i = 0; i < goal.length; i++) {
        dotPs.push(prog(t, DOT_DELAY[i], DOT_DUR));
        var p = prog(t, DELAY[i], DUR[i]);
        if (p < 1) done = false;
        areaPs.push(p);
      }

      render(dotPs, areaPs);
      raf = done ? 0 : requestAnimationFrame(frame);
    }

    render([0, 0, 0], [0, 0, 0]);   // 시작 전에는 점도 삼각형도 없음

    return {
      play: function () {
        if (raf) return;                          // 재생 중이면 그대로
        start = 0;
        raf = requestAnimationFrame(frame);
      },
      reset: function () {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        render([0, 0, 0], [0, 0, 0]);
      }
    };
  }

  initRadar();

})();
