"use strict";

/* =====================================
   1. بيانات الفرح - عدّلها هنا
   (كل البيانات الحالية تجريبية ووهمية)
===================================== */

const WEDDING = {
    groom: "آدم",
    bride: "ليلى",
    groomEn: "Adam",
    brideEn: "Layla",

    // التاريخ: السنة-الشهر-اليوم T الساعة:الدقيقة +02:00 (توقيت القاهرة)
    // اليوم والتاريخ والساعة بتتكتب تلقائيًا في الصفحة من هنا.
    date: "2027-03-05T20:00:00+02:00",

    venue: "قاعة اللؤلؤة",
    address: "وسط البلد، القاهرة، مصر",

    // إحداثيات القاعة (للخريطة وزر الاتجاهات)
    lat: 30.0444,
    lng: 31.2357,

    // رقم واتساب استقبال التهاني (رقم وهمي للعرض التجريبي - غيّره برقم العروسين)
    whatsappNumber: "201000000000",

    // صورة العروسين داخل القوس في أول الصفحة.
    // حط الصورة (مرخصة) في assets واكتب مسارها هنا، مثال: "assets/couple-main.jpg"
    // لو سبتها فاضية بيظهر حرفين الأسماء بشكل أنيق بدل الصورة.
    couplePhoto: "assets/couple-main.jpg"
};

/* =====================================
   2. عناصر الصفحة
===================================== */

const $ = id => document.getElementById(id);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const intro = $("introScreen");
const invitation = $("invitation");
const envelope = $("envelope");
const openButton = $("openInvitation");
const sealButton = $("sealButton");
const music = $("weddingMusic");
const musicButton = $("musicButton");
const veil = $("veil");
const progressBar = $("progress");

let opened = false;
let musicPlaying = false;
let countdownTimer = null;

/* =====================================
   3. تحديث بيانات العروسين (من مكان واحد)
===================================== */

function cairoParts(date) {
    const parts = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
        timeZone: "Africa/Cairo",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hourCycle: "h23"
    }).formatToParts(date);

    const get = type => (parts.find(p => p.type === type) || {}).value || "";
    return {
        weekday: get("weekday"),
        day: get("day"),
        month: get("month"),
        year: get("year"),
        hour: Number(get("hour")),
        minute: get("minute")
    };
}

function buildDateTexts() {
    const when = new Date(WEDDING.date);

    if (Number.isNaN(when.getTime())) {
        return { dateText: "", timeText: "" };
    }

    const p = cairoParts(when);
    const hour12 = p.hour % 12 === 0 ? 12 : p.hour % 12;
    const period = p.hour >= 12 ? "مساءً" : "صباحًا";

    return {
        dateText: `${p.weekday}، ${p.day} ${p.month} ${p.year}`,
        timeText: `${hour12}:${p.minute} ${period}`
    };
}

function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
}

function updateWeddingDetails() {
    const {
        dateText,
        timeText
    } = buildDateTexts();

    document.querySelectorAll("[data-groom]").forEach(el => {
        el.textContent = WEDDING.groom;
    });

    document.querySelectorAll("[data-bride]").forEach(el => {
        el.textContent = WEDDING.bride;
    });

    document.querySelectorAll("[data-groom-en]").forEach(el => {
        el.textContent = WEDDING.groomEn;
    });

    document.querySelectorAll("[data-bride-en]").forEach(el => {
        el.textContent = WEDDING.brideEn;
    });

    const gi = WEDDING.groomEn.charAt(0).toUpperCase();
    const bi = WEDDING.brideEn.charAt(0).toUpperCase();

    document.querySelectorAll("[data-groom-initial], [data-arch-groom]").forEach(el => {
        el.textContent = gi;
    });

    document.querySelectorAll("[data-bride-initial], [data-arch-bride]").forEach(el => {
        el.textContent = bi;
    });

    document.querySelectorAll("[data-seal]").forEach(el => {
        el.textContent = `${gi}·${bi}`;
    });

    setText("heroDateText", dateText);
    setText("detailDate", dateText);
    setText("detailTime", timeText);
    setText("detailVenue", WEDDING.venue);
    setText("detailAddress", WEDDING.address);
    setText("mapVenueName", WEDDING.venue);
    setText("mapVenueAddress", WEDDING.address);

    const query = encodeURIComponent(`${WEDDING.lat},${WEDDING.lng}`);

    $("weddingMap").src =
        `https://maps.google.com/maps?q=${query}&z=16&output=embed`;

    $("openMapDirections").href =
        `https://www.google.com/maps/search/?api=1&query=${query}`;

    document.title = `دعوة زفاف ${WEDDING.groom} و${WEDDING.bride}`;
}

