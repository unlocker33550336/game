const app = document.getElementById("app");

const SCREENS = {
  TITLE: "TITLE",
  ENV_SELECT: "ENV_SELECT",
  MARTIAL_CITY: "MARTIAL_CITY",
  TRIAL_LOBBY: "TRIAL_LOBBY",
  RECEPTION: "RECEPTION",
  TRIAL_ROOM: "TRIAL_ROOM",
  STYLE_BOARD: "STYLE_BOARD"
};

const state = {
  screen: SCREENS.TITLE,
  initialEnvironment: null,
  selectedWeaponId: "barehand"
};

const initialEnvironments = [
  {
    id: "bujin",
    name: "武人",
    status: "実装済み",
    description: "武術都市から始まる。お試し場で武器に触れ、自分の感覚で流派を探す。"
  },
  {
    id: "assassin",
    name: "殺し屋",
    status: "未設計",
    description: "裏社会・依頼・情報屋などの詳細が未決定のため、今は選択不可。"
  },
  {
    id: "wanderer",
    name: "流浪",
    status: "未設計",
    description: "旅・野試合・無所属の導線が未決定のため、今は選択不可。"
  },
  {
    id: "soldier",
    name: "軍人",
    status: "未設計",
    description: "軍施設・任務・部隊の導線が未決定のため、今は選択不可。"
  }
];

const weaponCategories = [
  {
    name: "素手系",
    description: "武器を持たない身体操作、近距離の攻防、構え、踏み込みを扱う流派カテゴリ。"
  },
  {
    name: "ナイフ系",
    description: "短い練習武器を使う流派カテゴリ。近い距離での素早い出入りを学ぶ。"
  },
  {
    name: "刀系",
    description: "練習刀などを使う流派カテゴリ。間合い、軌道、構えの安定を学ぶ。"
  },
  {
    name: "長物系",
    description: "棒や槍型の練習具など、長い道具を扱う流派カテゴリ。距離の管理を学ぶ。"
  },
  {
    name: "重量武器系",
    description: "重さのある練習具を扱う流派カテゴリ。振り始め、止め方、体重移動が重要になる。"
  },
  {
    name: "特殊武器系",
    description: "鎖状・変形・防御具寄りなど、通常カテゴリに収まらない道具を扱う流派カテゴリ。"
  }
];

const weapons = [
  {
    id: "barehand",
    name: "素手",
    category: "素手系",
    reach: 86,
    thickness: 18,
    weight: 0.45,
    kind: "hand"
  },
  {
    id: "practiceKnife",
    name: "練習用ナイフ",
    category: "ナイフ系",
    reach: 124,
    thickness: 10,
    weight: 0.7,
    kind: "short"
  },
  {
    id: "practiceBlade",
    name: "練習刀",
    category: "刀系",
    reach: 188,
    thickness: 12,
    weight: 1.0,
    kind: "blade"
  },
  {
    id: "practiceStaff",
    name: "練習棒",
    category: "長物系",
    reach: 240,
    thickness: 13,
    weight: 1.05,
    kind: "staff"
  },
  {
    id: "weightedTrainer",
    name: "重り付き練習具",
    category: "重量武器系",
    reach: 174,
    thickness: 22,
    weight: 1.85,
    kind: "heavy"
  },
  {
    id: "chainTrainer",
    name: "鎖状練習具",
    category: "特殊武器系",
    reach: 212,
    thickness: 9,
    weight: 1.25,
    kind: "special"
  }
];

function setScreen(screen) {
  state.screen = screen;
  render();
}

function html(strings, ...values) {
  return strings.reduce((result, str, i) => {
    const value = values[i] ?? "";
    return result + str + value;
  }, "");
}

function screenShell({ breadcrumb = "", title = "", body = "", actions = "" }) {
  return html`
    <main class="screen">
      <section class="shell">
        <div class="topbar">
          <div class="breadcrumb">${breadcrumb}</div>
          <button class="btn ghost" data-action="reset">タイトルへ</button>
        </div>
        <div class="hero">
          <h2>${title}</h2>
          ${body}
          ${actions ? `<div class="actions">${actions}</div>` : ""}
        </div>
      </section>
    </main>
  `;
}

