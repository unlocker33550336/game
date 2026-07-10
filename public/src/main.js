import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const app = document.getElementById("app");

const SCREENS = {
  TITLE: "TITLE",
  ENV_SELECT: "ENV_SELECT",
  MARTIAL_CITY: "MARTIAL_CITY",
  TRIAL_LOBBY: "TRIAL_LOBBY",
  RECEPTION: "RECEPTION",
  CONTROL_GUIDE: "CONTROL_GUIDE",
  TRIAL_ROOM: "TRIAL_ROOM",
  STYLE_BOARD: "STYLE_BOARD"
};

const state = {
  screen: SCREENS.TITLE,
  initialEnvironment: null,
  selectedWeaponId: "barehand",
  lockOn: true
};

const ROOM_HALF_SIZE = 9;
const PLAYER_VISUAL_SCALE = 0.74;
const MANNEQUIN_VISUAL_SCALE = 0.72;

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
    type: "hand",
    length: 0.42,
    weight: 0.65,
    color: 0xd8ad78
  },
  {
    id: "practiceKnife",
    name: "練習用ナイフ",
    category: "ナイフ系",
    type: "short",
    length: 0.66,
    weight: 0.85,
    color: 0xcfd7df
  },
  {
    id: "practiceBlade",
    name: "練習刀",
    category: "刀系",
    type: "blade",
    length: 1.05,
    weight: 1.05,
    color: 0xdfe7ee
  },
  {
    id: "practiceStaff",
    name: "練習棒",
    category: "長物系",
    type: "staff",
    length: 1.55,
    weight: 1.15,
    color: 0xb89056
  },
  {
    id: "weightedTrainer",
    name: "重り付き練習具",
    category: "重量武器系",
    type: "heavy",
    length: 1.02,
    weight: 1.95,
    color: 0x8e959d
  },
  {
    id: "chainTrainer",
    name: "鎖状練習具",
    category: "特殊武器系",
    type: "special",
    length: 1.22,
    weight: 1.35,
    color: 0xb9c3cc
  }
];

let trainingScene = null;

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
    actions: `<button class="btn primary" data-action="go-guide">基本操作を見る</button>`
  });
}