/* =====================================
   4. البتلات والغبار الذهبي
===================================== */

const fx = (() => {
    const canvas = $("fx");
    const ctx = canvas.getContext("2d");
    const colors = ["#f3c6d0", "#e9a9b8", "#fbe3e8", "#efd9a8", "#d68a9d"];

    let w = 0;
    let h = 0;
    let dpr = 1;
    let parts = [];
    let running = false;
    let last = 0;
    let mode = "intro";

    const rand = (a, b) => a + Math.random() * (b - a);

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function petal(burst) {
        const size = rand(7, 14);

        return {
            kind: "petal",
            x: burst ? w / 2 + rand(-40, 40) : rand(0, w),
            y: burst ? h * 0.62 : rand(-40, -10),
            vx: burst ? rand(-260, 260) : rand(-14, 14),
            vy: burst ? rand(-520, -180) : rand(26, 60),
            g: burst ? 340 : 0,
            drag: burst ? 0.985 : 1,
            rot: rand(0, Math.PI * 2),
            vr: rand(-2, 2),
            size,
            sway: rand(0.6, 1.6),
            phase: rand(0, 6.28),
            color: colors[Math.floor(rand(0, colors.length))],
            life: burst ? rand(3.2, 5) : Infinity,
            age: 0,
            alpha: rand(0.55, 0.9)
        };
    }

    function dust() {
        return {
            kind: "dust",
            x: rand(0, w),
            y: rand(0, h),
            vx: rand(-6, 6),
            vy: rand(-12, -3),
            size: rand(0.8, 2.2),
            phase: rand(0, 6.28),
            speed: rand(0.8, 2),
            life: Infinity,
            age: 0
        };
    }

    function fill(kind, count, burst) {
        for (let i = 0; i < count; i++) {
            parts.push(kind === "petal" ? petal(burst) : dust());
        }
    }

    function drawPetal(p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(p.phase)));
        ctx.globalAlpha = p.alpha * Math.min(1, (p.life - p.age) * 1.2);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.bezierCurveTo(p.size * 0.9, -p.size * 0.5, p.size * 0.7, p.size * 0.8, 0, p.size);
        ctx.bezierCurveTo(-p.size * 0.7, p.size * 0.8, -p.size * 0.9, -p.size * 0.5, 0, -p.size);
        ctx.fill();
        ctx.restore();
    }

    function drawDust(p, t) {
        const a = 0.25 + 0.55 * Math.abs(Math.sin(t * p.speed + p.phase));
        ctx.globalAlpha = a;
        ctx.fillStyle = "#f0d9a0";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }

    function frame(now) {
        if (!running) return;

        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        const t = now / 1000;

        ctx.clearRect(0, 0, w, h);

        for (let i = parts.length - 1; i >= 0; i--) {
            const p = parts[i];
            p.age += dt;

            if (p.kind === "petal") {
                p.vy += p.g * dt;
                p.vx *= p.drag;
                p.vy *= p.drag;
                p.x += (p.vx + Math.sin(t * p.sway + p.phase) * 18) * dt;
                p.y += p.vy * dt;
                p.rot += p.vr * dt;
                p.phase += dt * 2.2;
                drawPetal(p);

                if (p.age > p.life || p.y > h + 30 || p.x < -40 || p.x > w + 40) {
                    parts.splice(i, 1);

                    if (p.life === Infinity) {
                        const np = petal(false);
                        parts.push(np);
                    }
                }
            } else {
                p.x += p.vx * dt;
                p.y += p.vy * dt;

                if (p.y < -5) p.y = h + 5;
                if (p.x < -5) p.x = w + 5;
                if (p.x > w + 5) p.x = -5;

                drawDust(p, t);
            }
        }

        ctx.globalAlpha = 1;
        requestAnimationFrame(frame);
    }

    function start() {
        if (reducedMotion || running) return;
        running = true;
        last = performance.now();
        requestAnimationFrame(frame);
    }

    function stop() {
        running = false;
        ctx.clearRect(0, 0, w, h);
    }

    function setMode(next) {
        mode = next;
        const small = w < 600;

        parts = parts.filter(p => p.life !== Infinity);

        if (next === "intro") {
            fill("dust", small ? 34 : 60, false);
            fill("petal", small ? 12 : 20, false);
        } else {
            canvas.classList.add("ambient");
            fill("petal", small ? 8 : 14, false);
        }
    }

    function burst() {
        if (reducedMotion) return;
        fill("petal", w < 600 ? 46 : 80, true);
    }

    window.addEventListener("resize", resize);

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            running = false;
        } else if (!reducedMotion) {
            start();
        }
    });

    resize();

    return {
        start,
        stop,
        setMode,
        burst,
        get mode() {
            return mode;
        }
    };
})();