function renderTitle() {
  app.innerHTML = html`
    <main class="screen">
      <section class="shell">
        <div class="hero">
          <div class="kicker">Standalone Prototype</div>
          <h1>BATTLE<br>ORIGIN</h1>
          <p class="lead">
            現代寄りの世界で、戦闘者たちが自分の目的に従って強くなる。
            今回の実装は、確定している導入部分だけに絞ったプロトタイプ。
          </p>
          <div class="actions">
            <button class="btn primary" data-action="start">始める</button>
          </div>
        </div>
      </section>
    </main>
  `;
}

function renderEnvironmentSelect() {
  const cards = initialEnvironments.map((env) => {
    const disabled = env.id !== "bujin";
    return html`
      <article class="card ${disabled ? "disabled" : "clickable"}" ${disabled ? "" : `data-action="select-env" data-env="${env.id}"`}>
        <div class="tag">${env.status}</div>
        <div class="card-title" style="margin-top:12px;">${env.name}</div>
        <div class="card-text">${env.description}</div>
      </article>
    `;
  }).join("");

  app.innerHTML = screenShell({
    breadcrumb: "初期環境の選択",
    title: "最初にどの環境から始めるか",
    body: html`
      <p class="muted">
        初期環境はクラスではない。開始地点、最初の人間関係、序盤の空気だけを決める。
        成長方向はその後の行動で変わる。
      </p>
      <div class="grid cards-4">${cards}</div>
    `
  });
}

function renderMartialCity() {
  app.innerHTML = screenShell({
    breadcrumb: "初期環境：武人",
    title: "武術都市",
    body: html`
      <p class="muted">
        ここには道場、稽古場、試合場、武器屋、師範、門下生、流派が集まっている。
        武人スタートでは、最初から流派を決めない。
      </p>
      <div class="note">
        まずはお試し場へ向かい、いろいろな武器を自分の手で触る。
        その感覚をもとに、あとで好きな流派を探す。
      </div>
    `,
    actions: `<button class="btn primary" data-action="go-lobby">お試し場へ向かう</button>`
  });
}

function renderTrialLobby() {
  app.innerHTML = screenShell({
    breadcrumb: "武術都市 / お試し場",
    title: "お試し場ロビー",
    body: html`
      <p class="muted">
        ロビーは広く、受付、案内板、待機している利用者がいる。
        ここは診断を受ける場所ではなく、自分で触って、自分で決めるための施設。
      </p>
      <div class="grid cards-2">
        <article class="card">
          <div class="card-title">受付</div>
          <div class="card-text">受付を済ませると、個室に案内される。</div>
        </article>
        <article class="card">
          <div class="card-title">流派案内板</div>
          <div class="card-text">武器カテゴリごとに流派を探すための案内板。武器を試したあとに見る。</div>
        </article>
      </div>
    `,
    actions: `
      <button class="btn primary" data-action="go-reception">受付へ</button>
      <button class="btn" data-action="go-board">案内板を見る</button>
    `
  });
}

function renderReception() {
  app.innerHTML = screenShell({
    breadcrumb: "武術都市 / お試し場 / 受付",
    title: "受付",
    body: html`
      <p class="muted">
        受付では最低限の説明だけを受ける。
        武器の適性評価やおすすめ診断は行わない。
      </p>
      <div class="note">
        「個室内の練習具は自由にお試しください。気になる系統があれば、ロビーの案内板から対応する流派を確認できます。」
      </div>
    `,
    actions: `<button class="btn primary" data-action="go-trial-room">個室へ移動する</button>`
  });
}

function renderStyleBoard() {
  const rows = weaponCategories.map((category) => html`
    <div class="board-row">
      <div class="board-category">${category.name}</div>
      <div class="board-desc">${category.description}<br><span class="muted">※具体的な流派名と道場の場所は、まだ未設定。</span></div>
    </div>
  `).join("");

  app.innerHTML = screenShell({
    breadcrumb: "武術都市 / お試し場 / 案内板",
    title: "流派案内板",
    body: html`
      <p class="muted">
        この案内板はおすすめを出さない。
        武器ごとに流派カテゴリをまとめ、プレイヤーが自分で行き先を選ぶためのもの。
      </p>
      <div class="board">${rows}</div>
      <p class="footer-hint">
        現時点ではカテゴリだけを実装。流派名、師範、道場位置、入門条件は未決定なので入れていない。
      </p>
    `,
    actions: `<button class="btn primary" data-action="go-lobby">ロビーへ戻る</button>`
  });
}

let trainingScene = null;