function renderControlGuide() {
  app.innerHTML = screenShell({
    breadcrumb: "武術都市 / お試し場 / 基本操作",
    title: "基本操作ガイド",
    body: html`
      <p class="muted">
        個室に入る前に、最低限の操作だけ確認する。
        ここでは戦い方を指定しない。動かし方だけを知って、自分で試す。
      </p>

      <div class="guide-grid">
        <article class="guide-card">
          <div class="guide-illust keys-illust">
            <span></span><b>W</b><span></span>
            <b>A</b><i></i><b>D</b>
            <span></span><b>S</b><span></span>
          </div>
          <div>
            <h3>移動</h3>
            <p>WASD / 方向キーで移動。スマホでは左下の操作パッドで動く。</p>
          </div>
        </article>

        <article class="guide-card">
          <div class="guide-illust draw-illust">
            <svg viewBox="0 0 180 120" aria-hidden="true">
              <path d="M24 78 C58 28, 112 24, 154 70" />
              <path d="M136 58 L154 70 L133 80" />
            </svg>
          </div>
          <div>
            <h3>軌道攻撃</h3>
            <p>マウスドラッグ / 画面をなぞる操作で、武器や腕の軌道を描く。</p>
          </div>
        </article>

        <article class="guide-card">
          <div class="guide-illust tap-illust">
            <div class="tap-button">TAP</div>
            <div class="tap-arrow">↓</div>
          </div>
          <div>
            <h3>突き・殴り</h3>
            <p>クリック / タップで、正面へ短く出す攻撃を試す。</p>
          </div>
        </article>

        <article class="guide-card">
          <div class="guide-illust lock-illust">
            <div class="lock-target">◎</div>
            <div class="lock-label">LOCK<br>ON/OFF</div>
          </div>
          <div>
            <h3>ロックオン</h3>
            <p>ボタンでON/OFF切り替え。ONの間はマネキンを自動追尾する。</p>
          </div>
        </article>
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

function renderTrialRoom() {
  app.innerHTML = html`
    <main class="screen trial-screen">
      <section class="shell wide-shell">
        <div class="topbar">
          <div class="breadcrumb">武術都市 / お試し場 / 個室</div>
          <button class="btn ghost" data-action="go-lobby">ロビーへ戻る</button>
        </div>

        <div class="room-layout three-layout">
          <aside class="side-panel">
            <h3>個室</h3>
            <p class="muted">
              3Dの個室。移動、ロックオン切り替え、マウス・タッチによる攻撃軌道を試せる。
              評価表示は出ない。
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
              <div>移動：WASD / 方向キー / 左下パッド</div>
              <div>攻撃：マウスドラッグ / 画面をなぞる</div>
              <div>突き・殴り：クリック / タップ</div>
              <div>視点：ロックオン中は自動追尾</div>
              <div>未実装：ダメージ、成長、流派効果、対人戦</div>
            </div>

            <div class="actions">
              <button class="btn" data-action="go-guide">操作ガイド</button>
              <button class="btn" data-action="go-board">案内板を見る</button>
            </div>
          </aside>

          <section class="arena-stage" id="arenaStage">
            <canvas id="threeCanvas" aria-label="3D練習場"></canvas>
            <canvas id="attackTrailCanvas" class="attack-trail-canvas" aria-hidden="true"></canvas>

            <div class="combat-overlay top-overlay">
              <button class="lock-btn ${state.lockOn ? "active" : ""}" data-action="toggle-lock">
                LOCK ${state.lockOn ? "ON" : "OFF"}
              </button>
              <div class="overlay-hint">マウス / タッチで軌道を描く</div>
            </div>

            <div class="move-stick" id="moveStick" aria-label="移動パッド">
              <div class="move-stick-base"></div>
              <div class="move-stick-knob" id="moveStickKnob"></div>
            </div>

            <div class="attack-zone-hint">攻撃エリア</div>
          </section>
        </div>
      </section>
    </main>
  `;

  const canvas = document.getElementById("threeCanvas");
  const trailCanvas = document.getElementById("attackTrailCanvas");
  const stage = document.getElementById("arenaStage");

  trainingScene = new TrainingScene3D({
    canvas,
    trailCanvas,
    stage,
    getWeapon: () => getSelectedWeapon(),
    getLockOn: () => state.lockOn
  });

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
    case SCREENS.CONTROL_GUIDE:
      renderControlGuide();
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

  if (action === "go-guide") {
    setScreen(SCREENS.CONTROL_GUIDE);
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

  if (action === "toggle-lock") {
    state.lockOn = !state.lockOn;

    if (state.screen === SCREENS.TRIAL_ROOM) {
      const lockButton = document.querySelector(".lock-btn");
      if (lockButton) {
        lockButton.textContent = `LOCK ${state.lockOn ? "ON" : "OFF"}`;
        lockButton.classList.toggle("active", state.lockOn);
      }
    }

    return;
  }

  if (action === "select-weapon") {
    state.selectedWeaponId = target.dataset.weapon;

    if (state.screen === SCREENS.TRIAL_ROOM) {
      renderTrialRoom();
    }
  }
});

class TrainingScene3D {
  constructor({ canvas, trailCanvas, stage, getWeapon, getLockOn }) {
    this.canvas = canvas;
    this.trailCanvas = trailCanvas;
    this.stage = stage;
    this.getWeapon = getWeapon;
    this.getLockOn = getLockOn;

    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.clock = new THREE.Clock();
    this.running = false;
    this.frameId = 0;

    this.player = {
      position: new THREE.Vector3(0, 0, 4.1),
      yaw: Math.PI,
      speed: 4.0
    };

    this.keys = new Set();

    this.joystick = {
      active: false,
      x: 0,
      y: 0,
      pointerId: null
    };

    this.pointerAttack = {
      active: false,
      startX: 0,
      startY: 0,
      x: 0,
      y: 0,
      lastX: 0,
      lastY: 0,
      startTime: 0,
      points: []
    };

    this.attack = {
      swingX: 0,
      swingY: 0,
      targetSwingX: 0,
      targetSwingY: 0,
      thrust: 0,
      thrustVelocity: 0,
      flash: 0
    };

    this.weaponMeshGroup = null;
    this.weaponPivot = null;
    this.playerGroup = null;
    this.mannequinGroup = null;

    this.cameraTarget = new THREE.Vector3(0, 1.15, 0);
    this.cameraCurrent = new THREE.Vector3(0, 4.8, 9.2);

    this.lastWeaponId = null;

    this.trailCtx = this.trailCanvas.getContext("2d");

    this.boundResize = () => this.resize();
    this.boundKeyDown = (event) => this.keys.add(event.key.toLowerCase());
    this.boundKeyUp = (event) => this.keys.delete(event.key.toLowerCase());
    this.boundAttackDown = (event) => this.onAttackDown(event);
    this.boundAttackMove = (event) => this.onAttackMove(event);
    this.boundAttackUp = (event) => this.onAttackUp(event);
    this.boundStickDown = (event) => this.onStickDown(event);
    this.boundStickMove = (event) => this.onStickMove(event);
    this.boundStickUp = (event) => this.onStickUp(event);
  }

  start() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0d14);
    this.scene.fog = new THREE.Fog(0x0a0d14, 13, 28);

    this.camera = new THREE.PerspectiveCamera(56, 1, 0.1, 100);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.buildScene();
    this.bindEvents();
    this.resize();

    this.running = true;
    this.clock.start();
    this.loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frameId);
    this.unbindEvents();

    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  bindEvents() {
    window.addEventListener("resize", this.boundResize);
    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);

    this.canvas.addEventListener("pointerdown", this.boundAttackDown);
    this.canvas.addEventListener("pointermove", this.boundAttackMove);
    window.addEventListener("pointerup", this.boundAttackUp);

    const stick = document.getElementById("moveStick");
    if (stick) {
      stick.addEventListener("pointerdown", this.boundStickDown);
      stick.addEventListener("pointermove", this.boundStickMove);
      window.addEventListener("pointerup", this.boundStickUp);
      window.addEventListener("pointercancel", this.boundStickUp);
    }
  }

  unbindEvents() {
    window.removeEventListener("resize", this.boundResize);
    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("keyup", this.boundKeyUp);

    this.canvas.removeEventListener("pointerdown", this.boundAttackDown);
    this.canvas.removeEventListener("pointermove", this.boundAttackMove);
    window.removeEventListener("pointerup", this.boundAttackUp);

    const stick = document.getElementById("moveStick");
    if (stick) {
      stick.removeEventListener("pointerdown", this.boundStickDown);
      stick.removeEventListener("pointermove", this.boundStickMove);
      window.removeEventListener("pointerup", this.boundStickUp);
      window.removeEventListener("pointercancel", this.boundStickUp);
    }
  }

  buildScene() {
    const ambient = new THREE.HemisphereLight(0xdce8ff, 0x1d2430, 1.8);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(5, 8, 6);
    key.castShadow = true;
    key.shadow.mapSize.width = 2048;
    key.shadow.mapSize.height = 2048;
    this.scene.add(key);

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x151a24,
      roughness: 0.85,
      metalness: 0.03
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_HALF_SIZE * 2, ROOM_HALF_SIZE * 2), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    this.addRoomWalls();
    this.addGridLines();
    this.addWeaponRack();

    this.playerGroup = this.createPlayer();
    this.scene.add(this.playerGroup);

    this.mannequinGroup = this.createMannequin();
    this.mannequinGroup.position.set(0, 0, -3.2);
    this.mannequinGroup.scale.setScalar(MANNEQUIN_VISUAL_SCALE);
    this.scene.add(this.mannequinGroup);

    this.createWeaponForSelected();
  }

  addRoomWalls() {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x202838,
      roughness: 0.9
    });

    const wallLength = ROOM_HALF_SIZE * 2;
    const wallHeight = 3.2;

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(wallLength, wallHeight, 0.14), wallMat);
    backWall.position.set(0, wallHeight / 2, -ROOM_HALF_SIZE);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.14, wallHeight, wallLength), wallMat);
    leftWall.position.set(-ROOM_HALF_SIZE, wallHeight / 2, 0);
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.14, wallHeight, wallLength), wallMat);
    rightWall.position.set(ROOM_HALF_SIZE, wallHeight / 2, 0);
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);
  }

  addGridLines() {
    const mat = new THREE.LineBasicMaterial({
      color: 0x344057,
      transparent: true,
      opacity: 0.28
    });

    const group = new THREE.Group();

    for (let i = -ROOM_HALF_SIZE; i <= ROOM_HALF_SIZE; i += 1) {
      const pointsA = [
        new THREE.Vector3(i, 0.012, -ROOM_HALF_SIZE),
        new THREE.Vector3(i, 0.012, ROOM_HALF_SIZE)
      ];

      const pointsB = [
        new THREE.Vector3(-ROOM_HALF_SIZE, 0.012, i),
        new THREE.Vector3(ROOM_HALF_SIZE, 0.012, i)
      ];

      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pointsA), mat));
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pointsB), mat));
    }

    this.scene.add(group);
  }

  addWeaponRack() {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x6f5531,
      roughness: 0.8
    });

    const rack = new THREE.Group();
    rack.position.set(-7.0, 0, -5.8);

    const postA = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), mat);
    postA.position.set(-0.45, 0.8, 0);

    const postB = postA.clone();
    postB.position.x = 0.45;

    const barA = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.10, 0.10), mat);
    barA.position.set(0, 1.25, 0);

    const barB = barA.clone();
    barB.position.y = 0.75;

    rack.add(postA, postB, barA, barB);
    this.scene.add(rack);
  }

  createPlayer() {
    const group = new THREE.Group();

    const cloth = new THREE.MeshStandardMaterial({
      color: 0x3a465d,
      roughness: 0.7
    });

    const skin = new THREE.MeshStandardMaterial({
      color: 0xd8ad78,
      roughness: 0.72
    });

    const accent = new THREE.MeshStandardMaterial({
      color: 0xd9b56f,
      roughness: 0.55
    });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.95, 16), cloth);
    body.position.y = 1.05;
    body.castShadow = true;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 20), skin);
    head.position.y = 1.72;
    head.castShadow = true;

    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.75, 12), cloth);
    leftLeg.position.set(-0.16, 0.38, 0);
    leftLeg.castShadow = true;

    const rightLeg = leftLeg.clone();
    rightLeg.position.x = 0.16;

    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.72, 12), cloth);
    leftArm.position.set(-0.42, 1.12, -0.08);
    leftArm.rotation.z = 0.18;
    leftArm.castShadow = true;

    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.72, 12), cloth);
    rightArm.position.set(0.42, 1.12, -0.08);
    rightArm.rotation.z = -0.18;
    rightArm.castShadow = true;

    const facingMark = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.24), accent);
    facingMark.position.set(0, 1.43, -0.34);
    facingMark.castShadow = true;

    this.weaponPivot = new THREE.Group();
    this.weaponPivot.position.set(0.38, 1.15, -0.28);

    group.add(body, head, leftLeg, rightLeg, leftArm, rightArm, facingMark, this.weaponPivot);
    group.scale.setScalar(PLAYER_VISUAL_SCALE);

    return group;
  }

  createMannequin() {
    const group = new THREE.Group();

    const wood = new THREE.MeshStandardMaterial({
      color: 0x9b7447,
      roughness: 0.92
    });

    const marker = new THREE.MeshStandardMaterial({
      color: 0xd9b56f,
      roughness: 0.6,
      emissive: 0x3a2500,
      emissiveIntensity: 0.05
    });

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.54, 0.14, 24), wood);
    base.position.y = 0.07;
    base.castShadow = true;
    base.receiveShadow = true;

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.75, 16), wood);
    pole.position.y = 0.95;
    pole.castShadow = true;

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.72, 18), wood);
    torso.position.y = 1.18;
    torso.castShadow = true;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 20), wood);
    head.position.y = 1.68;
    head.castShadow = true;

    const line = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.32), marker);
    line.position.set(0, 1.42, -0.25);
    line.castShadow = true;

    const armGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.82, 12);

    const leftArm = new THREE.Mesh(armGeo, wood);
    leftArm.position.set(-0.43, 1.28, 0);
    leftArm.rotation.z = Math.PI / 2.7;
    leftArm.castShadow = true;

    const rightArm = leftArm.clone();
    rightArm.position.x = 0.43;
    rightArm.rotation.z = -Math.PI / 2.7;

    group.add(base, pole, torso, head, line, leftArm, rightArm);

    return group;
  }

  createWeaponForSelected() {
    const weapon = this.getWeapon();

    if (this.lastWeaponId === weapon.id && this.weaponMeshGroup) return;

    this.lastWeaponId = weapon.id;

    if (this.weaponMeshGroup) {
      this.weaponPivot.remove(this.weaponMeshGroup);
    }

    this.weaponMeshGroup = this.createWeaponMesh(weapon);
    this.weaponPivot.add(this.weaponMeshGroup);
  }

  createWeaponMesh(weapon) {
    const group = new THREE.Group();

    const material = new THREE.MeshStandardMaterial({
      color: weapon.color,
      roughness: 0.48,
      metalness: 0.12
    });

    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x3c2b1f,
      roughness: 0.8
    });

    if (weapon.type === "hand") {
      const fistA = new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 16), material);
      fistA.position.set(0.05, 0, -0.34);

      const fistB = fistA.clone();
      fistB.position.x = -0.08;

      group.add(fistA, fistB);
      return group;
    }

    if (weapon.type === "heavy") {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, weapon.length, 16), gripMat);
      handle.rotation.x = Math.PI / 2;
      handle.position.z = -weapon.length / 2;

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.26, 0.28), material);
      head.position.z = -weapon.length - 0.10;

      group.add(handle, head);
      return group;
    }

    if (weapon.type === "special") {
      const linkMat = new THREE.MeshStandardMaterial({
        color: weapon.color,
        roughness: 0.42,
        metalness: 0.35
      });

      for (let i = 0; i < 7; i += 1) {
        const link = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 8, 18), linkMat);
        link.position.z = -0.18 - i * 0.15;
        link.rotation.x = Math.PI / 2;
        link.rotation.z = i % 2 === 0 ? 0 : Math.PI / 2;
        group.add(link);
      }

      const end = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), linkMat);
      end.position.z = -1.28;
      group.add(end);

      return group;
    }

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.32, 16), gripMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.z = -0.16;
    group.add(handle);

    if (weapon.type === "staff") {
      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, weapon.length, 16), material);
      staff.rotation.x = Math.PI / 2;
      staff.position.z = -weapon.length / 2;
      group.add(staff);
      return group;
    }

    if (weapon.type === "blade") {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.025, weapon.length), material);
      blade.position.z = -0.26 - weapon.length / 2;
      group.add(blade);
      return group;
    }

    const shortBlade = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.025, weapon.length), material);
    shortBlade.position.z = -0.18 - weapon.length / 2;
    group.add(shortBlade);

    return group;
  }

  resize() {
    const rect = this.stage.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    this.renderer.setSize(width, height, false);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.trailCanvas.width = Math.floor(width * dpr);
    this.trailCanvas.height = Math.floor(height * dpr);
    this.trailCanvas.style.width = `${width}px`;
    this.trailCanvas.style.height = `${height}px`;

    this.trailCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  loop() {
    if (!this.running) return;

    const dt = Math.min(this.clock.getDelta(), 0.033);

    this.createWeaponForSelected();
    this.update(dt);

    this.renderer.render(this.scene, this.camera);
    this.drawAttackTrail();

    this.frameId = requestAnimationFrame(() => this.loop());
  }

  update(dt) {
    this.updateMovement(dt);
    this.updateFacing(dt);
    this.updateAttack(dt);
    this.updateCamera(dt);
    this.updateHitReaction(dt);
  }

  updateMovement(dt) {
    let x = 0;
    let z = 0;

    if (this.keys.has("w") || this.keys.has("arrowup")) z -= 1;
    if (this.keys.has("s") || this.keys.has("arrowdown")) z += 1;
    if (this.keys.has("a") || this.keys.has("arrowleft")) x -= 1;
    if (this.keys.has("d") || this.keys.has("arrowright")) x += 1;

    x += this.joystick.x;
    z += this.joystick.y;

    const input = new THREE.Vector3(x, 0, z);

    if (input.lengthSq() > 1) {
      input.normalize();
    }

    if (input.lengthSq() > 0.001) {
      const cameraForward = new THREE.Vector3();
      this.camera.getWorldDirection(cameraForward);
      cameraForward.y = 0;
      cameraForward.normalize();

      const cameraRight = new THREE.Vector3()
        .crossVectors(cameraForward, new THREE.Vector3(0, 1, 0))
        .normalize();

      const move = new THREE.Vector3()
        .addScaledVector(cameraRight, input.x)
        .addScaledVector(cameraForward, -input.z)
        .normalize();

      this.player.position.addScaledVector(move, this.player.speed * dt);

      const moveLimit = ROOM_HALF_SIZE - 1.2;
      this.player.position.x = clamp(this.player.position.x, -moveLimit, moveLimit);
      this.player.position.z = clamp(this.player.position.z, -moveLimit, moveLimit);

      if (!this.getLockOn()) {
        this.player.yaw = Math.atan2(-move.x, -move.z);
      }
    }

    this.playerGroup.position.copy(this.player.position);
    this.playerGroup.rotation.y = this.player.yaw;
  }

  updateFacing(dt) {
    if (!this.getLockOn()) return;

    const target = this.mannequinGroup.position;

    const dx = target.x - this.player.position.x;
    const dz = target.z - this.player.position.z;

    const desired = Math.atan2(-dx, -dz);
    this.player.yaw = smoothAngle(this.player.yaw, desired, 1 - Math.exp(-8.5 * dt));
  }

  updateAttack(dt) {
    this.attack.swingX = lerp(this.attack.swingX, this.attack.targetSwingX, 1 - Math.exp(-14 * dt));
    this.attack.swingY = lerp(this.attack.swingY, this.attack.targetSwingY, 1 - Math.exp(-14 * dt));

    this.attack.targetSwingX *= Math.exp(-5.5 * dt);
    this.attack.targetSwingY *= Math.exp(-5.5 * dt);

    this.attack.thrust += this.attack.thrustVelocity * dt;
    this.attack.thrustVelocity -= this.attack.thrust * 42 * dt;
    this.attack.thrustVelocity *= Math.exp(-12 * dt);
    this.attack.thrust = clamp(this.attack.thrust, 0, 0.72);

    const weapon = this.getWeapon();
    const heaviness = clamp(weapon.weight, 0.65, 2.2);
    const weightLag = (heaviness - 1) * 0.18;

    this.weaponPivot.rotation.x = -0.20 + this.attack.swingY * 0.9 - weightLag;
    this.weaponPivot.rotation.y = this.attack.swingX * 0.85;
    this.weaponPivot.rotation.z = -0.10 + this.attack.swingX * 0.25;
    this.weaponPivot.position.z = -0.28 - this.attack.thrust;

    this.attack.flash = Math.max(0, this.attack.flash - dt * 3.2);
  }

  updateCamera(dt) {
    const playerPoint = new THREE.Vector3().copy(this.player.position);
    playerPoint.y = 1.1;

    const mannequinPoint = new THREE.Vector3().copy(this.mannequinGroup.position);
    mannequinPoint.y = 1.15 * MANNEQUIN_VISUAL_SCALE;

    let desiredPosition;

    if (this.getLockOn()) {
      const center = new THREE.Vector3()
        .copy(playerPoint)
        .lerp(mannequinPoint, 0.48);

      const playerToTarget = new THREE.Vector3()
        .subVectors(mannequinPoint, playerPoint);

      const distance = Math.max(1.0, playerToTarget.length());

      const away = new THREE.Vector3()
        .subVectors(playerPoint, mannequinPoint);

      away.y = 0;

      if (away.lengthSq() < 0.001) {
        away.set(0, 0, 1);
      }

      away.normalize();

      const side = new THREE.Vector3()
        .crossVectors(new THREE.Vector3(0, 1, 0), away)
        .normalize();

      const cameraDistance = clamp(distance * 0.85 + 5.3, 6.4, 9.2);
      const cameraHeight = clamp(distance * 0.28 + 3.0, 3.4, 5.0);

      desiredPosition = new THREE.Vector3()
        .copy(center)
        .addScaledVector(away, cameraDistance)
        .addScaledVector(side, 0.85)
        .add(new THREE.Vector3(0, cameraHeight, 0));

      const lookTarget = new THREE.Vector3()
        .copy(center);

      lookTarget.y = 1.05;

      this.cameraTarget.lerp(lookTarget, 1 - Math.exp(-6.5 * dt));
    } else {
      const back = new THREE.Vector3(
        Math.sin(this.player.yaw),
        0,
        Math.cos(this.player.yaw)
      );

      desiredPosition = new THREE.Vector3()
        .copy(this.player.position)
        .addScaledVector(back, 6.4)
        .add(new THREE.Vector3(0, 3.8, 0));

      const forwardLook = new THREE.Vector3()
        .copy(this.player.position)
        .addScaledVector(back, -3.4);

      forwardLook.y = 1.15;

      this.cameraTarget.lerp(forwardLook, 1 - Math.exp(-5.8 * dt));
    }

    this.cameraCurrent.lerp(desiredPosition, 1 - Math.exp(-5.8 * dt));

    this.camera.position.copy(this.cameraCurrent);
    this.camera.lookAt(this.cameraTarget);
  }

  updateHitReaction(dt) {
    const tip = this.getWeaponTipWorldPosition();

    const target = new THREE.Vector3().copy(this.mannequinGroup.position);
    target.y = 1.05 * MANNEQUIN_VISUAL_SCALE;

    const distance = tip.distanceTo(target);

    if (distance < 0.48) {
      this.attack.flash = 1;
    }

    const hitScale = 1 + this.attack.flash * 0.035;

    this.mannequinGroup.scale.set(
      MANNEQUIN_VISUAL_SCALE * hitScale,
      MANNEQUIN_VISUAL_SCALE * (1 + this.attack.flash * 0.02),
      MANNEQUIN_VISUAL_SCALE * hitScale
    );

    this.mannequinGroup.traverse((obj) => {
      if (obj.isMesh && obj.material && obj.material.emissive) {
        obj.material.emissiveIntensity = this.attack.flash * 0.45;
      }
    });
  }

  getWeaponTipWorldPosition() {
    const weapon = this.getWeapon();

    const localTip = new THREE.Vector3(
      0,
      0,
      -Math.max(0.42, weapon.length + 0.22)
    );

    return this.weaponPivot.localToWorld(localTip.clone());
  }

  onAttackDown(event) {
    if (event.target.closest?.(".move-stick")) return;

    this.canvas.setPointerCapture?.(event.pointerId);

    const point = this.getStagePoint(event);

    this.pointerAttack.active = true;
    this.pointerAttack.startX = point.x;
    this.pointerAttack.startY = point.y;
    this.pointerAttack.x = point.x;
    this.pointerAttack.y = point.y;
    this.pointerAttack.lastX = point.x;
    this.pointerAttack.lastY = point.y;
    this.pointerAttack.startTime = performance.now();
    this.pointerAttack.points = [{ x: point.x, y: point.y, life: 1 }];
  }

  onAttackMove(event) {
    if (!this.pointerAttack.active) return;

    const point = this.getStagePoint(event);

    const width = this.stage.clientWidth;
    const height = this.stage.clientHeight;

    const dx = (point.x - this.pointerAttack.lastX) / Math.max(1, width);
    const dy = (point.y - this.pointerAttack.lastY) / Math.max(1, height);

    this.attack.targetSwingX = clamp(this.attack.targetSwingX + dx * 9.5, -1.25, 1.25);
    this.attack.targetSwingY = clamp(this.attack.targetSwingY + dy * 7.5, -1.05, 1.05);

    this.pointerAttack.lastX = point.x;
    this.pointerAttack.lastY = point.y;
    this.pointerAttack.x = point.x;
    this.pointerAttack.y = point.y;

    this.pointerAttack.points.push({
      x: point.x,
      y: point.y,
      life: 1
    });
  }

  onAttackUp(event) {
    if (!this.pointerAttack.active) return;

    const point = this.getStagePoint(event);

    const totalDx = point.x - this.pointerAttack.startX;
    const totalDy = point.y - this.pointerAttack.startY;
    const distance = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
    const duration = performance.now() - this.pointerAttack.startTime;

    if (duration < 230 && distance < 18) {
      this.attack.thrustVelocity = 8.5;
    }

    this.pointerAttack.active = false;
  }

  onStickDown(event) {
    event.preventDefault();
    event.stopPropagation();

    this.joystick.active = true;
    this.joystick.pointerId = event.pointerId;

    this.updateStick(event);
  }

  onStickMove(event) {
    if (!this.joystick.active || event.pointerId !== this.joystick.pointerId) return;

    event.preventDefault();
    event.stopPropagation();

    this.updateStick(event);
  }

  onStickUp(event) {
    if (!this.joystick.active) return;
    if (event.pointerId !== undefined && this.joystick.pointerId !== event.pointerId) return;

    this.joystick.active = false;
    this.joystick.pointerId = null;
    this.joystick.x = 0;
    this.joystick.y = 0;

    this.updateStickKnob(0, 0);
  }

  updateStick(event) {
    const stick = document.getElementById("moveStick");
    if (!stick) return;

    const rect = stick.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const max = rect.width * 0.34;

    const dx = clamp(event.clientX - centerX, -max, max);
    const dy = clamp(event.clientY - centerY, -max, max);

    this.joystick.x = dx / max;
    this.joystick.y = dy / max;

    this.updateStickKnob(dx, dy);
  }

  updateStickKnob(dx, dy) {
    const knob = document.getElementById("moveStickKnob");
    if (!knob) return;

    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }

  getStagePoint(event) {
    const rect = this.stage.getBoundingClientRect();

    return {
      x: clamp(event.clientX - rect.left, 0, rect.width),
      y: clamp(event.clientY - rect.top, 0, rect.height)
    };
  }

  drawAttackTrail() {
    const width = this.stage.clientWidth;
    const height = this.stage.clientHeight;
    const ctx = this.trailCtx;

    ctx.clearRect(0, 0, width, height);

    for (const point of this.pointerAttack.points) {
      point.life -= 0.025;
    }

    this.pointerAttack.points = this.pointerAttack.points.filter((point) => point.life > 0);

    if (this.pointerAttack.points.length < 2) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let i = 1; i < this.pointerAttack.points.length; i += 1) {
      const a = this.pointerAttack.points[i - 1];
      const b = this.pointerAttack.points[i];

      const alpha = Math.max(0, Math.min(a.life, b.life));

      ctx.strokeStyle = `rgba(217, 181, 111, ${alpha * 0.8})`;
      ctx.lineWidth = 4 + alpha * 4;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    ctx.restore();
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothAngle(current, target, t) {
  let diff = target - current;

  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;

  return current + diff * t;
}

render();