/* =====================================
   5. فتح الظرف (الموسيقى تبدأ مع ضغطة الفتح)
===================================== */

function openInvitation() {
    if (opened) return;
    opened = true;

    openButton.disabled = true;
    sealButton.disabled = true;
    $("openLabel").textContent = "جاري فتح الدعوة...";

    envelope.classList.add("opened");
    fx.burst();

    // الموسيقى تبدأ مع ضغطة فتح الدعوة (ضغطة المستخدم بتسمح للمتصفح بالصوت)
    startMusicFromOpen();

    const wait = ms => reducedMotion ? 0 : ms;

    // 1) الستارة بتتوسع من مركز الظرف
    setTimeout(() => {
        veil.classList.add("expand");
    }, wait(1500));

    // 2) نبدّل الشاشة والستارة مغطية كل حاجة، وبعدها تتلاشى
    setTimeout(() => {
        invitation.classList.remove("hidden");
        intro.style.display = "none";

        document.documentElement.style.overflow = "";
        document.body.style.overflow = "auto";
        window.scrollTo(0, 0);

        fx.setMode("ambient");
        progressBar.classList.add("on");

        updateCountdown();
        startCountdown();
        initMotion();
        onScroll();

        veil.classList.remove("expand");
        veil.classList.add("fade");

        setTimeout(() => {
            veil.classList.remove("fade");
            veil.style.display = "none";
        }, wait(1100));
    }, wait(2750));
}

openButton.addEventListener("click", openInvitation);
sealButton.addEventListener("click", openInvitation);

/* =====================================
   6. زر الموسيقى (أيقونة فقط - يشتغل بالضغط بس)
===================================== */

function updateMusicButton() {
    musicButton.classList.toggle("playing", musicPlaying);
    musicButton.setAttribute("aria-pressed", String(musicPlaying));
    musicButton.setAttribute("aria-label", musicPlaying ? "إيقاف الموسيقى" : "تشغيل الموسيقى");
    musicButton.title = musicPlaying ? "إيقاف الموسيقى" : "تشغيل الموسيقى";
}

function fadeMusicIn() {
    music.volume = 0;
    let v = 0;

    const timer = setInterval(() => {
        v = Math.min(v + 0.08, 0.7);
        music.volume = v;

        if (v >= 0.7) clearInterval(timer);
    }, 110);
}

let musicStarted = false;

