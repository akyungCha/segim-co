/* ============================================================
   채용공고 페이지 전용 스크립트
   상태 전환·필터 접기 모두 클래스만 토글 (표시는 CSS가 담당)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 필터 그룹 접기/펼치기 ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.fl-head'), function (btn) {
    btn.addEventListener('click', function () {
      var group = btn.parentNode;
      var open = group.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });


  /* ---------- DEV : 있음/없음 토글 (배포 시 이 블록 삭제) ---------- */
  var devBtn = document.getElementById('jbToggle');
  var body = document.getElementById('jbBody');

  if (devBtn && body) {
    devBtn.addEventListener('click', function () {
      var empty = body.classList.toggle('is-empty');
      devBtn.textContent = empty ? '채용공고 O' : '채용공고 X';
    });
  }

})();
