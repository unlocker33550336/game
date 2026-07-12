import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import RAPIER from "https://cdn.skypack.dev/@dimforge/rapier3d-compat";

const app = document.getElementById("app");

const SCREENS = {
  TITLE: "TITLE",
  REGISTER: "REGISTER",
  WEAPON_SELECT: "WEAPON_SELECT",
  TOWER_GATE: "TOWER_GATE",
  TOWER_FLOOR: "TOWER_FLOOR"
};

const state = {
  screen: SCREENS.TITLE,
  mainWeaponId: null,
  selectedWeaponId: null,
  lockOn: true,
  towerMemory: {
    battles: 0,
    totalContacts: 0,
    rightHandUses: 0,
    leftHandUses: 0,
    grabs: 0,
    dashes: 0,
    closeRangeTime: 0,
    bladeArcActions: 0,
    barehandActions: 0,
    pressureMoments: 0
  },
  hiddenTalent: {
    internalId: null,
    stage: 0,
    echoes: []
  }
};

const ROOM_HALF_SIZE = 9;
const PLAYER_VISUAL_SCALE = 0.74;
const MANNEQUIN_VISUAL_SCALE = 0.72;

let rapierInitPromise = null;

function ensureRapierReady() {
  if (!rapierInitPromise) {
    rapierInitPromise = RAPIER.init();
  }

  return rapierInitPromise;
}

const weapons = [
  {
    id: "barehand",
    name: "素手",
    category: "身体操作型",
    type: "hand",
    talentAffinity: "barehand",
    length: 0.42,
    weight: 0.65,
    color: 0xd8ad78,
    description: "身体そのものを武器にする。距離、反応、体勢、瞬間判断が重要になる。"
  },
  {
    id: "practiceBlade",
    name: "刀剣型",
    category: "刀系",
    type: "blade",
    talentAffinity: "blade",
    length: 1.05,
    weight: 1.05,
    color: 0xdfe7ee,
    description: "一本の軌道、踏み込み、間合い、通すべき点を重視する。"
  },
  {
    id: "practiceKnife",
    name: "短刃型",
    category: "軽量武器系",
    type: "short",
    talentAffinity: "none",
    length: 0.66,
    weight: 0.85,
    color: 0xcfd7df,
    description: "近い距離での出入り、角度変更、素早い手の操作を重視する。"
  },
  {
    id: "practiceStaff",
    name: "長柄型",
    category: "長柄系",
    type: "staff",
    talentAffinity: "none",
    length: 1.55,
    weight: 1.15,
    color: 0xb89056,
    description: "距離管理、先端操作、相手を近づけさせない動きを重視する。"
  },
  {
    id: "weightedTrainer",
    name: "重量型",
    category: "重量武器系",
    type: "heavy",
    talentAffinity: "none",
    length: 1.02,
    weight: 1.95,
    color: 0x8e959d,
    description: "重さ、体重移動、振り始めと止め方を重視する。"
  },
  {
    id: "chainTrainer",
    name: "特殊操作型",
    category: "特殊武器系",
    type: "special",
    talentAffinity: "none",
    length: 1.22,
    weight: 1.35,
    color: 0xb9c3cc,
    description: "軌道の変化、間合いのズレ、通常とは違う操作感を重視する。"
  }
];

const hiddenTalentDefinitions = {
  trajectory: {
    internalId: "trajectory",
    weaponAffinity: "blade",
    messages: [
      "通る線が、一瞬だけ浮いた。",
      "身体より先に、軌道だけが見えた。",
      "その線を通せば届く、と直感した。"
    ]
  },
  core: {
    internalId: "core",
    weaponAffinity: "blade",
    messages: [
      "相手の動きの奥に、小さな点が揺れた。",
      "守りの中に、一瞬だけ空いた場所が見えた。",
      "そこに通せば崩れる、と身体が理解した。"
    ]
  },
  time: {
    internalId: "time",
    weaponAffinity: "barehand",
    messages: [
      "世界の流れが、一拍だけ遅れた。",
      "相手の動き出しが、妙にはっきり見えた。",
      "一瞬の中に、選べる余白が生まれた。"
    ]
  },
  unconscious: {
    internalId: "unconscious",
    weaponAffinity: "any",
    messages: [
      "意識より先に、身体が前へ出た。",
      "考える前に、身体が戦いを続けた。",
      "まだ倒れないという意志だけが、動きを残した。"
    ]
  }
};

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
          <div class="kicker">999 Floor Tower Prototype</div>
          <h1>BATTLE<br>ORIGIN</h1>
          <p class="lead">
            ある日、世界に999階の塔が現れた。
            それから2年。人々は塔を理解できないまま、攻略し、記録し、利用し始めている。
          </p>
          <div class="actions">
            <button class="btn primary" data-action="start">始める</button>
          </div>
        </div>
      </section>
    </main>
  `;
}

function renderRegister() {
  app.innerHTML = screenShell({
    breadcrumb: "塔出現から2年後",
    title: "攻略者登録",
    body: html`
      <p class="muted">
        塔の正体は分かっていない。
        ただ、内部には階層ごとに異なる環境、敵、資源、そして人間の限界を超える経験が存在する。
      </p>
      <div class="note">
        塔の攻略中、まれに人間離れした感覚や動きを開花させる者がいる。
        それが何なのかは、まだ明確には説明されていない。
      </div>
      <p class="muted">
        攻略者は初期登録時に、攻略の軸となるメイン武器を選ぶ。
        それは完全な縛りではないが、最初の成長方向と戦い方に大きく影響する。
      </p>
    `,
    actions: `<button class="btn primary" data-action="go-weapon-select">メイン武器を選ぶ</button>`
  });
}

function renderWeaponSelect() {
  const cards = weapons.map((weapon) => html`
    <article class="card clickable" data-action="choose-main-weapon" data-weapon="${weapon.id}">
      <div class="tag">${weapon.category}</div>
      <div class="card-title" style="margin-top:12px;">${weapon.name}</div>
      <div class="card-text">${weapon.description}</div>
    </article>
  `).join("");

  app.innerHTML = screenShell({
    breadcrumb: "攻略者登録 / 初期装備",
    title: "メイン武器を選ぶ",
    body: html`
      <p class="muted">
        ここで選ぶ武器は、序盤の攻略、身体の使い方、戦闘中の異常な感覚の発現傾向に影響する。
        ただし、画面上に才能名や確定情報は表示されない。
      </p>
      <div class="grid cards-4">${cards}</div>
    `
  });
}

function renderTowerGate() {
  const weapon = getSelectedWeapon();

  app.innerHTML = screenShell({
    breadcrumb: "塔入口",
    title: "第1階層前：境界門",
    body: html`
      <p class="muted">
        塔の入口には、登録を終えた攻略者たちが集まっている。
        国家、企業、個人、傭兵、研究者。目的は違うが、全員が上を目指している。
      </p>
      <div class="note">
        現在のメイン武器：<strong>${weapon.name}</strong><br>
        塔は攻略者の戦闘を記録する。
        同じ戦い方を続ければ、塔はそれを覚え、次の敵や階層に反映してくる。
      </div>
      <p class="muted">
        第1階層は、塔が攻略者を測るための適応区画と呼ばれている。
        ここで移動、両手操作、掴み、攻撃、そして塔の記録が始まる。
      </p>
    `,
    actions: `
      <button class="btn primary" data-action="enter-floor">第1階層へ入る</button>
      <button class="btn" data-action="go-weapon-select">武器を選び直す</button>
    `
  });
}

function renderTowerFloor() {
  const weapon = getSelectedWeapon();

  app.innerHTML = html`
    <main class="screen trial-screen">
      <section class="shell wide-shell">
        <div class="topbar">
          <div class="breadcrumb">999階の塔 / 第1階層 / 適応区画</div>
          <button class="btn ghost" data-action="go-gate">境界門へ戻る</button>
        </div>

        <div class="room-layout three-layout">
          <aside class="side-panel">
            <h3>第1階層：適応区画</h3>
            <p class="muted">
              塔の低層にある、攻略者の基礎反応を測る空間。
              ここでの戦闘ログは塔に記録される。
            </p>

            <div class="stat-box">
              <div>メイン武器：${weapon.name}</div>
              <div>移動：WASD / 方向キー / 左下パッド</div>
              <div>ゆっくり：Shift　踏み込み：Space</div>
              <div>右手：左クリック / 左ドラッグ / E</div>
              <div>左手：右クリック / 右ドラッグ / Q</div>
              <div>両手持ち：R　ロックオン：L</div>
              <div>塔記録：戦闘ログを蓄積中</div>
              <div>未実装：本格敵AI、階層移動、報酬、対人戦</div>
            </div>

            <div class="note">
              才能は選択式ではない。
              攻略中の行動、危機、戦い方、武器、経験の蓄積によって、まれに異常な感覚が発現する。
            </div>

            <div class="actions">
              <button class="btn" data-action="go-weapon-select">武器を選び直す</button>
              <button class="btn" data-action="go-gate">境界門へ戻る</button>
            </div>
          </aside>

          <section class="arena-stage" id="arenaStage">
            <canvas id="threeCanvas" aria-label="3D塔内戦闘区画"></canvas>
            <canvas id="attackTrailCanvas" class="attack-trail-canvas" aria-hidden="true"></canvas>

            <div class="combat-overlay top-overlay">
              <button class="lock-btn ${state.lockOn ? "active" : ""}" data-action="toggle-lock">
                LOCK ${state.lockOn ? "ON" : "OFF"}
              </button>
              <div class="overlay-hint">左ドラッグ：右手 / 右ドラッグ：左手 / Q E R</div>
            </div>

            <div
              id="towerSignal"
              style="
                position:absolute;
                left:50%;
                top:70px;
                transform:translateX(-50%);
                padding:10px 14px;
                border:1px solid rgba(217,181,111,.35);
                border-radius:999px;
                background:rgba(5,8,14,.58);
                color:rgba(245,232,204,.94);
                font-size:13px;
                letter-spacing:.04em;
                opacity:0;
                pointer-events:none;
                transition:opacity .18s ease;
                text-align:center;
                max-width:82%;
                z-index:6;
              "
            ></div>

            <div class="move-stick" id="moveStick" aria-label="移動パッド">
              <div class="move-stick-base"></div>
              <div class="move-stick-knob" id="moveStickKnob"></div>
            </div>

            <div class="attack-zone-hint">塔内戦闘区画</div>
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
  if (!state.selectedWeaponId) {
    state.selectedWeaponId = state.mainWeaponId || "barehand";
  }

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
    case SCREENS.REGISTER:
      renderRegister();
      break;
    case SCREENS.WEAPON_SELECT:
      renderWeaponSelect();
      break;
    case SCREENS.TOWER_GATE:
      renderTowerGate();
      break;
    case SCREENS.TOWER_FLOOR:
      renderTowerFloor();
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
    state.screen = SCREENS.TITLE;
    state.mainWeaponId = null;
    state.selectedWeaponId = null;
    state.hiddenTalent.internalId = null;
    state.hiddenTalent.stage = 0;
    state.hiddenTalent.echoes = [];
    render();
    return;
  }

  if (action === "start") {
    setScreen(SCREENS.REGISTER);
    return;
  }

  if (action === "go-weapon-select") {
    setScreen(SCREENS.WEAPON_SELECT);
    return;
  }

  if (action === "choose-main-weapon") {
    state.mainWeaponId = target.dataset.weapon;
    state.selectedWeaponId = state.mainWeaponId;
    setScreen(SCREENS.TOWER_GATE);
    return;
  }

  if (action === "go-gate") {
    setScreen(SCREENS.TOWER_GATE);
    return;
  }

  if (action === "enter-floor") {
    state.towerMemory.battles += 1;
    setScreen(SCREENS.TOWER_FLOOR);
    return;
  }

  if (action === "toggle-lock") {
    state.lockOn = !state.lockOn;
    updateLockButton();
  }
});