function startMusicFromOpen() {
    if (musicPlaying) return;

    fadeMusicIn();

    const p = music.play();

    if (p && typeof p.then === "function") {
        p.then(() => {
            musicStarted = true;
            musicButton.classList.add("touched");
        }).catch(error => {
            // لو المتصفح منع الصوت، الزر يفضل متاح للتشغيل بالضغط
            console.warn("تعذر تشغيل الموسيقى تلقائيًا:", error);
            music.volume = 0.7;
        });
    }
}

musicButton.addEventListener("click", async() => {
    musicButton.classList.add("touched");

    if (musicPlaying) {
        music.pause();
        return;
    }

    try {
        if (!musicStarted) {
            fadeMusicIn();
        } else {
            music.volume = 0.7;
        }

        await music.play();
        musicStarted = true;
    } catch (error) {
        musicPlaying = false;
        updateMusicButton();
        showToast("تعذر تشغيل الموسيقى على هذا الجهاز");
    }
});

music.addEventListener("play", () => {
    musicPlaying = true;
    updateMusicButton();
});

music.addEventListener("pause", () => {
    musicPlaying = false;
    updateMusicButton();
});

music.addEventListener("error", () => {
    console.error("ملف الموسيقى غير موجود أو لا يمكن تشغيله.");
    musicButton.hidden = true;
});

/* =====================================
   7. العد التنازلي
===================================== */

function updateCountdown() {
    const target = new Date(WEDDING.date).getTime();
    const difference = target - Date.now();

    if (!Number.isFinite(target)) {
        setText("countdownMessage", "يرجى التأكد من تاريخ الفرح.");
        return;
    }

    if (difference <= 0) {
        ["days", "hours", "minutes", "seconds"].forEach(id => setText(id, "00"));
        setText("countdownMessage", "أجمل يوم وصل، نتمنى لكم فرحة لا تُنسى");

        if (countdownTimer) {
            clearInterval(countdownTimer);
            countdownTimer = null;
        }

        return;
    }

    const days = Math.floor(difference / 86400000);
    const hours = Math.floor((difference / 3600000) % 24);
    const minutes = Math.floor((difference / 60000) % 60);
    const seconds = Math.floor((difference / 1000) % 60);
    const pad = n => String(n).padStart(2, "0");

    setText("days", pad(days));
    setText("hours", pad(hours));
    setText("minutes", pad(minutes));
    setText("seconds", pad(seconds));
    setText("countdownMessage", "الفرحة قربت، مستنيينكم تشاركونا أجمل يوم");
}

function startCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);

    updateCountdown();
    countdownTimer = setInterval(updateCountdown, 1000);
}

/* =====================================
   8. ظهور الأقسام وشريط التقدم
===================================== */

let motionStarted = false;
let countdownRan = false;
const parallaxEls = [];

function splitTitles() {
    document.querySelectorAll('[data-anim="split"]').forEach(el => {
        if (el.dataset.splitDone) return;
        el.dataset.splitDone = "1";

        const words = el.textContent.trim().split(/\s+/);
        el.setAttribute("aria-label", words.join(" "));
        el.textContent = "";

        words.forEach((word, i) => {
            const w = document.createElement("span");
            const inner = document.createElement("span");

            w.className = "w";
            w.setAttribute("aria-hidden", "true");
            inner.textContent = word;
            inner.style.setProperty("--i", i);
            w.append(inner);
            el.append(w);

            if (i < words.length - 1) el.append(" ");
        });
    });
}

function applyDelays() {
    document.querySelectorAll("[data-delay]").forEach(el => {
        el.style.setProperty("--delay", `${el.dataset.delay}s`);
    });

    document.querySelectorAll("[data-stagger]").forEach(group => {
        const step = parseFloat(group.dataset.stagger) || 0.12;

        group.querySelectorAll(":scope > [data-anim]").forEach((child, i) => {
            child.style.setProperty("--delay", `${(i * step).toFixed(2)}s`);
        });
    });
}

