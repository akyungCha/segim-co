/* ============================================================
   공통 스크립트 (모든 페이지 공용)
   ============================================================ */
(function () {
  'use strict';

  var PC_MIN = 1025;                                  // 이 폭 이상이면 PC 메뉴
  var body = document.body;
  var gnb = document.getElementById('gnb');
  var menuBtn = document.getElementById('menuBtn');
  var menuDim = document.getElementById('menuDim');
  var menuItems = document.querySelectorAll('.menu-item.has-sub');

  function isPC() { return window.innerWidth >= PC_MIN; }

  // JS 동작 표시 (스크립트가 없으면 .reveal이 숨겨지지 않도록)
  // head의 인라인 스크립트에서 이미 붙였으면 건너뜀 — 늦게 붙으면 숨김이 트랜지션으로 처리돼 깜빡임
  var root = document.documentElement;
  if (!/(^|\s)js(\s|$)/.test(root.className)) root.className += ' js';


  /* ---------- GNB 스크롤 상태 ---------- */
  function onScroll() {
    if (!gnb) return;
    gnb.classList.toggle('is-scrolled', window.pageYOffset > 10);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();


  /* ---------- 2depth 열기/닫기 ---------- */
  function openSub(item, open) {
    item.classList.toggle('is-open', open);
    var btn = item.querySelector('.sub-btn');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function closeAllSub() {
    for (var i = 0; i < menuItems.length; i++) openSub(menuItems[i], false);
  }

  // 헤더 하단 서브 바 : 열린 2depth가 하나라도 있을 때만 펼침 (PC 전용)
  function syncBar() {
    if (!gnb) return;
    var open = false;
    for (var i = 0; i < menuItems.length; i++) {
      if (menuItems[i].classList.contains('is-open')) { open = true; break; }
    }
    gnb.classList.toggle('sub-open', open && isPC());
  }

  // 메뉴 사이를 빠르게 오갈 때 깜빡이지 않도록 닫힘만 살짝 지연
  var closeTimer;

  function scheduleClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(function () { closeAllSub(); syncBar(); }, 120);
  }

  function cancelClose() { clearTimeout(closeTimer); }

  Array.prototype.forEach.call(document.querySelectorAll('.menu-item'), function (item) {
    var hasSub = item.classList.contains('has-sub');

    // PC : 호버하면 그 메뉴만 열림. 하위 없는 메뉴로 넘어가면 서브 바는 닫힘(밑줄만)
    item.addEventListener('mouseenter', function () {
      if (!isPC()) return;
      cancelClose();
      closeAllSub();
      if (hasSub) openSub(item, true);
      syncBar();
    });

    if (!hasSub) return;

    // 키보드 포커스로도 동일하게
    item.addEventListener('focusin', function () {
      if (!isPC()) return;
      cancelClose();
      closeAllSub();
      openSub(item, true);
      syncBar();
    });

    item.addEventListener('focusout', function () {
      if (isPC() && !item.contains(document.activeElement)) scheduleClose();
    });

    // 모바일 : 버튼으로 아코디언
    var btn = item.querySelector('.sub-btn');
    if (btn) {
      btn.addEventListener('click', function () {
        openSub(item, !item.classList.contains('is-open'));
      });
    }
  });

  // 헤더와 서브 바를 하나의 호버 영역으로 묶음
  // (서브 바는 .gnb::after라 그 위에 있어도 gnb를 벗어난 것으로 처리되지 않음)
  if (gnb) {
    gnb.addEventListener('mouseenter', cancelClose);
    gnb.addEventListener('mouseleave', function () { if (isPC()) scheduleClose(); });
  }


  /* ---------- 모바일 전체메뉴 ---------- */
  function toggleMenu(open) {
    body.classList.toggle('menu-open', open);
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? '전체메뉴 닫기' : '전체메뉴 열기');
    }
    if (!open) closeAllSub();
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      toggleMenu(!body.classList.contains('menu-open'));
    });
  }
  if (menuDim) menuDim.addEventListener('click', function () { toggleMenu(false); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { toggleMenu(false); closeAllSub(); syncBar(); }
  });


  /* ---------- 화면 높이 ---------- */
  // dvh 미지원 브라우저(구형 iOS)용 화면 높이 폴백
  function updateAppHeight() {
    var supportsDvh = window.CSS && CSS.supports && CSS.supports('height', '100dvh');
    if (supportsDvh) return;
    document.documentElement.style.setProperty('--app-h', window.innerHeight + 'px');
  }


  /* ---------- 히어로 마우스 글로우 (데스크톱 전용) ---------- */
  function initHeroGlow() {
    var hero = document.querySelector('.hero');
    // 히어로가 없는 페이지 · matchMedia 미지원이면 종료
    if (!hero || !window.matchMedia) return;
    // 터치 기기와 모션 최소화 설정에선 리스너 자체를 달지 않음
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var glow = document.createElement('div');
    glow.className = 'hero-glow';
    glow.setAttribute('aria-hidden', 'true');
    hero.appendChild(glow);

    var rect = hero.getBoundingClientRect();
    var mx = 0, my = 0;   // 커서 목표 좌표 (히어로 기준)
    var gx = 0, gy = 0;   // 실제 렌더 좌표
    var raf = 0;
    var placed = false;   // 첫 진입은 보간 없이 커서 위치에서 시작

    function updateRect() { rect = hero.getBoundingClientRect(); }

    // rAF 루프에서만 렌더 (mousemove는 좌표만 저장)
    function render() {
      gx += (mx - gx) * 0.1;   // lerp : 살짝 늦게 따라오는 관성
      gy += (my - gy) * 0.1;
      glow.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px,0)';
      raf = requestAnimationFrame(render);
    }

    hero.addEventListener('mousemove', function (e) {
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
      if (!placed) { gx = mx; gy = my; placed = true; }
    });

    hero.addEventListener('mouseenter', function () {
      updateRect();
      glow.classList.add('is-on');
      if (!raf) raf = requestAnimationFrame(render);
    });

    hero.addEventListener('mouseleave', function () {
      glow.classList.remove('is-on');
      placed = false;
      // 화면 밖에선 루프 정지
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    });

    // 스크롤·리사이즈로 히어로 위치가 바뀌면 기준 좌표 갱신
    window.addEventListener('scroll', updateRect, { passive: true });
    window.addEventListener('resize', updateRect);
  }

  initHeroGlow();


  /* ---------- 스크롤 리빌 (.reveal 공용) ---------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;   // 해당 요소가 없는 페이지면 종료

    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 모션 최소화 · IntersectionObserver 미지원이면 즉시 표시
    if (reduce || !('IntersectionObserver' in window)) {
      for (var i = 0; i < items.length; i++) items[i].classList.add('is-in');
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        entries[i].target.classList.add('is-in');
        io.unobserve(entries[i].target);   // 1회만 실행
      }
    }, { rootMargin: '0px 0px -10% 0px', threshold: .12 });

    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  initReveal();


  /* ---------- 리사이즈 / 초기 실행 ---------- */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (isPC()) toggleMenu(false);   // PC 폭으로 넓어지면 모바일 메뉴 정리
      closeAllSub();
      syncBar();
      updateAppHeight();
    }, 150);
  });

  updateAppHeight();

})();