function updateLockButton() {
  const lockButton = document.querySelector(".lock-btn");

  if (lockButton) {
    lockButton.textContent = `LOCK ${state.lockOn ? "ON" : "OFF"}`;
    lockButton.classList.toggle("active", state.lockOn);
  }
}

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

    this.physicsWorld = null;
    this.characterController = null;
    this.playerBody = null;
    this.playerCollider = null;
    this.playerColliderCenterY = 0.70;

    this.player = {
      position: new THREE.Vector3(0, 0, 4.1),
      yaw: Math.PI,
      speed: 4.0,
      slowSpeed: 1.75,
      dashCooldown: 0
    };

    this.velocity = new THREE.Vector3();
    this.lastVisualMove = new THREE.Vector3(0, 0, -1);
    this.moveAmount = 0;
    this.walkPhase = 0;
    this.stepBurst = 0;

    this.keys = new Set();

    this.joystick = {
      active: false,
      x: 0,
      y: 0,
      pointerId: null
    };

    this.pointerAttack = {
      active: false,
      hand: "right",
      startX: 0,
      startY: 0,
      x: 0,
      y: 0,
      lastX: 0,
      lastY: 0,
      startTime: 0,
      points: []
    };

    this.hands = {
      left: createHandState("left"),
      right: createHandState("right")
    };

    this.grabbables = [];
    this.selectedHandObject = null;
    this.lastWeaponId = null;

    this.rig = null;
    this.playerGroup = null;
    this.mannequinGroup = null;

    this.cameraTarget = new THREE.Vector3(0, 1.15, 0);
    this.cameraCurrent = new THREE.Vector3(0, 4.8, 9.2);
    this.cameraShake = 0;
    this.hitStop = 0;
    this.hitCooldown = 0;

    this.visionGroup = null;
    this.coreMarker = null;

    this.towerStats = {
      contacts: 0,
      rightHandUses: 0,
      leftHandUses: 0,
      grabs: 0,
      dashUses: 0,
      closeRangeTime: 0,
      bladeArcActions: 0,
      barehandActions: 0,
      pressureMoments: 0,
      limitPressure: 0
    };

    this.talentCooldown = 0;
    this.talentEffects = {
      trajectory: 0,
      core: 0,
      time: 0,
      unconscious: 0,
      message: "",
      messageTimer: 0
    };

    this.trailCtx = this.trailCanvas.getContext("2d");

    this.boundResize = () => this.resize();
    this.boundKeyDown = (event) => this.onKeyDown(event);
    this.boundKeyUp = (event) => this.onKeyUp(event);
    this.boundAttackDown = (event) => this.onAttackDown(event);
    this.boundAttackMove = (event) => this.onAttackMove(event);
    this.boundAttackUp = (event) => this.onAttackUp(event);
    this.boundContextMenu = (event) => event.preventDefault();
    this.boundStickDown = (event) => this.onStickDown(event);
    this.boundStickMove = (event) => this.onStickMove(event);
    this.boundStickUp = (event) => this.onStickUp(event);
  }

  async start() {
    this.running = true;

    await ensureRapierReady();

    if (!this.running) return;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070a12);
    this.scene.fog = new THREE.Fog(0x070a12, 13, 30);

    this.camera = new THREE.PerspectiveCamera(56, 1, 0.1, 100);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.buildPhysics();
    this.buildScene();
    this.bindEvents();
    this.resize();

    this.clock.start();
    this.loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frameId);
    this.unbindEvents();

    if (this.physicsWorld && this.characterController) {
      this.physicsWorld.removeCharacterController(this.characterController);
    }

    if (this.renderer) {
      this.renderer.dispose();
    }

    this.physicsWorld = null;
    this.characterController = null;
    this.playerBody = null;
    this.playerCollider = null;
  }

  bindEvents() {
    window.addEventListener("resize", this.boundResize);
    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);

    this.canvas.addEventListener("pointerdown", this.boundAttackDown);
    this.canvas.addEventListener("pointermove", this.boundAttackMove);
    window.addEventListener("pointerup", this.boundAttackUp);
    this.canvas.addEventListener("contextmenu", this.boundContextMenu);
    this.stage.addEventListener("contextmenu", this.boundContextMenu);

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
    this.canvas.removeEventListener("contextmenu", this.boundContextMenu);
    this.stage.removeEventListener("contextmenu", this.boundContextMenu);

    const stick = document.getElementById("moveStick");
    if (stick) {
      stick.removeEventListener("pointerdown", this.boundStickDown);
      stick.removeEventListener("pointermove", this.boundStickMove);
      window.removeEventListener("pointerup", this.boundStickUp);
      window.removeEventListener("pointercancel", this.boundStickUp);
    }
  }

  buildPhysics() {
    const gravity = { x: 0.0, y: 0.0, z: 0.0 };
    this.physicsWorld = new RAPIER.World(gravity);

    this.physicsWorld.createCollider(
      RAPIER.ColliderDesc
        .cuboid(ROOM_HALF_SIZE, 0.06, ROOM_HALF_SIZE)
        .setTranslation(0, -0.06, 0)
    );

    const wallHeight = 3.2;
    const wallThickness = 0.16;

    this.physicsWorld.createCollider(
      RAPIER.ColliderDesc
        .cuboid(ROOM_HALF_SIZE, wallHeight / 2, wallThickness / 2)
        .setTranslation(0, wallHeight / 2, -ROOM_HALF_SIZE)
    );

    this.physicsWorld.createCollider(
      RAPIER.ColliderDesc
        .cuboid(ROOM_HALF_SIZE, wallHeight / 2, wallThickness / 2)
        .setTranslation(0, wallHeight / 2, ROOM_HALF_SIZE)
    );

    this.physicsWorld.createCollider(
      RAPIER.ColliderDesc
        .cuboid(wallThickness / 2, wallHeight / 2, ROOM_HALF_SIZE)
        .setTranslation(-ROOM_HALF_SIZE, wallHeight / 2, 0)
    );

    this.physicsWorld.createCollider(
      RAPIER.ColliderDesc
        .cuboid(wallThickness / 2, wallHeight / 2, ROOM_HALF_SIZE)
        .setTranslation(ROOM_HALF_SIZE, wallHeight / 2, 0)
    );

    this.physicsWorld.createCollider(
      RAPIER.ColliderDesc
        .capsule(0.46, 0.28)
        .setTranslation(0, 0.70, -3.2)
    );

    const playerBodyDesc = RAPIER.RigidBodyDesc
      .kinematicPositionBased()
      .setTranslation(this.player.position.x, this.playerColliderCenterY, this.player.position.z);

    this.playerBody = this.physicsWorld.createRigidBody(playerBodyDesc);

    this.playerCollider = this.physicsWorld.createCollider(
      RAPIER.ColliderDesc.capsule(0.46, 0.24),
      this.playerBody
    );

    this.characterController = this.physicsWorld.createCharacterController(0.035);
    this.characterController.setUp({ x: 0, y: 1, z: 0 });
  }

  buildScene() {
    const ambient = new THREE.HemisphereLight(0xdce8ff, 0x101522, 1.65);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(5, 8, 6);
    key.castShadow = true;
    key.shadow.mapSize.width = 2048;
    key.shadow.mapSize.height = 2048;
    this.scene.add(key);

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111722,
      roughness: 0.86,
      metalness: 0.03
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_HALF_SIZE * 2, ROOM_HALF_SIZE * 2), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    this.addRoomWalls();
    this.addGridLines();
    this.addWeaponRack();

    this.playerGroup = this.createPlayerRig();
    this.scene.add(this.playerGroup);

    this.mannequinGroup = this.createMannequin();
    this.mannequinGroup.position.set(0, 0, -3.2);
    this.mannequinGroup.scale.setScalar(MANNEQUIN_VISUAL_SCALE);
    this.scene.add(this.mannequinGroup);

    this.visionGroup = new THREE.Group();
    this.scene.add(this.visionGroup);

    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffe1a0,
      transparent: true,
      opacity: 0
    });

    this.coreMarker = new THREE.Mesh(new THREE.SphereGeometry(0.07, 18, 18), coreMat);
    this.coreMarker.visible = false;
    this.scene.add(this.coreMarker);

    this.createWorldPracticeObjects();
    this.createWeaponForSelected();
    this.updateRig(0.016);
  }

  addRoomWalls() {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1d2637,
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

  createPlayerRig() {
    const group = new THREE.Group();
    group.scale.setScalar(PLAYER_VISUAL_SCALE);

    const cloth = new THREE.MeshStandardMaterial({ color: 0x3a465d, roughness: 0.7 });
    const darkCloth = new THREE.MeshStandardMaterial({ color: 0x263044, roughness: 0.74 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xd8ad78, roughness: 0.72 });
    const jointMat = new THREE.MeshStandardMaterial({ color: 0x6f7d96, roughness: 0.66 });
    const accent = new THREE.MeshStandardMaterial({ color: 0xd9b56f, roughness: 0.55 });

    const rig = {
      group,
      materials: { cloth, darkCloth, skin, jointMat, accent },
      limbs: {},
      joints: {},
      boxes: {},
      points: {
        leftHand: new THREE.Vector3(),
        rightHand: new THREE.Vector3(),
        leftFoot: new THREE.Vector3(),
        rightFoot: new THREE.Vector3()
      }
    };

    rig.boxes.pelvis = createBoxPart(new THREE.Vector3(0.48, 0.20, 0.30), new THREE.Vector3(0, 0.78, 0), darkCloth);
    rig.boxes.leftHand = createBoxPart(new THREE.Vector3(0.11, 0.07, 0.16), new THREE.Vector3(-0.43, 0.88, -0.38), skin);
    rig.boxes.rightHand = createBoxPart(new THREE.Vector3(0.11, 0.07, 0.16), new THREE.Vector3(0.43, 0.88, -0.38), skin);
    rig.boxes.leftFoot = createBoxPart(new THREE.Vector3(0.16, 0.07, 0.28), new THREE.Vector3(-0.21, 0.055, -0.11), darkCloth);
    rig.boxes.rightFoot = createBoxPart(new THREE.Vector3(0.16, 0.07, 0.28), new THREE.Vector3(0.21, 0.055, -0.11), darkCloth);
    rig.boxes.leftToe = createBoxPart(new THREE.Vector3(0.15, 0.045, 0.10), new THREE.Vector3(-0.21, 0.045, -0.28), darkCloth);
    rig.boxes.rightToe = createBoxPart(new THREE.Vector3(0.15, 0.045, 0.10), new THREE.Vector3(0.21, 0.045, -0.28), darkCloth);
    rig.boxes.facingMark = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.24), accent);
    rig.boxes.facingMark.position.set(0, 1.42, -0.36);
    rig.boxes.facingMark.castShadow = true;

    rig.limbs.abdomen = new DynamicLimb(0.25, cloth, 18);
    rig.limbs.lowerChest = new DynamicLimb(0.30, cloth, 18);
    rig.limbs.upperChest = new DynamicLimb(0.34, cloth, 18);
    rig.limbs.neck = new DynamicLimb(0.095, skin, 14);
    rig.limbs.shoulderLine = new DynamicLimb(0.055, darkCloth, 12);

    rig.limbs.leftUpperArm = new DynamicLimb(0.075, cloth, 12);
    rig.limbs.leftForearm = new DynamicLimb(0.060, cloth, 12);
    rig.limbs.rightUpperArm = new DynamicLimb(0.075, cloth, 12);
    rig.limbs.rightForearm = new DynamicLimb(0.060, cloth, 12);

    rig.limbs.leftThigh = new DynamicLimb(0.095, darkCloth, 14);
    rig.limbs.leftShin = new DynamicLimb(0.070, cloth, 12);
    rig.limbs.rightThigh = new DynamicLimb(0.095, darkCloth, 14);
    rig.limbs.rightShin = new DynamicLimb(0.070, cloth, 12);

    for (const [name, limb] of Object.entries(rig.limbs)) {
      limb.mesh.name = name;
      group.add(limb.mesh);
    }

    const jointNames = [
      "head",
      "leftShoulder",
      "rightShoulder",
      "leftElbow",
      "rightElbow",
      "leftWrist",
      "rightWrist",
      "leftHip",
      "rightHip",
      "leftKnee",
      "rightKnee",
      "leftAnkle",
      "rightAnkle"
    ];

    for (const name of jointNames) {
      const radius =
        name === "head" ? 0.22 :
        name.includes("Shoulder") ? 0.095 :
        name.includes("Elbow") ? 0.075 :
        name.includes("Wrist") ? 0.045 :
        name.includes("Hip") ? 0.085 :
        name.includes("Knee") ? 0.075 :
        name.includes("Ankle") ? 0.055 :
        0.06;

      const material = name === "head" ? skin : jointMat;
      rig.joints[name] = createJoint(new THREE.Vector3(), radius, material);
      group.add(rig.joints[name]);
    }

    const fingerParts = [];

    for (let side of [-1, 1]) {
      for (let i = -1; i <= 1; i += 1) {
        const finger = new DynamicLimb(0.012, skin, 8);
        fingerParts.push({
          side,
          index: i,
          limb: finger
        });
        group.add(finger.mesh);
      }
    }

    rig.fingers = fingerParts;

    group.add(
      rig.boxes.pelvis,
      rig.boxes.leftHand,
      rig.boxes.rightHand,
      rig.boxes.leftFoot,
      rig.boxes.rightFoot,
      rig.boxes.leftToe,
      rig.boxes.rightToe,
      rig.boxes.facingMark
    );

    this.rig = rig;

    return group;
  }

  createMannequin() {
    const group = new THREE.Group();

    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x8f978f,
      roughness: 0.9,
      metalness: 0.05
    });

    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x616a68,
      roughness: 0.94
    });

    const marker = new THREE.MeshStandardMaterial({
      color: 0xd9b56f,
      roughness: 0.6,
      emissive: 0x3a2500,
      emissiveIntensity: 0.05
    });

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.54, 0.14, 24), towerMat);
    base.position.y = 0.07;
    base.castShadow = true;
    base.receiveShadow = true;

    const pelvis = createBoxPart(new THREE.Vector3(0.46, 0.18, 0.28), new THREE.Vector3(0, 0.72, 0), towerMat);
    const abdomen = createLimb(new THREE.Vector3(0, 0.80, 0), new THREE.Vector3(0, 1.02, -0.01), 0.22, towerMat, 18);
    const lowerTorso = createLimb(new THREE.Vector3(0, 1.00, -0.01), new THREE.Vector3(0, 1.20, -0.02), 0.27, towerMat, 18);
    const upperTorso = createLimb(new THREE.Vector3(0, 1.18, -0.02), new THREE.Vector3(0, 1.38, -0.03), 0.31, towerMat, 18);
    const neck = createLimb(new THREE.Vector3(0, 1.42, -0.02), new THREE.Vector3(0, 1.53, -0.02), 0.08, jointMat, 12);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 20, 20), towerMat);
    head.position.y = 1.71;
    head.castShadow = true;

    const shoulderLine = createLimb(
      new THREE.Vector3(-0.41, 1.32, -0.02),
      new THREE.Vector3(0.41, 1.32, -0.02),
      0.055,
      towerMat,
      12
    );

    const leftShoulder = createJoint(new THREE.Vector3(-0.45, 1.31, -0.02), 0.08, jointMat);
    const rightShoulder = createJoint(new THREE.Vector3(0.45, 1.31, -0.02), 0.08, jointMat);

    const leftUpperArm = createLimb(new THREE.Vector3(-0.47, 1.28, -0.02), new THREE.Vector3(-0.62, 1.06, 0.00), 0.055, towerMat, 12);
    const rightUpperArm = createLimb(new THREE.Vector3(0.47, 1.28, -0.02), new THREE.Vector3(0.62, 1.06, 0.00), 0.055, towerMat, 12);

    const leftElbow = createJoint(new THREE.Vector3(-0.62, 1.06, 0.00), 0.055, jointMat);
    const rightElbow = createJoint(new THREE.Vector3(0.62, 1.06, 0.00), 0.055, jointMat);

    const leftForearm = createLimb(new THREE.Vector3(-0.62, 1.04, 0.00), new THREE.Vector3(-0.52, 0.86, -0.15), 0.045, towerMat, 12);
    const rightForearm = createLimb(new THREE.Vector3(0.62, 1.04, 0.00), new THREE.Vector3(0.52, 0.86, -0.15), 0.045, towerMat, 12);

    const leftWrist = createJoint(new THREE.Vector3(-0.52, 0.86, -0.15), 0.040, jointMat);
    const rightWrist = createJoint(new THREE.Vector3(0.52, 0.86, -0.15), 0.040, jointMat);

    const leftHand = createBoxPart(new THREE.Vector3(0.09, 0.055, 0.13), new THREE.Vector3(-0.50, 0.82, -0.23), towerMat);
    const rightHand = createBoxPart(new THREE.Vector3(0.09, 0.055, 0.13), new THREE.Vector3(0.50, 0.82, -0.23), towerMat);

    const leftHip = createJoint(new THREE.Vector3(-0.18, 0.65, 0), 0.07, jointMat);
    const rightHip = createJoint(new THREE.Vector3(0.18, 0.65, 0), 0.07, jointMat);

    const leftThigh = createLimb(new THREE.Vector3(-0.18, 0.62, 0), new THREE.Vector3(-0.20, 0.38, -0.01), 0.075, towerMat, 12);
    const rightThigh = createLimb(new THREE.Vector3(0.18, 0.62, 0), new THREE.Vector3(0.20, 0.38, -0.01), 0.075, towerMat, 12);

    const leftKnee = createJoint(new THREE.Vector3(-0.20, 0.37, -0.01), 0.058, jointMat);
    const rightKnee = createJoint(new THREE.Vector3(0.20, 0.37, -0.01), 0.058, jointMat);

    const leftShin = createLimb(new THREE.Vector3(-0.20, 0.34, -0.01), new THREE.Vector3(-0.21, 0.16, -0.02), 0.055, towerMat, 12);
    const rightShin = createLimb(new THREE.Vector3(0.20, 0.34, -0.01), new THREE.Vector3(0.21, 0.16, -0.02), 0.055, towerMat, 12);

    const leftAnkle = createJoint(new THREE.Vector3(-0.21, 0.14, -0.02), 0.045, jointMat);
    const rightAnkle = createJoint(new THREE.Vector3(0.21, 0.14, -0.02), 0.045, jointMat);

    const leftFoot = createBoxPart(new THREE.Vector3(0.14, 0.055, 0.22), new THREE.Vector3(-0.21, 0.08, -0.09), towerMat);
    const rightFoot = createBoxPart(new THREE.Vector3(0.14, 0.055, 0.22), new THREE.Vector3(0.21, 0.08, -0.09), towerMat);

    const markerLine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.32), marker);
    markerLine.position.set(0, 1.26, -0.26);
    markerLine.castShadow = true;

    group.add(
      base,
      pelvis,
      abdomen,
      lowerTorso,
      upperTorso,
      neck,
      head,
      shoulderLine,
      leftShoulder,
      rightShoulder,
      leftUpperArm,
      rightUpperArm,
      leftElbow,
      rightElbow,
      leftForearm,
      rightForearm,
      leftWrist,
      rightWrist,
      leftHand,
      rightHand,
      leftHip,
      rightHip,
      leftThigh,
      rightThigh,
      leftKnee,
      rightKnee,
      leftShin,
      rightShin,
      leftAnkle,
      rightAnkle,
      leftFoot,
      rightFoot,
      markerLine
    );

    return group;
  }

  createWorldPracticeObjects() {
    const placements = [
      { weaponId: "practiceKnife", position: new THREE.Vector3(-6.35, 0.95, -5.65), rotationY: Math.PI * 0.15 },
      { weaponId: "practiceBlade", position: new THREE.Vector3(-6.90, 1.10, -5.65), rotationY: Math.PI * 0.05 },
      { weaponId: "practiceStaff", position: new THREE.Vector3(-7.45, 1.20, -5.65), rotationY: -Math.PI * 0.05 },
      { weaponId: "weightedTrainer", position: new THREE.Vector3(-5.95, 0.32, -4.65), rotationY: Math.PI * 0.35 },
      { weaponId: "chainTrainer", position: new THREE.Vector3(-7.45, 0.42, -4.55), rotationY: -Math.PI * 0.25 }
    ];

    for (const placement of placements) {
      const weapon = weapons.find((item) => item.id === placement.weaponId);
      if (!weapon) continue;

      const object = this.createGrabbableFromWeapon(weapon, placement.position, false);
      object.mesh.rotation.y = placement.rotationY;
      this.scene.add(object.mesh);
      this.grabbables.push(object);
    }

    const blockMat = new THREE.MeshStandardMaterial({
      color: 0x586273,
      roughness: 0.82,
      metalness: 0.04
    });

    const block = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.32, 0.44), blockMat);
    block.position.set(2.4, 0.18, -4.8);
    block.castShadow = true;
    block.receiveShadow = true;

    const object = {
      id: `prop_block_${cryptoRandomId()}`,
      name: "塔片",
      type: "prop",
      mesh: block,
      weight: 1.2,
      length: 0.44,
      holders: new Set(),
      primaryHand: null,
      selectedObject: false
    };

    this.scene.add(block);
    this.grabbables.push(object);
  }

  createWeaponForSelected() {
    const weapon = this.getWeapon();

    if (this.lastWeaponId === weapon.id && this.selectedHandObject) return;

    if (this.selectedHandObject) {
      this.clearObjectFromHands(this.selectedHandObject);
      this.scene.remove(this.selectedHandObject.mesh);
      this.grabbables = this.grabbables.filter((object) => object !== this.selectedHandObject);
      this.selectedHandObject = null;
    }

    this.lastWeaponId = weapon.id;

    if (weapon.type === "hand") {
      return;
    }

    const object = this.createGrabbableFromWeapon(
      weapon,
      new THREE.Vector3(0.45, 0.90, 3.72),
      true
    );

    this.scene.add(object.mesh);
    this.grabbables.push(object);
    this.selectedHandObject = object;
    this.forceGrab("right", object);
  }

  createGrabbableFromWeapon(weapon, position, selectedObject) {
    const mesh = this.createWeaponMesh(weapon);
    mesh.position.copy(position);

    mesh.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    return {
      id: `${weapon.id}_${cryptoRandomId()}`,
      name: weapon.name,
      type: weapon.type,
      talentAffinity: weapon.talentAffinity,
      mesh,
      weight: weapon.weight,
      length: weapon.length,
      holders: new Set(),
      primaryHand: null,
      selectedObject
    };
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

    const rawDt = Math.min(this.clock.getDelta(), 0.033);

    let dt = rawDt;

    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - rawDt);
      dt *= 0.18;
    }

    if (this.talentEffects.time > 0) {
      dt *= 0.82;
    }

    this.createWeaponForSelected();
    this.update(dt, rawDt);

    this.renderer.render(this.scene, this.camera);
    this.drawAttackTrail();

    this.frameId = requestAnimationFrame(() => this.loop());
  }

  update(dt, rawDt) {
    this.player.dashCooldown = Math.max(0, this.player.dashCooldown - dt);
    this.hitCooldown = Math.max(0, this.hitCooldown - rawDt);
    this.talentCooldown = Math.max(0, this.talentCooldown - rawDt);

    this.updateMovement(dt);
    this.updateFacing(dt);
    this.updateHandControls(dt);
    this.updateRig(dt);
    this.updateHeldObjects(dt);
    this.updateTalentVisuals(rawDt);
    this.updateCamera(dt);
    this.updateHitReaction(rawDt);
    this.updateTowerSignal(rawDt);
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

    const cameraForward = new THREE.Vector3();
    this.camera.getWorldDirection(cameraForward);
    cameraForward.y = 0;

    if (cameraForward.lengthSq() < 0.001) {
      cameraForward.set(0, 0, -1);
    }

    cameraForward.normalize();

    const cameraRight = new THREE.Vector3()
      .crossVectors(cameraForward, new THREE.Vector3(0, 1, 0))
      .normalize();

    let targetVelocity = new THREE.Vector3();

    if (input.lengthSq() > 0.001) {
      const visualMove = new THREE.Vector3()
        .addScaledVector(cameraRight, input.x)
        .addScaledVector(cameraForward, -input.z);

      if (visualMove.lengthSq() > 0.001) {
        visualMove.normalize();
      }

      this.lastVisualMove.copy(visualMove);

      const hasHeavyHeld = this.getHeldWeight() > 1.55;
      const speedBase = this.keys.has("shift") ? this.player.slowSpeed : this.player.speed;
      const weightPenalty = hasHeavyHeld ? 0.78 : 1.0;

      targetVelocity.copy(visualMove).multiplyScalar(speedBase * weightPenalty);
    }

    if (this.stepBurst > 0) {
      targetVelocity.addScaledVector(this.getForwardWorld(), this.stepBurst);
      this.stepBurst = Math.max(0, this.stepBurst - dt * 7.5);
    }

    const acceleration = input.lengthSq() > 0.001 ? 1 - Math.exp(-12 * dt) : 1 - Math.exp(-9 * dt);
    this.velocity.lerp(targetVelocity, acceleration);

    const desiredMove = this.velocity.clone().multiplyScalar(dt);

    if (this.physicsWorld && this.characterController && this.playerCollider && this.playerBody) {
      this.characterController.computeColliderMovement(
        this.playerCollider,
        {
          x: desiredMove.x,
          y: 0,
          z: desiredMove.z
        }
      );

      const correctedMove = this.characterController.computedMovement();
      const currentTranslation = this.playerBody.translation();

      const nextTranslation = {
        x: currentTranslation.x + correctedMove.x,
        y: this.playerColliderCenterY,
        z: currentTranslation.z + correctedMove.z
      };

      this.playerBody.setNextKinematicTranslation(nextTranslation);
      this.physicsWorld.step();

      const newTranslation = this.playerBody.translation();

      this.player.position.set(
        newTranslation.x,
        0,
        newTranslation.z
      );
    } else {
      this.player.position.add(desiredMove);

      const moveLimit = ROOM_HALF_SIZE - 1.2;
      this.player.position.x = clamp(this.player.position.x, -moveLimit, moveLimit);
      this.player.position.z = clamp(this.player.position.z, -moveLimit, moveLimit);
    }

    const speed = this.velocity.length();
    const maxSpeed = this.keys.has("shift") ? this.player.slowSpeed : this.player.speed;
    this.moveAmount = clamp(speed / Math.max(0.001, maxSpeed), 0, 1);

    if (speed > 0.03) {
      this.walkPhase += dt * lerp(5.2, 9.2, this.moveAmount);
    }

    const distanceToTarget = this.player.position.distanceTo(this.mannequinGroup.position);

    if (distanceToTarget < 1.75) {
      this.towerStats.closeRangeTime += dt;
      state.towerMemory.closeRangeTime += dt;
      this.towerStats.limitPressure += dt * 0.8;
    }

    if (input.lengthSq() > 0.001 && !this.getLockOn()) {
      this.player.yaw = Math.atan2(-this.lastVisualMove.x, -this.lastVisualMove.z);
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

  updateHandControls(dt) {
    for (const side of ["left", "right"]) {
      const hand = this.hands[side];

      hand.controlX = lerp(hand.controlX, hand.targetControlX, 1 - Math.exp(-15 * dt));
      hand.controlY = lerp(hand.controlY, hand.targetControlY, 1 - Math.exp(-15 * dt));

      hand.targetControlX *= Math.exp(-5.8 * dt);
      hand.targetControlY *= Math.exp(-5.8 * dt);

      hand.thrust += hand.thrustVelocity * dt;
      hand.thrustVelocity -= hand.thrust * 42 * dt;
      hand.thrustVelocity *= Math.exp(-12 * dt);
      hand.thrust = clamp(hand.thrust, 0, 0.72);

      hand.reachPulse = Math.max(0, hand.reachPulse - dt * 3.0);
    }
  }

  updateRig(dt) {
    if (!this.rig) return;

    const rig = this.rig;
    const phase = this.walkPhase;
    const move = this.moveAmount;

    const bob = Math.abs(Math.sin(phase * 2)) * 0.035 * move;
    const sideSway = Math.sin(phase) * 0.035 * move;
    const pelvisYaw = Math.sin(phase) * 0.11 * move;
    const pelvisRoll = Math.sin(phase * 2) * 0.035 * move;

    const unconsciousLean = this.talentEffects.unconscious > 0 ? 0.10 * this.talentEffects.unconscious : 0;

    const pelvis = new THREE.Vector3(sideSway, 0.78 + bob, -unconsciousLean * 0.1);
    const abdomenA = pelvis.clone().add(new THREE.Vector3(0, 0.08, 0));
    const abdomenB = new THREE.Vector3(-sideSway * 0.35, 1.10 + bob * 0.6, -0.01 - unconsciousLean * 0.05);

    const lowerChestA = abdomenB.clone();
    const lowerChestB = new THREE.Vector3(-sideSway * 0.55, 1.31 + bob * 0.45, -0.03 - unconsciousLean * 0.08);

    const upperChestA = lowerChestB.clone();
    const upperChestB = new THREE.Vector3(-sideSway * 0.70, 1.49 + bob * 0.28, -0.04 - unconsciousLean * 0.1);

    const neckA = upperChestB.clone().add(new THREE.Vector3(0, 0.03, 0.02));
    const neckB = neckA.clone().add(new THREE.Vector3(0, 0.11, 0));

    const head = neckB.clone().add(new THREE.Vector3(0, 0.19, 0));

    setObjectPosition(rig.boxes.pelvis, pelvis);
    rig.boxes.pelvis.rotation.set(pelvisRoll, pelvisYaw, pelvisRoll * 0.45);

    rig.limbs.abdomen.set(abdomenA, abdomenB);
    rig.limbs.lowerChest.set(lowerChestA, lowerChestB);
    rig.limbs.upperChest.set(upperChestA, upperChestB);
    rig.limbs.neck.set(neckA, neckB);
    rig.joints.head.position.copy(head);

    const shoulderLeft = upperChestB.clone().add(new THREE.Vector3(-0.43, -0.06, -0.02));
    const shoulderRight = upperChestB.clone().add(new THREE.Vector3(0.43, -0.06, -0.02));

    rig.limbs.shoulderLine.set(shoulderLeft, shoulderRight);
    rig.joints.leftShoulder.position.copy(shoulderLeft);
    rig.joints.rightShoulder.position.copy(shoulderRight);

    const leftHandTarget = this.getHandTargetLocal("left", shoulderLeft, phase, move);
    const rightHandTarget = this.getHandTargetLocal("right", shoulderRight, phase, move);

    this.solveArmIK("left", shoulderLeft, leftHandTarget);
    this.solveArmIK("right", shoulderRight, rightHandTarget);

    const leftHip = pelvis.clone().add(new THREE.Vector3(-0.18, -0.06, 0.01));
    const rightHip = pelvis.clone().add(new THREE.Vector3(0.18, -0.06, 0.01));

    rig.joints.leftHip.position.copy(leftHip);
    rig.joints.rightHip.position.copy(rightHip);

    const leftFootTarget = this.getFootTargetLocal("left", phase, move);
    const rightFootTarget = this.getFootTargetLocal("right", phase + Math.PI, move);

    this.solveLegIK("left", leftHip, leftFootTarget);
    this.solveLegIK("right", rightHip, rightFootTarget);

    rig.boxes.facingMark.position.set(-sideSway * 0.75, 1.42 + bob * 0.3, -0.36 - unconsciousLean * 0.08);
    rig.boxes.facingMark.rotation.set(0, pelvisYaw * -0.35, 0);
  }

  getHandTargetLocal(side, shoulder, phase, move) {
    const sign = side === "left" ? -1 : 1;
    const hand = this.hands[side];
    const otherSide = side === "left" ? "right" : "left";
    const otherHand = this.hands[otherSide];

    const armPhase = phase + (side === "left" ? 0 : Math.PI);
    const naturalSwing = Math.sin(armPhase) * 0.16 * move;
    const naturalLift = Math.max(0, Math.sin(armPhase)) * 0.04 * move;

    const base = new THREE.Vector3(
      sign * 0.43,
      0.91 + naturalLift,
      -0.35 + naturalSwing
    );

    if (hand.heldObject) {
      const twoHanded = hand.heldObject.holders.size >= 2;

      if (twoHanded) {
        const separation = clamp(hand.heldObject.length * 0.26, 0.26, 0.50);
        base.set(
          sign * separation,
          0.94 - hand.heldObject.weight * 0.02,
          -0.48
        );
      } else {
        base.set(
          sign * 0.42,
          0.90 - hand.heldObject.weight * 0.025,
          -0.44 - clamp(hand.heldObject.length, 0.4, 1.6) * 0.08
        );
      }
    } else if (otherHand.heldObject && otherHand.heldObject.holders.size >= 2) {
      base.set(sign * 0.34, 0.93, -0.45);
    }

    base.x += hand.controlX * 0.34;
    base.y += -hand.controlY * 0.18;
    base.z += -hand.thrust * 0.55 - hand.reachPulse * 0.15;

    if (this.talentEffects.unconscious > 0) {
      base.z -= 0.12 * this.talentEffects.unconscious;
      base.y += 0.03 * this.talentEffects.unconscious;
    }

    const maxReach = 0.61;
    const fromShoulder = base.clone().sub(shoulder);

    if (fromShoulder.length() > maxReach) {
      fromShoulder.setLength(maxReach);
      base.copy(shoulder).add(fromShoulder);
    }

    return base;
  }

  getFootTargetLocal(side, phase, move) {
    const sign = side === "left" ? -1 : 1;
    const step = Math.sin(phase) * 0.20 * move;
    const lift = Math.max(0, Math.cos(phase)) * 0.095 * move;
    const width = 0.21 + Math.abs(Math.sin(phase)) * 0.015 * move;

    return new THREE.Vector3(
      sign * width,
      0.055 + lift,
      -0.10 + step
    );
  }

  solveArmIK(side, shoulder, handTarget) {
    const rig = this.rig;
    const sign = side === "left" ? -1 : 1;
    const upperLength = 0.34;
    const foreLength = 0.34;

    const pole = new THREE.Vector3(sign * 0.42, -0.18, -0.38);
    const result = solveTwoBoneIK(shoulder, handTarget, pole, upperLength, foreLength);

    const upperName = `${side}UpperArm`;
    const foreName = `${side}Forearm`;
    const elbowName = `${side}Elbow`;
    const wristName = `${side}Wrist`;
    const handBoxName = `${side}Hand`;

    rig.limbs[upperName].set(shoulder, result.elbow);
    rig.limbs[foreName].set(result.elbow, result.end);

    rig.joints[elbowName].position.copy(result.elbow);
    rig.joints[wristName].position.copy(result.end);

    rig.boxes[handBoxName].position.copy(result.end);
    rig.boxes[handBoxName].rotation.set(
      this.hands[side].controlY * 0.8,
      sign * 0.2 + this.hands[side].controlX * 0.5,
      sign * -0.12
    );

    rig.points[`${side}Hand`].copy(result.end);

    this.updateFingers(side, result.end);
  }

  solveLegIK(side, hip, footTarget) {
    const rig = this.rig;
    const sign = side === "left" ? -1 : 1;
    const thighLength = 0.37;
    const shinLength = 0.35;

    const pole = new THREE.Vector3(sign * 0.06, -0.25, -0.48);
    const result = solveTwoBoneIK(hip, footTarget, pole, thighLength, shinLength);

    const thighName = `${side}Thigh`;
    const shinName = `${side}Shin`;
    const kneeName = `${side}Knee`;
    const ankleName = `${side}Ankle`;
    const footName = `${side}Foot`;
    const toeName = `${side}Toe`;

    rig.limbs[thighName].set(hip, result.elbow);
    rig.limbs[shinName].set(result.elbow, result.end);

    rig.joints[kneeName].position.copy(result.elbow);
    rig.joints[ankleName].position.copy(result.end);

    rig.boxes[footName].position.copy(result.end).add(new THREE.Vector3(0, -0.045, -0.085));
    rig.boxes[footName].rotation.set(0.04, 0, sign * 0.02);

    rig.boxes[toeName].position.copy(result.end).add(new THREE.Vector3(0, -0.055, -0.245));
    rig.boxes[toeName].rotation.set(-0.12 * this.moveAmount, 0, 0);

    rig.points[`${side}Foot`].copy(result.end);
  }

  updateFingers(side, handPosition) {
    const rig = this.rig;
    const sign = side === "left" ? -1 : 1;
    const hand = this.hands[side];
    const curl = hand.heldObject ? 0.065 : 0.025;

    for (const finger of rig.fingers) {
      if (finger.side !== sign) continue;

      const x = handPosition.x + sign * finger.index * 0.025;
      const start = new THREE.Vector3(x, handPosition.y - 0.025, handPosition.z - 0.055);
      const end = new THREE.Vector3(
        x + sign * 0.006,
        handPosition.y - 0.040 - curl * 0.15,
        handPosition.z - 0.115 + curl
      );

      finger.limb.set(start, end);
    }
  }

  updateHeldObjects(dt) {
    const handledObjects = new Set();

    for (const side of ["left", "right"]) {
      const object = this.hands[side].heldObject;
      if (!object || handledObjects.has(object)) continue;

      handledObjects.add(object);

      const holders = Array.from(object.holders);
      if (holders.length === 0) continue;

      const primary = object.primaryHand || holders[0];
      const primaryWorld = this.getHandWorldPosition(primary);
      const forward = this.getForwardWorld();
      const right = this.getRightWorld();
      const up = new THREE.Vector3(0, 1, 0);

      if (object.type === "prop") {
        if (holders.length >= 2) {
          const left = this.getHandWorldPosition("left");
          const rightHand = this.getHandWorldPosition("right");
          object.mesh.position.copy(left).lerp(rightHand, 0.5);
        } else {
          object.mesh.position.copy(primaryWorld);
        }
      } else {
        object.mesh.position.copy(primaryWorld);
        object.mesh.position.addScaledVector(forward, -0.02);
        object.mesh.position.addScaledVector(right, primary === "right" ? 0.015 : -0.015);
        object.mesh.position.addScaledVector(up, -0.01);

        const yaw = this.player.yaw;
        object.mesh.rotation.set(
          this.getHandPitch(primary) * 0.35,
          yaw + this.getHandYaw(primary) * 0.35,
          this.getHandRoll(primary) * 0.35
        );

        if (holders.length >= 2) {
          object.mesh.rotation.x *= 0.45;
          object.mesh.rotation.z *= 0.35;
        }
      }

      const lag = clamp(object.weight - 1, 0, 1.2) * 0.08;
      object.mesh.position.y -= lag * this.moveAmount;
    }
  }

  updateTalentVisuals(dt) {
    this.talentEffects.trajectory = Math.max(0, this.talentEffects.trajectory - dt);
    this.talentEffects.core = Math.max(0, this.talentEffects.core - dt);
    this.talentEffects.time = Math.max(0, this.talentEffects.time - dt);
    this.talentEffects.unconscious = Math.max(0, this.talentEffects.unconscious - dt);

    if (this.visionGroup) {
      this.visionGroup.clear();

      if (this.talentEffects.trajectory > 0) {
        const alpha = clamp(this.talentEffects.trajectory / 1.6, 0, 1);
        const start = this.getHandWorldPosition("right");
        const target = this.mannequinGroup.position.clone();
        target.y = 0.95;

        const curveMid = start.clone().lerp(target, 0.52);
        curveMid.y += 0.28;

        const points = [
          start,
          curveMid,
          target
        ];

        const lineMat = new THREE.LineBasicMaterial({
          color: 0xffe3a4,
          transparent: true,
          opacity: 0.25 + alpha * 0.55
        });

        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMat);
        this.visionGroup.add(line);
      }
    }

    if (this.coreMarker) {
      if (this.talentEffects.core > 0) {
        const alpha = clamp(this.talentEffects.core / 1.6, 0, 1);
        const pulse = 1 + Math.sin(performance.now() * 0.018) * 0.25;

        this.coreMarker.visible = true;
        this.coreMarker.material.opacity = 0.2 + alpha * 0.75;
        this.coreMarker.scale.setScalar(pulse);

        const p = this.mannequinGroup.position.clone();
        p.y = 0.93;
        p.z -= 0.24;
        this.coreMarker.position.copy(p);
      } else {
        this.coreMarker.visible = false;
        this.coreMarker.material.opacity = 0;
      }
    }
  }

  updateTowerSignal(dt) {
    const signal = document.getElementById("towerSignal");
    if (!signal) return;

    this.talentEffects.messageTimer = Math.max(0, this.talentEffects.messageTimer - dt);

    if (this.talentEffects.messageTimer > 0) {
      signal.textContent = this.talentEffects.message;
      signal.style.opacity = "1";
    } else {
      signal.style.opacity = "0";
    }
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

      const lookTarget = new THREE.Vector3().copy(center);
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

    this.cameraShake = Math.max(0, this.cameraShake - dt * 4.6);

    const shake = this.cameraShake > 0
      ? new THREE.Vector3(
        (Math.random() - 0.5) * 0.06 * this.cameraShake,
        (Math.random() - 0.5) * 0.04 * this.cameraShake,
        (Math.random() - 0.5) * 0.06 * this.cameraShake
      )
      : new THREE.Vector3();

    this.camera.position.copy(this.cameraCurrent).add(shake);
    this.camera.lookAt(this.cameraTarget);
  }

  updateHitReaction(dt) {
    const points = this.getInteractionPoints();
    const target = new THREE.Vector3().copy(this.mannequinGroup.position);
    target.y = 1.05 * MANNEQUIN_VISUAL_SCALE;

    let flash = 0;

    for (const point of points) {
      if (point.distanceTo(target) < 0.48) {
        flash = 1;
        break;
      }
    }

    if (flash && this.hitCooldown <= 0) {
      this.hitCooldown = 0.18;
      this.hitStop = 0.045;
      this.cameraShake = Math.max(this.cameraShake, 1);
      this.registerContact();
    }

    for (const side of ["left", "right"]) {
      this.hands[side].hitFlash = Math.max(this.hands[side].hitFlash - dt * 3.2, flash);
    }

    const hitFlash = Math.max(this.hands.left.hitFlash, this.hands.right.hitFlash);
    const hitScale = 1 + hitFlash * 0.035;

    this.mannequinGroup.scale.set(
      MANNEQUIN_VISUAL_SCALE * hitScale,
      MANNEQUIN_VISUAL_SCALE * (1 + hitFlash * 0.02),
      MANNEQUIN_VISUAL_SCALE * hitScale
    );

    this.mannequinGroup.traverse((obj) => {
      if (obj.isMesh && obj.material && obj.material.emissive) {
        obj.material.emissiveIntensity = hitFlash * 0.45;
      }
    });
  }

  registerContact() {
    this.towerStats.contacts += 1;
    state.towerMemory.totalContacts += 1;
    this.towerStats.limitPressure += 0.85;

    const weapon = this.getWeapon();

    if (weapon.talentAffinity === "blade") {
      this.maybeAwakenHiddenTalent("blade_contact");
    } else if (weapon.talentAffinity === "barehand") {
      this.maybeAwakenHiddenTalent("barehand_contact");
    }

    if (this.towerStats.limitPressure > 6 && this.towerStats.contacts > 4) {
      this.maybeAwakenHiddenTalent("limit_pressure");
    }
  }

  maybeAwakenHiddenTalent(reason) {
    if (this.talentCooldown > 0) return;

    const weapon = this.getWeapon();
    const candidates = [];

    if (weapon.talentAffinity === "blade") {
      candidates.push("trajectory", "core");
    }

    if (weapon.talentAffinity === "barehand") {
      candidates.push("time");
    }

    if (reason === "limit_pressure" && this.towerStats.limitPressure > 6) {
      candidates.push("unconscious");
    }

    if (candidates.length === 0) return;

    let possible = candidates;

    if (state.hiddenTalent.internalId) {
      possible = candidates.filter((id) => id === state.hiddenTalent.internalId || id === "unconscious");

      if (possible.length === 0) return;
    }

    let chance = 0.045;

    if (reason === "blade_arc") chance = 0.055;
    if (reason === "barehand_contact") chance = 0.055;
    if (reason === "limit_pressure") chance = 0.035;
    if (state.hiddenTalent.stage > 0) chance += 0.025;

    if (Math.random() > chance) return;

    const chosen = possible[Math.floor(Math.random() * possible.length)];
    this.triggerHiddenTalent(chosen);
  }

  triggerHiddenTalent(id) {
    const definition = hiddenTalentDefinitions[id];
    if (!definition) return;

    if (!state.hiddenTalent.internalId || state.hiddenTalent.internalId === id) {
      state.hiddenTalent.internalId = id;
      state.hiddenTalent.stage = Math.min(6, state.hiddenTalent.stage + 1);
    }

    const message = definition.messages[Math.floor(Math.random() * definition.messages.length)];

    state.hiddenTalent.echoes.push({
      text: message,
      at: Date.now()
    });

    if (state.hiddenTalent.echoes.length > 8) {
      state.hiddenTalent.echoes.shift();
    }

    this.talentEffects.message = message;
    this.talentEffects.messageTimer = 2.4;
    this.talentCooldown = 1.6;

    if (id === "trajectory") {
      this.talentEffects.trajectory = 1.6;
      this.cameraShake = Math.max(this.cameraShake, 0.45);
    }

    if (id === "core") {
      this.talentEffects.core = 1.6;
      this.cameraShake = Math.max(this.cameraShake, 0.35);
    }

    if (id === "time") {
      this.talentEffects.time = 1.4;
      this.cameraShake = Math.max(this.cameraShake, 0.25);
    }

    if (id === "unconscious") {
      this.talentEffects.unconscious = 1.1;
      this.stepBurst = Math.max(this.stepBurst, 2.4);
      this.hands.left.thrustVelocity = Math.max(this.hands.left.thrustVelocity, 4.2);
      this.hands.right.thrustVelocity = Math.max(this.hands.right.thrustVelocity, 4.2);
      this.cameraShake = Math.max(this.cameraShake, 0.85);
    }
  }

  getInteractionPoints() {
    const points = [
      this.getHandWorldPosition("left"),
      this.getHandWorldPosition("right")
    ];

    for (const side of ["left", "right"]) {
      const hand = this.hands[side];

      if (hand.heldObject && hand.heldObject.type !== "prop") {
        const object = hand.heldObject;
        const tip = new THREE.Vector3(0, 0, -Math.max(0.42, object.length + 0.22));
        object.mesh.localToWorld(tip);
        points.push(tip);
      }
    }

    return points;
  }

  onKeyDown(event) {
    const key = event.key.toLowerCase();

    if (["q", "e", "r", "l", " "].includes(key)) {
      event.preventDefault();
    }

    if (event.repeat) {
      this.keys.add(key);
      return;
    }

    this.keys.add(key);

    if (key === "q") {
      this.toggleHandGrip("left");
      return;
    }

    if (key === "e") {
      this.toggleHandGrip("right");
      return;
    }

    if (key === "r") {
      this.toggleTwoHandedGrip();
      return;
    }

    if (key === "l") {
      state.lockOn = !state.lockOn;
      updateLockButton();
      return;
    }

    if (key === " " && this.player.dashCooldown <= 0) {
      this.stepBurst = 4.2;
      this.player.dashCooldown = 0.45;
      this.towerStats.dashUses += 1;
      state.towerMemory.dashes += 1;
      this.towerStats.limitPressure += 0.55;
      this.maybeAwakenHiddenTalent("limit_pressure");
    }
  }

  onKeyUp(event) {
    this.keys.delete(event.key.toLowerCase());
  }

  toggleHandGrip(side) {
    const hand = this.hands[side];

    if (hand.heldObject) {
      this.releaseHand(side);
      return;
    }

    const nearest = this.findNearestGrabbable(side);

    if (nearest) {
      this.forceGrab(side, nearest);
      hand.reachPulse = 1;
      this.towerStats.grabs += 1;
      state.towerMemory.grabs += 1;
    }
  }

  toggleTwoHandedGrip() {
    const leftObject = this.hands.left.heldObject;
    const rightObject = this.hands.right.heldObject;

    if (leftObject && rightObject && leftObject === rightObject) {
      if (leftObject.primaryHand === "right") {
        this.releaseHand("left");
      } else {
        this.releaseHand("right");
      }

      return;
    }

    if (rightObject && !leftObject) {
      this.forceGrab("left", rightObject);
      return;
    }

    if (leftObject && !rightObject) {
      this.forceGrab("right", leftObject);
    }
  }

  forceGrab(side, object) {
    const hand = this.hands[side];

    if (hand.heldObject && hand.heldObject !== object) {
      this.releaseHand(side);
    }

    hand.heldObject = object;
    hand.reachPulse = 1;

    object.holders.add(side);

    if (!object.primaryHand) {
      object.primaryHand = side;
    }
  }

  releaseHand(side) {
    const hand = this.hands[side];
    const object = hand.heldObject;

    if (!object) return;

    object.holders.delete(side);
    hand.heldObject = null;
    hand.reachPulse = 0.4;

    if (object.primaryHand === side) {
      object.primaryHand = object.holders.values().next().value ?? null;
    }

    if (object.holders.size === 0) {
      object.primaryHand = null;

      const position = object.mesh.position;
      position.y = object.type === "prop" ? 0.18 : Math.max(0.20, position.y);

      if (object.type !== "prop") {
        object.mesh.rotation.x = 0;
        object.mesh.rotation.z = 0;
      }
    }
  }

  clearObjectFromHands(object) {
    for (const side of ["left", "right"]) {
      if (this.hands[side].heldObject === object) {
        this.hands[side].heldObject = null;
      }
    }

    object.holders.clear();
    object.primaryHand = null;
  }

  findNearestGrabbable(side) {
    const handWorld = this.getHandWorldPosition(side);
    let nearest = null;
    let nearestDistance = Infinity;

    for (const object of this.grabbables) {
      if (object.holders.size > 0) continue;

      const distance = handWorld.distanceTo(object.mesh.position);

      if (distance < nearestDistance && distance <= 0.95) {
        nearest = object;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  getHandWorldPosition(side) {
    if (!this.rig || !this.playerGroup) {
      return new THREE.Vector3();
    }

    const local = this.rig.points[`${side}Hand`].clone();
    return this.playerGroup.localToWorld(local);
  }

  getForwardWorld() {
    return new THREE.Vector3(
      -Math.sin(this.player.yaw),
      0,
      -Math.cos(this.player.yaw)
    ).normalize();
  }

  getRightWorld() {
    return new THREE.Vector3(
      Math.cos(this.player.yaw),
      0,
      -Math.sin(this.player.yaw)
    ).normalize();
  }

  getHandYaw(side) {
    const hand = this.hands[side];
    const sign = side === "left" ? -1 : 1;
    return sign * 0.18 + hand.controlX * 0.9;
  }

  getHandPitch(side) {
    const hand = this.hands[side];
    return -0.18 + hand.controlY * 0.75 - hand.thrust * 0.18;
  }

  getHandRoll(side) {
    const hand = this.hands[side];
    const sign = side === "left" ? -1 : 1;
    return sign * -0.10 + hand.controlX * 0.30;
  }

  getHeldWeight() {
    const objects = new Set();

    for (const side of ["left", "right"]) {
      const object = this.hands[side].heldObject;
      if (object) objects.add(object);
    }

    let total = 0;

    for (const object of objects) {
      total += object.weight ?? 1;
    }

    return total;
  }

  onAttackDown(event) {
    if (event.target.closest?.(".move-stick")) return;

    event.preventDefault();

    this.canvas.setPointerCapture?.(event.pointerId);

    const point = this.getStagePoint(event);
    const hand = event.button === 2 ? "left" : "right";

    this.pointerAttack.active = true;
    this.pointerAttack.hand = hand;
    this.pointerAttack.startX = point.x;
    this.pointerAttack.startY = point.y;
    this.pointerAttack.x = point.x;
    this.pointerAttack.y = point.y;
    this.pointerAttack.lastX = point.x;
    this.pointerAttack.lastY = point.y;
    this.pointerAttack.startTime = performance.now();
    this.pointerAttack.points = [{ x: point.x, y: point.y, life: 1, hand }];

    if (hand === "left") {
      this.towerStats.leftHandUses += 1;
      state.towerMemory.leftHandUses += 1;
    } else {
      this.towerStats.rightHandUses += 1;
      state.towerMemory.rightHandUses += 1;
    }

    const weapon = this.getWeapon();

    if (weapon.talentAffinity === "barehand") {
      this.towerStats.barehandActions += 1;
      state.towerMemory.barehandActions += 1;
      this.maybeAwakenHiddenTalent("barehand_contact");
    }
  }

  onAttackMove(event) {
    if (!this.pointerAttack.active) return;

    event.preventDefault();

    const point = this.getStagePoint(event);
    const hand = this.hands[this.pointerAttack.hand];

    const width = this.stage.clientWidth;
    const height = this.stage.clientHeight;

    const dx = (point.x - this.pointerAttack.lastX) / Math.max(1, width);
    const dy = (point.y - this.pointerAttack.lastY) / Math.max(1, height);

    hand.targetControlX = clamp(hand.targetControlX + dx * 8.5, -1.25, 1.25);
    hand.targetControlY = clamp(hand.targetControlY + dy * 7.0, -1.05, 1.05);

    this.pointerAttack.lastX = point.x;
    this.pointerAttack.lastY = point.y;
    this.pointerAttack.x = point.x;
    this.pointerAttack.y = point.y;

    this.pointerAttack.points.push({
      x: point.x,
      y: point.y,
      life: 1,
      hand: this.pointerAttack.hand
    });

    const weapon = this.getWeapon();
    const movementMagnitude = Math.abs(dx) + Math.abs(dy);

    if (weapon.talentAffinity === "blade" && movementMagnitude > 0.012) {
      this.towerStats.bladeArcActions += 1;
      state.towerMemory.bladeArcActions += 1;

      if (this.towerStats.bladeArcActions % 7 === 0) {
        this.maybeAwakenHiddenTalent("blade_arc");
      }
    }
  }

  onAttackUp(event) {
    if (!this.pointerAttack.active) return;

    event.preventDefault();

    const point = this.getStagePoint(event);

    const totalDx = point.x - this.pointerAttack.startX;
    const totalDy = point.y - this.pointerAttack.startY;
    const distance = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
    const duration = performance.now() - this.pointerAttack.startTime;

    const hand = this.hands[this.pointerAttack.hand];

    if (duration < 230 && distance < 18) {
      hand.thrustVelocity = 8.5;
      hand.reachPulse = 0.8;
      this.towerStats.limitPressure += 0.35;
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
      const talentBoost =
        this.talentEffects.trajectory > 0 ||
        this.talentEffects.core > 0 ||
        this.talentEffects.time > 0
          ? 1.35
          : 1;

      const color = b.hand === "left" ? "146, 190, 255" : "217, 181, 111";

      ctx.strokeStyle = `rgba(${color}, ${alpha * 0.8})`;
      ctx.lineWidth = (4 + alpha * 4) * talentBoost;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    ctx.restore();
  }
}

class DynamicLimb {
  constructor(radius, material, radialSegments = 12) {
    this.radius = radius;
    this.mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, 1, radialSegments),
      material
    );

    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }

  set(start, end) {
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = Math.max(0.001, direction.length());

    this.mesh.scale.set(1, length, 1);
    this.mesh.position.copy(start).add(end).multiplyScalar(0.5);

    const normalizedDirection = direction.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);
    this.mesh.quaternion.setFromUnitVectors(up, normalizedDirection);
  }
}

function createHandState(side) {
  return {
    side,
    heldObject: null,
    controlX: 0,
    controlY: 0,
    targetControlX: 0,
    targetControlY: 0,
    thrust: 0,
    thrustVelocity: 0,
    reachPulse: 0,
    hitFlash: 0
  };
}

function solveTwoBoneIK(root, target, pole, upperLength, lowerLength) {
  const rootToTarget = new THREE.Vector3().subVectors(target, root);
  let distance = rootToTarget.length();

  const minDistance = Math.abs(upperLength - lowerLength) + 0.001;
  const maxDistance = upperLength + lowerLength - 0.001;

  distance = clamp(distance, minDistance, maxDistance);

  const direction = rootToTarget.lengthSq() > 0.0001
    ? rootToTarget.clone().normalize()
    : new THREE.Vector3(0, -1, 0);

  const clampedTarget = root.clone().addScaledVector(direction, distance);

  const a = (upperLength * upperLength - lowerLength * lowerLength + distance * distance) / (2 * distance);
  const hSq = Math.max(0, upperLength * upperLength - a * a);
  const h = Math.sqrt(hSq);

  let poleDirection = pole.clone();

  if (poleDirection.lengthSq() < 0.0001) {
    poleDirection.set(0, 0, -1);
  }

  poleDirection.normalize();
  poleDirection.sub(direction.clone().multiplyScalar(poleDirection.dot(direction)));

  if (poleDirection.lengthSq() < 0.0001) {
    poleDirection = new THREE.Vector3(0, 0, -1);
    poleDirection.sub(direction.clone().multiplyScalar(poleDirection.dot(direction)));
  }

  poleDirection.normalize();

  const elbow = root.clone()
    .addScaledVector(direction, a)
    .addScaledVector(poleDirection, h);

  return {
    elbow,
    end: clampedTarget
  };
}

function createLimb(start, end, radius, material, radialSegments = 12) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();

  const geometry = new THREE.CylinderGeometry(radius, radius, length, radialSegments);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.copy(start).add(end).multiplyScalar(0.5);

  const normalizedDirection = direction.clone().normalize();
  const up = new THREE.Vector3(0, 1, 0);
  mesh.quaternion.setFromUnitVectors(up, normalizedDirection);

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

function createJoint(position, radius, material) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 14), material);
  mesh.position.copy(position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createBoxPart(size, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material);
  mesh.position.copy(position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function setObjectPosition(object, position) {
  object.position.copy(position);
}

function cryptoRandomId() {
  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0].toString(16);
  }

  return Math.floor(Math.random() * 1_000_000_000).toString(16);
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
