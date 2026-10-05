(function () {
  const W = window.WEDDING;
  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const lines = (arr) => arr.map((l) => `<p>${l ? esc(l) : "&nbsp;"}</p>`).join("");

  const [y, m, d] = W.date.split("-").map(Number);
  const [hh, mm] = W.time.split(":").map(Number);
  const weddingAt = new Date(y, m - 1, d, hh, mm);
  const KO_DAYS = ["일", "월", "화", "수", "목", "금", "토"];
  const EN_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const dow = weddingAt.getDay();
  const ampm = hh < 12 ? "오전" : "오후";
  const h12 = hh % 12 || 12;
  const koTime = `${ampm} ${h12}시${mm ? ` ${mm}분` : ""}`;
  const pad = (n) => String(n).padStart(2, "0");
  const venueFull = `${W.venue.name} ${W.venue.hall}`;

  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    toast("복사되었습니다");
  }

  /* 모달 */
  function openModal(id) {
    $(id).classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal(el) {
    el.classList.remove("open");
    if (!document.querySelector(".modal.open, .lightbox.open")) document.body.style.overflow = "";
  }
  document.querySelectorAll(".modal, .lightbox").forEach((m) => {
    m.addEventListener("click", (e) => {
      if (e.target === m || e.target.closest("[data-close]")) closeModal(m);
    });
  });

  /* 메인 */
  $("mainImg").src = W.mainImage;
  $("introGroom").textContent = W.groom.name;
  $("introBride").textContent = W.bride.name;
  const enH = hh % 12 || 12;
  $("introDate").textContent = `${y}.${pad(m)}.${pad(d)}. ${EN_DAYS[dow]} ${enH}:${pad(mm)}${hh < 12 ? "AM" : "PM"}`;
  $("introVenue").textContent = venueFull;
  document.title = `${W.groom.firstName} ❤️ ${W.bride.firstName} 결혼합니다.`;

  /* 인사말 */
  $("greetingText").innerHTML = lines(W.greeting);
  const parentRow = (p, rel, child) =>
    `<span class="pn">${esc(p.father.name)} · ${esc(p.mother.name)}</span>` +
    `<span class="rel">의 <b>${esc(rel)}</b></span>` +
    `<span class="child">${esc(child)}</span>`;
  $("parents").innerHTML =
    parentRow(W.groom, W.groom.relation, W.groom.firstName) + parentRow(W.bride, W.bride.relation, W.bride.firstName);

  /* 연락하기 */
  const phoneIcon =
    '<svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>';
  const smsIcon =
    '<svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>';
  const contactRow = (who, name, phone) =>
    phone
      ? `<div class="contact-row"><span class="who">${who}</span><span class="nm">${esc(name)}</span>` +
        `<a href="tel:${esc(phone)}" aria-label="전화">${phoneIcon}</a><a href="sms:${esc(phone)}" aria-label="문자">${smsIcon}</a></div>`
      : "";
  $("contactList").innerHTML = ["groom", "bride"]
    .map((side) => {
      const p = W[side];
      const label = side === "groom" ? "신랑" : "신부";
      return (
        `<div class="contact-group"><h4>${label}측</h4>` +
        contactRow(label, p.name, p.phone) +
        contactRow(`${label} 아버지`, p.father.name, p.father.phone) +
        contactRow(`${label} 어머니`, p.mother.name, p.mother.phone) +
        `</div>`
      );
    })
    .join("");
  $("contactBtn").addEventListener("click", () => openModal("contactModal"));

  /* 예식일자 */
  $("monthRoll").innerHTML = [-2, -1, 0, 1, 2]
    .map((o) => {
      const mo = ((m - 1 + o + 12) % 12) + 1;
      return `<span class="${o === 0 ? "cur" : Math.abs(o) === 1 ? "near" : ""}">${mo}</span>`;
    })
    .join("");
  $("dayText").innerHTML = `${y}년 ${m}월 ${d}일 ${KO_DAYS[dow]}요일<br>${koTime}`;

  const first = new Date(y, m - 1, 1).getDay();
  const last = new Date(y, m, 0).getDate();
  let cal = "<tr>" + KO_DAYS.map((k) => `<th>${k}</th>`).join("") + "</tr><tr>";
  for (let i = 0; i < first; i++) cal += "<td></td>";
  for (let day = 1; day <= last; day++) {
    if ((first + day - 1) % 7 === 0 && day !== 1) cal += "</tr><tr>";
    cal += `<td class="${day === d ? "today" : ""}"><span>${day}</span></td>`;
  }
  cal += "</tr>";
  $("calendar").innerHTML = cal;

  const today = new Date();
  const diff = Math.ceil(
    (new Date(y, m - 1, d) - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000
  );
  const couple = `${W.groom.firstName} ♥ ${W.bride.firstName}`;
  $("dday").innerHTML =
    diff > 0
      ? `${esc(couple)}의 결혼식이 <b>${diff}일</b> 남았습니다.`
      : diff === 0
      ? `오늘은 ${esc(couple)}의 결혼식 날입니다.`
      : `${esc(couple)}의 결혼식이 <b>${-diff}일</b> 지났습니다.`;

  /* 갤러리 */
  const grid = $("galleryGrid");
  grid.innerHTML = W.gallery
    .map((src, i) => `<button data-i="${i}"><img src="${esc(src)}" loading="lazy" alt="갤러리 사진 ${i + 1}" /></button>`)
    .join("");
  const wrap = $("galleryWrap");
  let expanded = false;
  function collapsedHeight() {
    const items = grid.children;
    if (items.length <= 4) return grid.scrollHeight;
    return items[3].offsetTop + items[3].offsetHeight * 0.75;
  }
  function setGalleryHeight() {
    wrap.style.maxHeight = (expanded ? grid.scrollHeight : collapsedHeight()) + "px";
  }
  if (W.gallery.length <= 4) {
    $("galleryMore").classList.add("hidden");
    $("galleryFade").classList.add("hidden");
  }
  $("galleryMore").addEventListener("click", () => {
    expanded = !expanded;
    $("galleryFade").classList.toggle("hidden", expanded);
    $("galleryMore").textContent = expanded ? "갤러리 접기" : "갤러리 더 보기";
    setGalleryHeight();
    if (!expanded) wrap.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  window.addEventListener("resize", setGalleryHeight);
  requestAnimationFrame(setGalleryHeight);

  let lbIndex = 0;
  function showLb(i) {
    lbIndex = (i + W.gallery.length) % W.gallery.length;
    $("lbImg").src = W.gallery[lbIndex];
    $("lbCount").textContent = `${lbIndex + 1} / ${W.gallery.length}`;
  }
  grid.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    showLb(Number(b.dataset.i));
    $("lightbox").classList.add("open");
    document.body.style.overflow = "hidden";
  });
  $("lbPrev").addEventListener("click", () => showLb(lbIndex - 1));
  $("lbNext").addEventListener("click", () => showLb(lbIndex + 1));
  let touchX = null;
  $("lightbox").addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
  $("lightbox").addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) showLb(lbIndex + (dx < 0 ? 1 : -1));
    touchX = null;
  });
  document.addEventListener("keydown", (e) => {
    if (!$("lightbox").classList.contains("open")) return;
    if (e.key === "ArrowLeft") showLb(lbIndex - 1);
    if (e.key === "ArrowRight") showLb(lbIndex + 1);
    if (e.key === "Escape") closeModal($("lightbox"));
  });

  /* 안내 탭 */
  function renderNotice(i) {
    const n = W.notices[i];
    $("noticePanel").innerHTML = (n.image ? `<img src="${esc(n.image)}" alt="${esc(n.title)}" />` : "") + lines(n.lines);
    [...$("noticeTabs").children].forEach((b, j) => b.classList.toggle("active", i === j));
  }
  $("noticeTabs").innerHTML = W.notices.map((n, i) => `<button data-i="${i}">${esc(n.title)}</button>`).join("");
  $("noticeTabs").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) renderNotice(Number(b.dataset.i));
  });
  if (W.notices.length) renderNotice(0);
  else document.querySelector(".info").classList.add("hidden");

  /* 오시는 길 */
  const V = W.venue;
  $("locName").textContent = venueFull;
  $("locAddr").textContent = V.address;
  $("mapFrame").src = `https://maps.google.com/maps?q=${V.lat},${V.lng}&z=16&hl=ko&output=embed`;
  $("naverLink").href = `https://map.naver.com/p/search/${encodeURIComponent(V.name + " " + V.address)}`;
  $("kakaoLink").href = `https://map.kakao.com/link/map/${encodeURIComponent(V.name)},${V.lat},${V.lng}`;
  $("tmapLink").href = `tmap://route?goalname=${encodeURIComponent(V.name)}&goalx=${V.lng}&goaly=${V.lat}`;
  $("tmapLink").addEventListener("click", () => {
    setTimeout(() => {
      if (!document.hidden) toast("티맵 앱이 설치되어 있어야 합니다");
    }, 1500);
  });
  $("transport").innerHTML = V.transport
    .map((t) => `<div><h4>${esc(t.title)}</h4>${t.lines.map((l) => `<p>${esc(l)}</p>`).join("")}</div>`)
    .join("");

  /* 참석여부 */
  const calIcon = "🗓";
  const pinIcon = "📍";
  const rsvpInfo = `<p>${calIcon} ${m}월 ${d}일 ${KO_DAYS[dow]}요일 ${koTime}</p><p>${pinIcon} ${esc(venueFull)}</p>`;
  $("rsvpTitle").textContent = W.rsvp.title;
  $("rsvpText").innerHTML = lines(W.rsvp.lines);
  $("rsvpInfo").innerHTML = rsvpInfo;
  $("popupTitle").textContent = W.rsvp.title;
  $("popupText").innerHTML = lines(W.rsvp.lines);
  $("popupInfo").innerHTML = `<p>💍 신랑 ${esc(W.groom.name)} &amp; 신부 ${esc(W.bride.name)}</p>` + rsvpInfo;

  document.querySelectorAll("[data-open-rsvp]").forEach((b) =>
    b.addEventListener("click", () => {
      closeModal($("rsvpPopup"));
      openModal("rsvpModal");
    })
  );

  const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  $("noShowToday").addEventListener("change", (e) => {
    if (e.target.checked) localStorage.setItem("rsvpHide", todayKey);
    else localStorage.removeItem("rsvpHide");
  });
  if (W.rsvp.showPopup && localStorage.getItem("rsvpHide") !== todayKey && diff >= 0) {
    setTimeout(() => openModal("rsvpPopup"), 1500);
  }

  $("rsvpForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.createdAt = new Date().toISOString();
    try {
      if (W.rsvp.endpoint) {
        await fetch(W.rsvp.endpoint, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ type: "rsvp", ...data }),
        });
      } else {
        const list = JSON.parse(localStorage.getItem("rsvpList") || "[]");
        list.push(data);
        localStorage.setItem("rsvpList", JSON.stringify(list));
      }
      e.target.reset();
      closeModal($("rsvpModal"));
      toast("참석 여부가 전달되었습니다. 감사합니다!");
    } catch (err) {
      toast("전송에 실패했습니다. 다시 시도해주세요");
    }
  });

  /* 방명록 */
  const fmt = (dt) =>
    `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  let entries = [];
  const gbHtml = (list) =>
    list.length
      ? list
          .map(
            (g) =>
              `<div class="gb-item"><p class="gb-name">from.${esc(g.name)}</p><p class="gb-msg">${esc(g.message)}</p><p class="gb-date">${esc(g.date)}</p></div>`
          )
          .join("")
      : '<p class="gb-empty">첫 번째 축하 메세지를 남겨주세요.</p>';
  function renderGb() {
    $("gbList").innerHTML = gbHtml(entries.slice(0, 3));
    $("gbAllList").innerHTML = gbHtml(entries);
  }
  async function loadGb() {
    if (W.guestbook.endpoint) {
      try {
        const res = await fetch(W.guestbook.endpoint);
        entries = await res.json();
      } catch (e) {
        entries = [];
      }
    } else {
      entries = JSON.parse(localStorage.getItem("guestbook") || "[]").concat(W.guestbook.samples || []);
    }
    renderGb();
  }
  $("gbAll").addEventListener("click", () => openModal("gbAllModal"));
  $("gbWrite").addEventListener("click", () => openModal("gbModal"));
  $("gbForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const entry = { name: f.get("name").trim(), message: f.get("message").trim(), date: fmt(new Date()) };
    if (!entry.name || !entry.message) return;
    if (W.guestbook.endpoint) {
      await fetch(W.guestbook.endpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ type: "guestbook", ...entry }),
      }).catch(() => {});
    } else {
      const saved = JSON.parse(localStorage.getItem("guestbook") || "[]");
      saved.unshift(entry);
      localStorage.setItem("guestbook", JSON.stringify(saved));
    }
    entries.unshift(entry);
    renderGb();
    e.target.reset();
    closeModal($("gbModal"));
    toast("축하 메세지가 등록되었습니다");
  });
  loadGb();

  /* 마음 전하실 곳 */
  const groomIcon =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6f6863" stroke-width="1.2"><circle cx="12" cy="9" r="5"/><path d="M7 8c1-3 9-3 10 0M9 20l3-3 3 3M4 23c1-4 4-6 8-6s7 2 8 6"/></svg>';
  const brideIcon =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6f6863" stroke-width="1.2"><circle cx="12" cy="9" r="5"/><path d="M6 10c-1-6 13-6 12 0M5 6c2-4 12-4 14 0M4 23c1-4 4-6 8-6s7 2 8 6"/></svg>';
  function renderAccordion(id, title, icon, list) {
    const el = $(id);
    el.innerHTML =
      `<button class="acc-head">${icon}<span>${title}</span><span class="chev">▲</span></button>` +
      `<div class="acc-body">${list
        .map(
          (a, i) =>
            `<div class="acc-row"><div><p class="label">${esc(a.label)}</p><p class="num">${esc(a.bank)} ${esc(
              a.number
            )}</p><p class="holder">${esc(a.holder)}</p></div><button class="copy-btn" data-i="${i}">복사하기</button></div>`
        )
        .join("")}</div>`;
    const body = el.querySelector(".acc-body");
    el.querySelector(".acc-head").addEventListener("click", () => {
      const open = el.classList.toggle("open");
      body.style.maxHeight = open ? body.scrollHeight + "px" : "0";
    });
    body.addEventListener("click", (e) => {
      const b = e.target.closest(".copy-btn");
      if (!b) return;
      const a = list[Number(b.dataset.i)];
      copy(`${a.bank} ${a.number} ${a.holder}`);
    });
  }
  renderAccordion("accGroom", "신랑측", groomIcon, W.accounts.groom);
  renderAccordion("accBride", "신부측", brideIcon, W.accounts.bride);

  if (W.flowerUrl) $("flowerBanner").href = W.flowerUrl;
  else $("flowerBanner").classList.add("hidden");

  /* 엔딩 */
  document.querySelector(".outro-inner").style.backgroundImage = `url("${W.outroImage}")`;
  $("outroText").innerHTML = lines(W.outro);
  $("shareBtn").addEventListener("click", async () => {
    const url = location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url });
        return;
      } catch (e) {
        if (e.name === "AbortError") return;
      }
    }
    copy(url);
  });

  /* 배경음악 */
  if (W.bgm) {
    const audio = $("bgm");
    const btn = $("bgmBtn");
    audio.src = W.bgm;
    audio.volume = 0.5;
    btn.classList.remove("hidden");
    const sync = () => btn.classList.toggle("playing", !audio.paused);
    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      audio.paused ? audio.play() : audio.pause();
    });
    const firstTouch = () => {
      audio.play().catch(() => {});
      document.removeEventListener("click", firstTouch);
      document.removeEventListener("touchstart", firstTouch);
    };
    audio.play().catch(() => {
      document.addEventListener("click", firstTouch);
      document.addEventListener("touchstart", firstTouch);
    });
  }

  /* 스크롤 등장 효과 */
  const io = new IntersectionObserver(
    (ents) =>
      ents.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("show");
          io.unobserve(en.target);
        }
      }),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".fade-up").forEach((el) => io.observe(el));

  /* 벚꽃잎 효과 */
  const canvas = $("petals");
  const ctx = canvas.getContext("2d");
  let cw, ch;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    cw = window.innerWidth;
    ch = window.innerHeight;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);
  const rand = (a, b) => a + Math.random() * (b - a);
  const petals = Array.from({ length: 22 }, () => ({
    x: rand(0, cw),
    y: rand(-ch, ch),
    s: rand(5, 10),
    vy: rand(0.4, 1.0),
    vx: rand(-0.3, 0.4),
    r: rand(0, Math.PI * 2),
    vr: rand(-0.02, 0.02),
    sway: rand(0, Math.PI * 2),
    a: rand(0.5, 0.9),
  }));
  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.r);
    ctx.globalAlpha = p.a;
    ctx.fillStyle = "#f6c9d3";
    ctx.beginPath();
    ctx.moveTo(0, -p.s);
    ctx.bezierCurveTo(p.s * 0.9, -p.s * 0.6, p.s * 0.6, p.s * 0.7, 0, p.s);
    ctx.bezierCurveTo(-p.s * 0.6, p.s * 0.7, -p.s * 0.9, -p.s * 0.6, 0, -p.s);
    ctx.fill();
    ctx.restore();
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function tick() {
    ctx.clearRect(0, 0, cw, ch);
    for (const p of petals) {
      p.sway += 0.01;
      p.x += p.vx + Math.sin(p.sway) * 0.4;
      p.y += p.vy;
      p.r += p.vr;
      if (p.y > ch + 20) {
        p.y = -20;
        p.x = rand(0, cw);
      }
      if (p.x > cw + 20) p.x = -20;
      if (p.x < -20) p.x = cw + 20;
      drawPetal(p);
    }
    requestAnimationFrame(tick);
  }
  if (!reduce) tick();
})();
