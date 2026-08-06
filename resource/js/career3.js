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


  /* ---------- 체크박스 필터 ----------
     그룹 내 OR, 그룹 간 AND. 아무것도 안 고르면 전체 노출 */
  var boxes = document.querySelectorAll('.fl-item input[data-filter]');
  var cards = document.querySelectorAll('.jb-card');
  var result = document.querySelector('.jb-result');
  var numOn = document.querySelector('.jb-n-on');
  var emptyTxt = document.querySelector('.jb-empty-txt');
  var emptyDefault = emptyTxt ? emptyTxt.textContent : '';

  function apply() {
    // 그룹별 체크된 값 모으기
    var picked = {};
    Array.prototype.forEach.call(boxes, function (box) {
      if (!box.checked) return;
      var g = box.getAttribute('data-filter');
      (picked[g] = picked[g] || []).push(box.value);
    });

    var shown = 0;

    Array.prototype.forEach.call(cards, function (card) {
      var ok = Object.keys(picked).every(function (g) {
        // 카드 값은 공백 구분 다중값
        var vals = (card.getAttribute('data-' + g) || '').split(/\s+/);
        return picked[g].some(function (v) { return vals.indexOf(v) > -1; });
      });

      card.classList.toggle('is-off', !ok);
      card.classList.toggle('is-on', ok);
      if (ok) shown++;
    });

    // 건수 갱신 + 결과 없음 안내
    if (numOn) numOn.textContent = shown + '건';
    if (result) result.classList.toggle('is-noresult', shown === 0);
    if (emptyTxt) emptyTxt.textContent = shown === 0 ? '조건에 맞는 채용공고가 없습니다.' : emptyDefault;
  }

  Array.prototype.forEach.call(boxes, function (box) {
    box.addEventListener('change', apply);
  });

})();