function countUp() {
    if (countdownRan) return;
    countdownRan = true;
    if (reducedMotion) return;

    ["days", "hours", "minutes", "seconds"].forEach((id, i) => {
        const el = $(id);
        if (!el) return;
        setTimeout(() => {
            el.classList.add("tick");
            setTimeout(() => el.classList.remove("tick"), 600);
        }, i * 120);
    });
}

function initMotion() {
    if (motionStarted) return;
    motionStarted = true;

    splitTitles();
    applyDelays();

    const items = document.querySelectorAll("[data-anim]");

    if (reducedMotion || !("IntersectionObserver" in window)) {
        items.forEach(el => el.classList.add("in"));
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add("in");
            observer.unobserve(entry.target);

            if (entry.target.closest("#countdown")) countUp();
        });
    }, {
        threshold: 0,
        rootMargin: "0px 0px -10% 0px"
    });

    items.forEach(el => observer.observe(el));

    document.querySelectorAll("[data-parallax]").forEach(el => {
        parallaxEls.push({
            el,
            k: parseFloat(el.dataset.parallax) || 0.1
        });
    });
}

function updateParallax() {
    if (reducedMotion || window.innerWidth < 0) return;

    const y = window.scrollY;

    // الحركة بس لما الجزء العلوي ظاهر (توفير للأداء على الموبايل)
    if (y > window.innerHeight * 1.5) return;

    parallaxEls.forEach(({
        el,
        k
    }) => {
        el.style.transform = `translate3d(0, ${(y * k).toFixed(1)}px, 0)`;
    });
}

/* صورة العروسين: لو الملف موجود تظهر، لو لأ يفضل الحرفين */

function loadCouplePhoto() {
    const photo = $("archPhoto");
    if (!photo || !WEDDING.couplePhoto) return;

    const probe = new Image();

    probe.onload = () => {
        photo.src = probe.src;
        photo.hidden = false;
        $("arch").classList.add("has-photo");
        const fb = document.querySelector(".arch-fallback");
        if (fb) fb.style.display = "none";
    };

    probe.onerror = () => {};
    probe.src = WEDDING.couplePhoto;
}

let scrollTicking = false;

function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;

    requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;

        progressBar.style.transform = `scaleX(${p})`;
        updateParallax();
        scrollTicking = false;
    });
}

window.addEventListener("scroll", onScroll, {
    passive: true
});

/* =====================================
   9. معرض الصور وتكبيرها
===================================== */

const lightbox = $("lightbox");
const lightboxImage = $("lightboxImage");
const lightboxClose = $("lightboxClose");
let lastFocus = null;

function closeLightbox() {
    if (!lightbox.classList.contains("active")) return;

    lightbox.classList.remove("active");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "auto";

    if (lastFocus) lastFocus.focus();
}

document.querySelectorAll(".gallery-item").forEach(button => {
    button.addEventListener("click", () => {
        const image = button.querySelector("img");

        if (!image || !image.currentSrc) return;

        lastFocus = button;
        lightboxImage.src = image.currentSrc;
        lightboxImage.alt = image.alt;

        lightbox.classList.add("active");
        lightbox.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        lightboxClose.focus();
    });
});

lightboxClose.addEventListener("click", closeLightbox);

lightbox.addEventListener("click", event => {
    if (event.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeLightbox();
});

/* =====================================
   10. إضافة الفرح إلى التقويم
===================================== */

function calendarDate(date) {
    return date.toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "");
}

function escapeCalendarText(value) {
    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");
}

