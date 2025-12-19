function downloadContact() {
      const vCard = `BEGIN:VCARD
VERSION:3.0
FN:Stavros Katinaris
EMAIL:stavroskatinaris@gmail.com
TEL:+306987563753
URL:https://github.com/StavrosKatinaris
item1.URL:https://www.linkedin.com/in/stavros-katinaris-02b646169/
item1.X-ABLabel:LinkedIn
BDAY:19960719
END:VCARD`;

      const blob = new Blob([vCard], { type: "text/vcard" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "StavrosContact.vcf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    }

// Background animation:
// 1) Dots leave NO permanent traces (canvas is fully cleared each frame).
// 2) Each dot has a short "tail" made from its recent positions.
// 3) Dot and tail share the same color.
// 4) No shadow/glow on either dot or tail.
// 5) Parameters are commented so you can tune the look.
(() => {
  const canvas = document.getElementById("bg");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });

  // ---- Parameters you can tweak ----
  const DOTS = 50;                 // how many moving dots
  const GRID_STEP = 30;           // px per step; smaller = denser movement
  const TICK_MS = 80;             // movement cadence; lower = faster movement
  const EDGE_MARGIN = 10;         // keep dots away from screen edges
  const TAIL_POINTS = 5;         // tail length in "segments" (history size)
  const TAIL_WIDTH = 2;           // tail line thickness
  const DOT_RADIUS = 2.0;         // dot size
  const COLOR = "rgba(117, 49, 228, 1)"; // ONE color for dot + tail
  // ---------------------------------

  const DPR = Math.min(2, window.devicePixelRatio || 1); // cap for performance

  function resize() {
    canvas.width = Math.floor(window.innerWidth * DPR);
    canvas.height = Math.floor(window.innerHeight * DPR);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    // Work in CSS pixels while rendering crisply on HiDPI screens
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  // Directions for grid-walk (4-neighborhood)
  const DIRS = [
    [ 1, 0], [-1, 0],
    [ 0, 1], [ 0,-1],
  ];

  function snapToGrid(x, y) {
    return [
      Math.round(x / GRID_STEP) * GRID_STEP,
      Math.round(y / GRID_STEP) * GRID_STEP,
    ];
  }

  function clampToBounds(x, y) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    x = Math.max(EDGE_MARGIN, Math.min(w - EDGE_MARGIN, x));
    y = Math.max(EDGE_MARGIN, Math.min(h - EDGE_MARGIN, y));
    return [x, y];
  }

  // Each dot stores a short history of positions for the tail.
  // history[0] is the oldest point, history[history.length-1] is the newest.
  const dots = [];
  for (let i = 0; i < DOTS; i++) {
    const [x, y] = snapToGrid(
      window.innerWidth * (0.25 + Math.random() * 0.50),
      window.innerHeight * (0.20 + Math.random() * 0.60)
    );

    const history = [];
    for (let k = 0; k < TAIL_POINTS; k++) history.push({ x, y });

    dots.push({
      x,
      y,
      // Keep a direction for a few steps so motion feels less jittery.
      dir: DIRS[(Math.random() * DIRS.length) | 0],
      keep: 2 + ((Math.random() * 10) | 0),
      history,
    });
  }

  let last = performance.now();
  let acc = 0;

  function frame(now) {
    // Clear everything each frame so NOTHING persists on the canvas.
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    acc += (now - last);
    last = now;

    // Update in fixed "ticks" so speed stays stable across frame rates.
    while (acc >= TICK_MS) {
      acc -= TICK_MS;

      for (const d of dots) {
        // Pick a new direction occasionally.
        if (d.keep <= 0) {
          d.dir = DIRS[(Math.random() * DIRS.length) | 0];
          d.keep = 2 + ((Math.random() * 10) | 0);
        }
        d.keep--;

        d.x += d.dir[0] * GRID_STEP;
        d.y += d.dir[1] * GRID_STEP;
        [d.x, d.y] = clampToBounds(d.x, d.y);

        // If we hit a boundary, force a turn next tick.
        if (
          d.x === EDGE_MARGIN || d.x === window.innerWidth - EDGE_MARGIN ||
          d.y === EDGE_MARGIN || d.y === window.innerHeight - EDGE_MARGIN
        ) {
          d.keep = 0;
        }

        // Push new position into tail history (drop the oldest)
        d.history.shift();
        d.history.push({ x: d.x, y: d.y });
      }
    }

    // ---- Draw tails (no shadow, one color) ----
    ctx.lineWidth = TAIL_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = COLOR;

    for (const d of dots) {
      // Tail fades by alpha along its length (same color, varying transparency)
      for (let i = 1; i < d.history.length; i++) {
        const a = i / (d.history.length - 1); // 0..1 (old..new)
        ctx.globalAlpha = a;                  // older = fainter
        ctx.beginPath();
        ctx.moveTo(d.history[i - 1].x, d.history[i - 1].y);
        ctx.lineTo(d.history[i].x, d.history[i].y);
        ctx.stroke();
      }
    }

    // ---- Draw dots (no shadow, same color) ----
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLOR;
    for (const d of dots) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
