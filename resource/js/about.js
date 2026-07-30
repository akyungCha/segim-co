/* ============================================================
   About 페이지 전용 스크립트
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ---------- 헤더 높이만큼 보정한 스무스 앵커 스크롤 ---------- */
  function headerH() {
    var gnb = document.getElementById('gnb');
    return gnb ? gnb.offsetHeight : 0;
  }

  function scrollToId(id, smooth) {
    var el = document.getElementById(id);
    if (!el) return false;
    var y = el.getBoundingClientRect().top + window.pageYOffset - headerH();
    window.scrollTo({ top: Math.max(0, y), behavior: (smooth && !reduce) ? 'smooth' : 'auto' });
    return true;
  }

  // 경로 비교용 정규화 : 앞 슬래시·.html 제거
  // (clean URL "/about"과 파일명 "about.html" 둘 다 같은 값으로 취급)
  function normPath(p) {
    return p.replace(/^\//, '').replace(/\.html$/, '');
  }

  // 같은 페이지 앵커 링크 가로채기 ("/about#intro" 형태 포함)
  document.addEventListener('click', function (e) {
    var a = e.target;
    while (a && a.tagName !== 'A') a = a.parentNode;
    if (!a || !a.getAttribute) return;

    var href = a.getAttribute('href') || '';
    var hash = href.indexOf('#');
    if (hash < 0) return;

    var path = href.slice(0, hash);
    var id = href.slice(hash + 1);
    if (!id) return;
    // 다른 페이지로 가는 링크는 그대로 둠
    if (path && normPath(path) !== normPath(location.pathname)) return;
    if (!document.getElementById(id)) return;

    e.preventDefault();
    document.body.classList.remove('menu-open');   // 모바일 전체메뉴 닫기
    scrollToId(id, true);
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  });

  // 다른 페이지에서 #history로 진입한 경우 : 기본 점프를 헤더 높이만큼 보정
  if (location.hash.length > 1) {
    var target = location.hash.slice(1);
    window.addEventListener('load', function () {
      setTimeout(function () { scrollToId(target, false); }, 0);
    });
  }


  /* ---------- 타임라인 전용 리빌 (공용 .reveal 옵저버와 분리) ---------- */
  function initTimelineReveal(tl) {
    var items = tl.querySelectorAll('.reveal-tl');
    if (!items.length) return;

    // 스태거 : 노드 → 연도 제목 → 행들 (0.12초 간격)
    Array.prototype.forEach.call(tl.querySelectorAll('.tl-row'), function (row) {
      var cols = row.querySelectorAll('.tl-col');
      for (var c = 0; c < cols.length; c++) {
        var base = .10 + c * .06;                       // 우측 열은 살짝 뒤에
        var year = cols[c].querySelector('.tl-year');
        if (year) year.style.setProperty('--d', base.toFixed(2) + 's');
        var lis = cols[c].querySelectorAll('.tl-list li');
        for (var i = 0; i < lis.length; i++) {
          lis[i].style.setProperty('--d', (base + .12 * (i + 1)).toFixed(2) + 's');
        }
      }
    });

    // 모션 최소화 · 옵저버 미지원이면 즉시 표시
    if (reduce || !('IntersectionObserver' in window)) {
      for (var k = 0; k < items.length; k++) items[k].classList.add('is-in');
      return;
    }

    // 화면 78% 지점(= 라인 끝이 그려지는 높이)까지 들어와야 시작
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        entries[i].target.classList.add('is-in');
        io.unobserve(entries[i].target);   // 1회만
      }
    }, { rootMargin: '0px 0px -22% 0px', threshold: .2 });

    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }


  /* ---------- 타임라인 : 라인 드로잉 + 전용 리빌 타이밍 ---------- */
  function initTimeline() {
    var tl = document.getElementById('tl');
    var line = document.getElementById('tlLine');
    if (!tl || !line) return;   // 타임라인이 없는 페이지면 종료

    initTimelineReveal(tl);

    // 모션 최소화 : 라인을 다 그려진 상태로 두고 스크롤 연동 없음
    if (reduce) {
      line.style.transform = 'scaleY(1)';
      return;
    }

    var raf = 0;

    function draw() {
      raf = 0;
      var r = tl.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      // 라인 끝이 화면 78% 높이에 머물도록 (= 리빌 트리거와 같은 지점)
      // 높이는 항상 실측이라 블록 간격을 바꿔도 그대로 맞음
      var p = (vh * .78 - r.top) / r.height;
      if (p < 0) p = 0;
      if (p > 1) p = 1;
      line.style.transform = 'scaleY(' + p.toFixed(4) + ')';
    }

    function onScroll() {
      if (!raf) raf = requestAnimationFrame(draw);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    draw();
  }

  initTimeline();

})();
