/* =====================================================================
   공통 스크립트 — 모든 페이지가 <head>에서 이 파일 하나를 불러옵니다.

   하는 일
   1. 테마(시스템/밝게/어둡게): 사이트 전체에서 하나의 설정을 공유
   2. 학습 페이지: section.lec[data-title] 를 읽어 목차, 모바일 이동 메뉴,
      "학습 완료" 체크, 진행률 막대를 자동으로 만듦
   3. 자료 목록(홈): 각 자료 카드에 진행률 표시
   4. 그림(svg.d)에서 쓰는 화살표 정의를 페이지에 넣음

   학습 페이지 <body> 속성
     data-page   진행 상황을 저장할 고유 이름 (예: "linux")
     data-brand  목차 맨 위 영문 표기 (예: "LINUX")
     data-name   자료 이름 (예: "리눅스 첫걸음")
     data-home   자료 목록으로 돌아가는 경로 (보통 "../index.html")

   각 장 <section class="lec" id="..."> 속성
     data-num    목차 번호 (예: "3", "A")
     data-group  목차 묶음 제목 (같은 값이 이어지면 한 묶음)
     data-title  목차와 완료 체크에 쓸 장 제목
     data-track  "false" 이면 완료 체크·진행률에서 제외 (부록 등)
   ===================================================================== */