function renderTrialRoom() {
  app.innerHTML = html`
    <main class="screen">
      <section class="shell">
        <div class="topbar">
          <div class="breadcrumb">武術都市 / お試し場 / 個室</div>
          <button class="btn ghost" data-action="go-lobby">ロビーへ戻る</button>
        </div>

        <div class="room-layout">
          <aside class="side-panel">
            <h3>個室</h3>
            <p class="muted">
              マネキンと練習具だけが置かれている。
              評価表示は出ない。触って、自分で感じる。
            </p>

            <div class="weapon-list">
              ${weapons.map((weapon) => html`
                <button class="weapon-btn ${weapon.id === state.selectedWeaponId ? "active" : ""}" data-action="select-weapon" data-weapon="${weapon.id}">
                  <span class="weapon-name">${weapon.name}</span>
                  <span class="weapon-meta">${weapon.category}</span>
                </button>
              `).join("")}
            </div>

            <div class="stat-box">
              <div>操作：画面内をドラッグ / マウス移動</div>
              <div>目的：武器の動きや距離感を試す</div>
              <div>判定：マネキンに触れた時だけ軽い反応</div>
              <div>未実装：ダメージ、成長、流派効果、対人戦</div>
            </div>

            <div class="actions">
              <button class="btn" data-action="go-board">案内板を見る</button>
            </div>
          </aside>

          <section class="canvas-wrap">
            <canvas id="trainingCanvas" width="960" height="620" aria-label="練習用キャンバス"></canvas>
          </section>
        </div>
      </section>
    </main>
  `;

  const canvas = document.getElementById("trainingCanvas");
  trainingScene = new TrainingScene(canvas, () => getSelectedWeapon());
  trainingScene.start();
}

function getSelectedWeapon() {
  return weapons.find((weapon) => weapon.id === state.selectedWeaponId) ?? weapons[0];
}

function render() {
  if (trainingScene) {
    trainingScene.stop();
    trainingScene = null;
  }

  switch (state.screen) {
    case SCREENS.TITLE:
      renderTitle();
      break;
    case SCREENS.ENV_SELECT:
      renderEnvironmentSelect();
      break;
    case SCREENS.MARTIAL_CITY:
      renderMartialCity();
      break;
    case SCREENS.TRIAL_LOBBY:
      renderTrialLobby();
      break;
    case SCREENS.RECEPTION:
      renderReception();
      break;
    case SCREENS.TRIAL_ROOM:
      renderTrialRoom();
      break;
    case SCREENS.STYLE_BOARD:
      renderStyleBoard();
      break;
    default:
      renderTitle();
  }
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  const action = target.dataset.action;

  if (action === "reset") {
    state.initialEnvironment = null;
    setScreen(SCREENS.TITLE);
    return;
  }

  if (action === "start") {
    setScreen(SCREENS.ENV_SELECT);
    return;
  }

  if (action === "select-env") {
    const env = target.dataset.env;
    if (env !== "bujin") return;
    state.initialEnvironment = env;
    setScreen(SCREENS.MARTIAL_CITY);
    return;
  }

  if (action === "go-lobby") {
    setScreen(SCREENS.TRIAL_LOBBY);
    return;
  }

  if (action === "go-reception") {
    setScreen(SCREENS.RECEPTION);
    return;
  }

  if (action === "go-trial-room") {
    setScreen(SCREENS.TRIAL_ROOM);
    return;
  }

  if (action === "go-board") {
    setScreen(SCREENS.STYLE_BOARD);
    return;
  }

  if (action === "select-weapon") {
    state.selectedWeaponId = target.dataset.weapon;
    if (state.screen === SCREENS.TRIAL_ROOM) {
      renderTrialRoom();
    }
  }
});

class TrainingScene {
  constructor(canvas, getWeapon) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.getWeapon = getWeapon;
    this.running = false;
    this.raf = 0;

    this.pointer = {
      active: false,
      x: 0.58,
      y: 0.58,
      lastX: 0.58,
      lastY: 0.58,
      speed: 0
    };

    this.hand = {
      x: 0.5,
      y: 0.82,
      tx: 0.58,
      ty: 0.58
    };

    this.trail = [];
    this.hitFlash = 0;
    this.lastTime = performance.now();