$("calendarButton").addEventListener("click", () => {
    const start = new Date(WEDDING.date);

    if (Number.isNaN(start.getTime())) {
        showToast("تأكد من كتابة تاريخ الفرح بطريقة صحيحة.");
        return;
    }

    const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);

    const content = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Wedding Invitation//AR",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        `UID:wedding-${start.getTime()}@invitation.local`,
        `DTSTAMP:${calendarDate(new Date())}`,
        `DTSTART:${calendarDate(start)}`,
        `DTEND:${calendarDate(end)}`,
        `SUMMARY:${escapeCalendarText(`زفاف ${WEDDING.groom} و${WEDDING.bride}`)}`,
        `LOCATION:${escapeCalendarText(`${WEDDING.venue} - ${WEDDING.address}`)}`,
        `DESCRIPTION:${escapeCalendarText("يسعدنا حضوركم ومشاركتنا أجمل لحظات العمر.")}`,
        "BEGIN:VALARM",
        "TRIGGER:-PT3H",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeCalendarText("الفرح النهارده، مستنيينكم!")}`,
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([content], {
        type: "text/calendar;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "wedding-invitation.ics";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("تم تجهيز الموعد لإضافته إلى التقويم");
});

/* =====================================
   11. مشاركة الدعوة ونسخ الرابط
===================================== */

let toastTimer;

function showToast(message) {
    let toast = $("toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.className = "toast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

async function copyInvitationLink() {
    const link = window.location.href;

    try {
        await navigator.clipboard.writeText(link);
    } catch (error) {
        const input = document.createElement("textarea");

        input.value = link;
        input.style.position = "fixed";
        input.style.opacity = "0";

        document.body.appendChild(input);
        input.select();

        const copied = document.execCommand("copy");
        input.remove();

        if (!copied) {
            showToast("انسخ رابط الدعوة من شريط العنوان.");
            return false;
        }
    }

    const label = $("copyLabel");
    const oldText = label.textContent;

    label.textContent = "تم نسخ الرابط ✓";
    setTimeout(() => {
        label.textContent = oldText;
    }, 2000);

    return true;
}

$("copyButton").addEventListener("click", copyInvitationLink);

$("shareButton").addEventListener("click", async() => {
    const data = {
        title: document.title,
        text: `يسعدنا دعوتكم لحضور زفاف ${WEDDING.groom} و${WEDDING.bride}`,
        url: window.location.href
    };

    if (navigator.share) {
        try {
            await navigator.share(data);
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error("تعذرت مشاركة الدعوة:", error);
            }
        }
    } else if (await copyInvitationLink()) {
        showToast("تم نسخ رابط الدعوة، يمكنك إرساله لأصدقائك.");
    }
});

/* =====================================
   12. نموذج التهنئة عبر واتساب
===================================== */

const wishesName = $("wishesName");
const wishesMessage = $("wishesMessage");

[wishesName, wishesMessage].forEach(field => {
    field.addEventListener("input", () => field.classList.remove("invalid"));
});

$("wishesForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = wishesName.value.trim();
    const message = wishesMessage.value.trim();

    wishesName.classList.toggle("invalid", !name);
    wishesMessage.classList.toggle("invalid", !message);

    if (!name || !message) {
        setText("wishesStatus", "اكتب اسمك ورسالة التهنئة أولًا.");
        (!name ? wishesName : wishesMessage).focus();
        return;
    }

    const whatsappMessage =
        `تهنئة بمناسبة زفاف ${WEDDING.groom} و${WEDDING.bride}\n\n` +
        `الاسم: ${name}\n\n` +
        `رسالة التهنئة:\n${message}`;

    const whatsappUrl =
        `https://wa.me/${WEDDING.whatsappNumber}?text=` +
        encodeURIComponent(whatsappMessage);

    setText("wishesStatus", "جاري فتح واتساب لإرسال التهنئة");

    // نفتح واتساب في تبويب جديد من غير ما نخرج من الدعوة
    const link = document.createElement("a");

    link.href = whatsappUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    document.body.appendChild(link);
    link.click();
    link.remove();
});

/* =====================================
   13. تجهيز الصفحة
===================================== */

document.addEventListener("DOMContentLoaded", () => {
    updateWeddingDetails();
    updateMusicButton();
    loadCouplePhoto();

    invitation.classList.add("hidden");
    document.body.style.overflow = "hidden";

    fx.setMode("intro");
    fx.start();
});