(function () {
  "use strict";

  var THEME_KEY = "site-theme";
  var THEMES = ["system", "light", "dark"];
  var THEME_NAMES = { system: "시스템", light: "밝게", dark: "어둡게" };

  function getItem(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function setItem(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* 저장 불가 환경은 무시 */ }
  }
  function progressKey(page) { return "progress:" + page; }
  function readProgress(page) {
    try {
      var p = JSON.parse(getItem(progressKey(page)) || "null");
      if (p && typeof p === "object") return { done: p.done || {}, total: p.total || 0 };
    } catch (e) { /* 손상된 값은 새로 시작 */ }
    return { done: {}, total: 0 };
  }
  function countDone(p) {
    var n = 0;
    for (var k in p.done) if (p.done[k]) n++;
    return n;
  }

  /* ---------- 1. 테마: 화면이 그려지기 전에 바로 적용 ---------- */
  var theme = getItem(THEME_KEY);
  if (THEMES.indexOf(theme) < 0) theme = "system";
  function applyTheme() {
    if (theme === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", theme);
    var btns = document.querySelectorAll(".theme-btn");
    for (var i = 0; i < btns.length; i++) btns[i].textContent = "테마: " + THEME_NAMES[theme];
  }
  applyTheme();

  function wireThemeButtons() {
    var btns = document.querySelectorAll(".theme-btn");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function () {
        theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
        setItem(THEME_KEY, theme);
        applyTheme();
      });
    }
    applyTheme();
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function backLink(href, text) {
    var a = el("a", "back");
    a.href = href;
    var arr = el("span", "arr", "←");
    arr.setAttribute("aria-hidden", "true");
    a.appendChild(arr);
    a.appendChild(document.createTextNode(text));
    return a;
  }

  /* ---------- 4. 그림용 화살표 정의 ---------- */
  function injectMarkers() {
    if (!document.querySelector("svg.d")) return;
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("style", "position:absolute;width:0;height:0;overflow:hidden");
    var defs = document.createElementNS(ns, "defs");
    [["ah", "mk", 7], ["ah-a", "mk-a", 6], ["ah-ok", "mk-ok", 6]].forEach(function (m) {
      var mk = document.createElementNS(ns, "marker");
      mk.setAttribute("id", m[0]);
      mk.setAttribute("viewBox", "0 0 10 10");
      mk.setAttribute("refX", "9");
      mk.setAttribute("refY", "5");
      mk.setAttribute("markerWidth", m[2]);
      mk.setAttribute("markerHeight", m[2]);
      mk.setAttribute("orient", "auto-start-reverse");
      var path = document.createElementNS(ns, "path");
      path.setAttribute("d", "M0 0 L10 5 L0 10 z");
      path.setAttribute("class", m[1]);
      mk.appendChild(path);
      defs.appendChild(mk);
    });
    svg.appendChild(defs);
    document.body.insertBefore(svg, document.body.firstChild);
  }

  /* ---------- 2. 학습 페이지 ---------- */
  function buildStudyPage(shell) {
    var body = document.body;
    var page = body.getAttribute("data-page") || location.pathname;
    // 파일을 직접 열었을 때도 폴더 목록이 아닌 홈 화면으로 가도록 index.html 까지 적는다
    var home = body.getAttribute("data-home") || "../index.html";
    var secs = Array.prototype.slice.call(document.querySelectorAll("section.lec[data-title]"));
    if (!secs.length) return;

    var tracked = secs.filter(function (s) { return s.getAttribute("data-track") !== "false"; });
    var progress = readProgress(page);

    // 왼쪽 목차
    var nav = el("nav", "index");
    nav.setAttribute("aria-label", "목차");
    var back = backLink(home, "자료 목록");
    nav.appendChild(back);

    var brand = el("div", "brand");
    brand.appendChild(el("span", "mh", body.getAttribute("data-brand") || ""));
    brand.appendChild(el("span", "sub", body.getAttribute("data-name") || document.title));
    nav.appendChild(brand);

    var prog = el("div", "progress");
    var bar = el("div", "bar");
    var fill = el("i");
    bar.appendChild(fill);
    var label = el("span", "lbl");
    prog.appendChild(bar);
    prog.appendChild(label);
    if (tracked.length) nav.appendChild(prog);

    var links = {};
    var currentGroup = null;
    var list = null;
    secs.forEach(function (s) {
      var group = s.getAttribute("data-group") || "";
      if (!list || group !== currentGroup) {
        currentGroup = group;
        var box = el("div");
        if (group) box.appendChild(el("h4", null, group));
        list = el("ol");
        box.appendChild(list);
        nav.appendChild(box);
      }
      var a = el("a");
      a.href = "#" + s.id;
      a.appendChild(el("span", "n", s.getAttribute("data-num") || ""));
      a.appendChild(document.createTextNode(s.getAttribute("data-title")));
      a.appendChild(el("span", "done", s.getAttribute("data-track") === "false" ? "" : "✓"));
      var li = el("li");
      li.appendChild(a);
      list.appendChild(li);
      links[s.id] = a;
    });

    var themeBtn = el("button", "theme-btn");
    themeBtn.type = "button";
    nav.appendChild(themeBtn);

    // 좁은 화면용 이동 메뉴
    var mnav = el("div", "mnav");
    var row = el("div", "row");
    var mback = backLink(home, "목록");
    var sel = el("select");
    sel.id = "mjump";
    sel.setAttribute("aria-label", "장으로 이동");
    var first = el("option", null, "장으로 이동…");
    first.value = "";
    sel.appendChild(first);
    secs.forEach(function (s) {
      var o = el("option", null, (s.getAttribute("data-num") || "") + " · " + s.getAttribute("data-title"));
      o.value = s.id;
      sel.appendChild(o);
    });
    sel.addEventListener("change", function () {
      var t = sel.value && document.getElementById(sel.value);
      if (t) t.scrollIntoView();
      sel.value = "";
    });
    row.appendChild(mback);
    row.appendChild(sel);
    mnav.appendChild(row);

    shell.insertBefore(mnav, shell.firstChild);
    shell.insertBefore(nav, shell.firstChild);

    // 각 장 끝의 "학습 완료" 체크
    var boxes = tracked.map(function (s) {
      var rowDone = el("div", "done-row");
      var input = el("input");
      input.type = "checkbox";
      input.id = "done-" + s.id;
      var lab = el("label", null, s.getAttribute("data-title") + " 학습 완료");
      lab.htmlFor = input.id;
      rowDone.appendChild(input);
      rowDone.appendChild(lab);
      s.appendChild(rowDone);
      input.addEventListener("change", function () {
        progress.done[s.id] = input.checked;
        save();
        render();
      });
      return { id: s.id, input: input };
    });

    function save() {
      // 존재하지 않는 장의 기록은 정리
      var clean = {};
      boxes.forEach(function (b) { if (progress.done[b.id]) clean[b.id] = true; });
      progress.done = clean;
      progress.total = boxes.length;
      setItem(progressKey(page), JSON.stringify(progress));
    }
    function render() {
      var n = 0;
      boxes.forEach(function (b) {
        var on = !!progress.done[b.id];
        b.input.checked = on;
        if (on) n++;
        if (links[b.id]) links[b.id].classList.toggle("is-done", on);
      });
      fill.style.width = (boxes.length ? n / boxes.length * 100 : 0) + "%";
      label.textContent = n + " / " + boxes.length + " 완료";
    }
    save();
    render();

    // 지금 읽는 장 표시
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          for (var id in links) links[id].classList.remove("active");
          if (links[en.target.id]) links[en.target.id].classList.add("active");
        });
      }, { rootMargin: "-20% 0px -70% 0px" });
      secs.forEach(function (s) { io.observe(s); });
    }
  }

  /* ---------- 3. 자료 목록(홈) ---------- */
  function fillHomeProgress() {
    var cards = document.querySelectorAll(".course[data-page]");
    for (var i = 0; i < cards.length; i++) {
      var p = readProgress(cards[i].getAttribute("data-page"));
      var meta = cards[i].querySelector("[data-progress]");
      if (!meta) continue;
      var n = countDone(p);
      var fill = meta.querySelector("i");
      var text = meta.querySelector("span:last-child");
      if (p.total) {
        if (fill) fill.style.width = (n / p.total * 100) + "%";
        if (text) text.textContent = n + " / " + p.total + " 완료";
      } else if (text) {
        text.textContent = "아직 시작 전";
      }
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    injectMarkers();
    var shell = document.querySelector(".shell");
    if (shell) buildStudyPage(shell);
    fillHomeProgress();
    wireThemeButtons();
  });
})();