    this.boundResize = () => this.resize();
    this.boundPointerDown = (event) => this.onPointerDown(event);
    this.boundPointerMove = (event) => this.onPointerMove(event);
    this.boundPointerUp = () => this.onPointerUp();
  }

  start() {
    this.running = true;
    this.resize();

    window.addEventListener("resize", this.boundResize);
    this.canvas.addEventListener("pointerdown", this.boundPointerDown);
    this.canvas.addEventListener("pointermove", this.boundPointerMove);
    window.addEventListener("pointerup", this.boundPointerUp);
    this.canvas.addEventListener("pointerleave", this.boundPointerUp);

    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);

    window.removeEventListener("resize", this.boundResize);
    this.canvas.removeEventListener("pointerdown", this.boundPointerDown);
    this.canvas.removeEventListener("pointermove", this.boundPointerMove);
    window.removeEventListener("pointerup", this.boundPointerUp);
    this.canvas.removeEventListener("pointerleave", this.boundPointerUp);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  getSize() {
    const rect = this.canvas.getBoundingClientRect();
    return {
      w: rect.width,
      h: rect.height
    };
  }

  onPointerDown(event) {
    this.canvas.setPointerCapture?.(event.pointerId);
    this.pointer.active = true;
    this.updatePointer(event);
  }

  onPointerMove(event) {
    this.updatePointer(event);
  }

  onPointerUp() {
    this.pointer.active = false;
  }

  updatePointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0.05, 0.95);
    const y = clamp((event.clientY - rect.top) / rect.height, 0.08, 0.92);

    const dx = x - this.pointer.x;
    const dy = y - this.pointer.y;
    this.pointer.lastX = this.pointer.x;
    this.pointer.lastY = this.pointer.y;
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.speed = Math.sqrt(dx * dx + dy * dy);
  }

  loop(time) {
    if (!this.running) return;

    const dt = Math.min(0.033, (time - this.lastTime) / 1000);
    this.lastTime = time;
    this.update(dt);
    this.draw();

    this.raf = requestAnimationFrame((nextTime) => this.loop(nextTime));
  }

  update(dt) {
    const weapon = this.getWeapon();
    const response = clamp(9 / weapon.weight, 3.5, 12);

    this.hand.tx = this.pointer.x;
    this.hand.ty = this.pointer.y;

    this.hand.x = lerp(this.hand.x, this.hand.tx, 1 - Math.exp(-response * dt));
    this.hand.y = lerp(this.hand.y, this.hand.ty, 1 - Math.exp(-response * dt));

    const size = this.getSize();
    const pose = this.computeWeaponPose(size, weapon);
    const hit = this.checkMannequinHit(pose.tipX, pose.tipY, size);

    if (hit) {
      this.hitFlash = 1;
    } else {
      this.hitFlash = Math.max(0, this.hitFlash - dt * 3.4);
    }

    this.trail.push({
      x: pose.tipX,
      y: pose.tipY,
      life: 1,
      hit
    });

    for (const point of this.trail) {
      point.life -= dt * 1.8;
    }
    this.trail = this.trail.filter((point) => point.life > 0).slice(-42);
  }

  computeWeaponPose(size, weapon) {
    const baseX = size.w * 0.5;
    const baseY = size.h * 0.92;
    const targetX = this.hand.x * size.w;
    const targetY = this.hand.y * size.h;

    const dx = targetX - baseX;
    const dy = targetY - baseY;
    const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const nx = dx / len;
    const ny = dy / len;

    const reachScale = Math.min(size.w, size.h) / 620;
    const reach = weapon.reach * reachScale;
    const handReach = weapon.kind === "hand" ? reach : reach * 0.42;

    const handX = baseX + nx * Math.min(len, handReach);
    const handY = baseY + ny * Math.min(len, handReach);
    const tipX = baseX + nx * Math.min(len + reach * 0.42, reach);
    const tipY = baseY + ny * Math.min(len + reach * 0.42, reach);

    return {
      baseX,
      baseY,
      handX,
      handY,
      tipX,
      tipY,
      nx,
      ny
    };
  }

  checkMannequinHit(x, y, size) {
    const dummy = this.getDummy(size);
    return (
      pointInCircle(x, y, dummy.head.x, dummy.head.y, dummy.head.r) ||
      pointInRoundedRect(x, y, dummy.body.x, dummy.body.y, dummy.body.w, dummy.body.h, 20) ||
      pointNearLine(x, y, dummy.leftArm.x1, dummy.leftArm.y1, dummy.leftArm.x2, dummy.leftArm.y2, 16) ||
      pointNearLine(x, y, dummy.rightArm.x1, dummy.rightArm.y1, dummy.rightArm.x2, dummy.rightArm.y2, 16)
    );
  }

  getDummy(size) {
    const cx = size.w * 0.5;
    const top = size.h * 0.17;
    const scale = Math.min(size.w, size.h) / 620;

    return {
      head: { x: cx, y: top + 58 * scale, r: 34 * scale },
      body: { x: cx - 55 * scale, y: top + 98 * scale, w: 110 * scale, h: 150 * scale },
      leftArm: { x1: cx - 55 * scale, y1: top + 120 * scale, x2: cx - 116 * scale, y2: top + 188 * scale },
      rightArm: { x1: cx + 55 * scale, y1: top + 120 * scale, x2: cx + 116 * scale, y2: top + 188 * scale },
      leftLeg: { x1: cx - 26 * scale, y1: top + 248 * scale, x2: cx - 60 * scale, y2: top + 344 * scale },
      rightLeg: { x1: cx + 26 * scale, y1: top + 248 * scale, x2: cx + 60 * scale, y2: top + 344 * scale }
    };
  }

  draw() {
    const ctx = this.ctx;
    const size = this.getSize();
    ctx.clearRect(0, 0, size.w, size.h);

    this.drawRoom(ctx, size);
    this.drawMannequin(ctx, size);
    this.drawTrail(ctx);
    this.drawPlayerHandsAndWeapon(ctx, size);
    this.drawHud(ctx, size);
  }

  drawRoom(ctx, size) {
    const gradient = ctx.createLinearGradient(0, 0, 0, size.h);
    gradient.addColorStop(0, "#111827");
    gradient.addColorStop(0.58, "#0b0f18");
    gradient.addColorStop(1, "#07090e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size.w, size.h);

    ctx.strokeStyle = "rgba(255,255,255,0.055)";
    ctx.lineWidth = 1;
    const grid = 56;
    for (let x = size.w * 0.5; x < size.w; x += grid) line(ctx, x, 0, x, size.h);
    for (let x = size.w * 0.5; x > 0; x -= grid) line(ctx, x, 0, x, size.h);

    ctx.strokeStyle = "rgba(217,181,111,0.10)";
    ctx.lineWidth = 2;
    line(ctx, size.w * 0.18, size.h * 0.74, size.w * 0.82, size.h * 0.74);
    line(ctx, size.w * 0.28, size.h * 0.50, size.w * 0.72, size.h * 0.50);

    ctx.fillStyle = "rgba(255,255,255,0.035)";
    ctx.fillRect(size.w * 0.12, size.h * 0.76, size.w * 0.76, size.h * 0.05);
  }

  drawMannequin(ctx, size) {
    const d = this.getDummy(size);

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const flash = this.hitFlash;
    const wood = `rgba(${150 + flash * 80}, ${118 + flash * 60}, ${78 + flash * 25}, 0.96)`;
    const edge = `rgba(${235}, ${210}, ${150}, ${0.35 + flash * 0.35})`;

    ctx.strokeStyle = edge;
    ctx.lineWidth = 16;
    line(ctx, d.leftArm.x1, d.leftArm.y1, d.leftArm.x2, d.leftArm.y2);
    line(ctx, d.rightArm.x1, d.rightArm.y1, d.rightArm.x2, d.rightArm.y2);
    line(ctx, d.leftLeg.x1, d.leftLeg.y1, d.leftLeg.x2, d.leftLeg.y2);
    line(ctx, d.rightLeg.x1, d.rightLeg.y1, d.rightLeg.x2, d.rightLeg.y2);

    ctx.strokeStyle = wood;
    ctx.lineWidth = 10;
    line(ctx, d.leftArm.x1, d.leftArm.y1, d.leftArm.x2, d.leftArm.y2);
    line(ctx, d.rightArm.x1, d.rightArm.y1, d.rightArm.x2, d.rightArm.y2);
    line(ctx, d.leftLeg.x1, d.leftLeg.y1, d.leftLeg.x2, d.leftLeg.y2);
    line(ctx, d.rightLeg.x1, d.rightLeg.y1, d.rightLeg.x2, d.rightLeg.y2);

    roundRect(ctx, d.body.x, d.body.y, d.body.w, d.body.h, 20);
    ctx.fillStyle = wood;
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(d.head.x, d.head.y, d.head.r, 0, Math.PI * 2);
    ctx.fillStyle = wood;
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 3;
    ctx.stroke();

    if (flash > 0) {
      ctx.beginPath();
      ctx.arc(d.head.x, d.body.y + d.body.h * 0.5, 80 * flash, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(217,181,111,${0.28 * flash})`;
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    ctx.restore();
  }

  drawTrail(ctx) {
    ctx.save();
    for (const point of this.trail) {
      ctx.globalAlpha = Math.max(0, point.life) * 0.45;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.hit ? 7 : 4, 0, Math.PI * 2);
      ctx.fillStyle = point.hit ? "rgba(217,181,111,0.92)" : "rgba(127,215,255,0.72)";
      ctx.fill();
    }
    ctx.restore();
  }

  drawPlayerHandsAndWeapon(ctx, size) {
    const weapon = this.getWeapon();
    const pose = this.computeWeaponPose(size, weapon);
    const scale = Math.min(size.w, size.h) / 620;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "rgba(56, 64, 82, 0.96)";
    ctx.lineWidth = 24 * scale;
    line(ctx, pose.baseX - 44 * scale, pose.baseY + 16 * scale, pose.handX - 20 * scale, pose.handY + 8 * scale);
    line(ctx, pose.baseX + 44 * scale, pose.baseY + 16 * scale, pose.handX + 20 * scale, pose.handY + 8 * scale);

    ctx.fillStyle = "rgba(204, 171, 122, 0.96)";
    ctx.beginPath();
    ctx.arc(pose.handX - 18 * scale, pose.handY + 10 * scale, 18 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pose.handX + 18 * scale, pose.handY + 10 * scale, 18 * scale, 0, Math.PI * 2);
    ctx.fill();

    if (weapon.kind === "hand") {
      ctx.strokeStyle = "rgba(217,181,111,0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pose.tipX, pose.tipY, 26 * scale, 0, Math.PI * 2);
      ctx.stroke();
    } else if (weapon.kind === "special") {
      ctx.strokeStyle = "rgba(210, 220, 230, 0.86)";
      ctx.lineWidth = weapon.thickness * scale;
      const links = 8;
      for (let i = 0; i < links; i++) {
        const t1 = i / links;
        const t2 = (i + 0.55) / links;
        const x1 = lerp(pose.handX, pose.tipX, t1);
        const y1 = lerp(pose.handY, pose.tipY, t1) + Math.sin(i * 1.9 + performance.now() * 0.006) * 8 * scale;
        const x2 = lerp(pose.handX, pose.tipX, t2);
        const y2 = lerp(pose.handY, pose.tipY, t2);
        line(ctx, x1, y1, x2, y2);
      }
      ctx.fillStyle = "rgba(217,181,111,0.96)";
      ctx.beginPath();
      ctx.arc(pose.tipX, pose.tipY, 13 * scale, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = weapon.kind === "heavy" ? "rgba(190, 185, 170, 0.96)" : "rgba(215, 225, 232, 0.96)";
      ctx.lineWidth = weapon.thickness * scale;
      line(ctx, pose.handX, pose.handY, pose.tipX, pose.tipY);

      ctx.fillStyle = weapon.kind === "heavy" ? "rgba(120, 125, 132, 0.98)" : "rgba(217,181,111,0.95)";
      ctx.beginPath();
      ctx.arc(pose.tipX, pose.tipY, (weapon.kind === "heavy" ? 22 : 10) * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawHud(ctx, size) {
    const weapon = this.getWeapon();
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.36)";
    roundRect(ctx, 16, 16, Math.min(size.w - 32, 380), 86, 18);
    ctx.fill();

    ctx.fillStyle = "#f4f7fb";
    ctx.font = "700 16px system-ui, sans-serif";
    ctx.fillText(`選択中：${weapon.name}`, 32, 48);

    ctx.fillStyle = "rgba(244,247,251,0.70)";
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillText(`カテゴリ：${weapon.category}`, 32, 73);
    ctx.fillText("ここでは評価・点数・おすすめ表示は出ない", 32, 94);

    ctx.restore();
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function pointInCircle(px, py, cx, cy, r) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

function pointInRoundedRect(px, py, x, y, w, h) {
  return px >= x && px <= x + w && py >= y && py <= y + h;
}

function pointNearLine(px, py, x1, y1, x2, y2, radius) {
  const lengthSq = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (lengthSq === 0) return false;

  const t = clamp(((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lengthSq, 0, 1);
  const cx = x1 + t * (x2 - x1);
  const cy = y1 + t * (y2 - y1);
  const dx = px - cx;
  const dy = py - cy;

  return dx * dx + dy * dy <= radius * radius;
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

render();
