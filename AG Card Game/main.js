import { Deck, Card, ActionQueue } from './js/card_system.js';
import { FarmManager } from './js/farming_system.js';
import { BattleState } from './js/dungeon_system.js';
import { Shop } from './js/shop_system.js';

class Game {
    constructor() {
        this.gold = 0;
        this.turnLimit = 10; // New Turn Limit
        this.deck = new Deck();
        // this.queue = new ActionQueue(); // Removed Queue
        this.farm = new FarmManager(9);
        this.dungeon = new BattleState();
        this.shop = new Shop(this);
        this.mode = 'FARM'; // 'FARM' or 'DUNGEON'

        this.ui = {
            gold: document.getElementById('gold-display'),
            turnDisplay: document.getElementById('turn-display'), // New Display
            farmGrid: document.getElementById('farm-grid'),
            hand: document.getElementById('hand-area'),
            // queue: document.getElementById('queue-slots'), // Removed
            drawCount: document.getElementById('draw-count'),
            discardCount: document.getElementById('discard-count'),
            // endTurnBtn: document.getElementById('btn-end-turn'), // Removed
            farmView: document.getElementById('farm-view'),
            dungeonView: document.getElementById('dungeon-view'),
            btnFarm: document.getElementById('btn-farm-mode'),
            btnDungeon: document.getElementById('btn-dungeon-mode'),
            btnShop: document.getElementById('btn-shop'),
            btnDeck: document.getElementById('btn-deck'),
            enemyArea: document.getElementById('enemy-area'),
            playerArea: document.getElementById('player-area'),
            modal: document.getElementById('modal-overlay'),
            modalTitle: document.getElementById('modal-title'),
            modalBody: document.getElementById('modal-body'),
            closeModal: document.getElementById('close-modal'),
            btnReset: document.getElementById('btn-reset')
        };

        if (this.ui.btnReset) {
            this.ui.btnReset.addEventListener('click', () => {
                if (confirm("Reset all progress?")) {
                    localStorage.removeItem('farmingDeckbuilderSave');
                    location.reload();
                }
            });
        }

        if (!this.loadGame()) {
            this.init();
        } else {
            this.render();
            this.startTurn();
        }
    }

    saveGame() {
        const state = {
            gold: this.gold,
            turnLimit: this.turnLimit,
            farm: this.farm.plots.map(p => ({
                id: p.id,
                crop: p.crop,
                waterLevel: p.waterLevel,
                growthProgress: p.growthProgress,
                isMature: p.isMature,
                effects: p.effects
            })),
        };
        localStorage.setItem('farmingDeckbuilderSave', JSON.stringify(state));
        console.log("Game Saved");
    }

    loadGame() {
        const saveRaw = localStorage.getItem('farmingDeckbuilderSave');
        if (!saveRaw) return false;

        try {
            const state = JSON.parse(saveRaw);
            this.gold = state.gold;
            this.turnLimit = state.turnLimit !== undefined ? state.turnLimit : 10; // Default to 10 if missing
            state.farm.forEach((pData, i) => {
                const plot = this.farm.plots[i];
                plot.crop = pData.crop;
                plot.waterLevel = pData.waterLevel;
                plot.growthProgress = pData.growthProgress;
                plot.isMature = pData.isMature;
                plot.effects = pData.effects || [];
            });

            this.createStarterDeck();
            this.deck.shuffle();

            // Event Listeners
            this.ui.btnFarm.addEventListener('click', () => this.switchMode('FARM'));
            this.ui.btnDungeon.addEventListener('click', () => this.switchMode('DUNGEON'));
            this.ui.btnShop.addEventListener('click', () => this.openShop());
            this.ui.btnDeck.addEventListener('click', () => this.openDeckViewer());
            this.ui.closeModal.addEventListener('click', () => this.closeModal());

            return true;
        } catch (e) {
            console.error("Save file corrupted", e);
            return false;
        }
    }

    init() {
        this.createStarterDeck();
        this.deck.shuffle();
        this.startTurn();

        // Event Listeners
        this.ui.btnFarm.addEventListener('click', () => this.switchMode('FARM'));
        this.ui.btnDungeon.addEventListener('click', () => this.switchMode('DUNGEON'));
        this.ui.btnShop.addEventListener('click', () => this.openShop());
        this.ui.btnDeck.addEventListener('click', () => this.openDeckViewer());
        this.ui.closeModal.addEventListener('click', () => this.closeModal());
    }

    openModal(title, contentFn) {
        this.ui.modalTitle.innerText = title;
        this.ui.modalBody.innerHTML = '';
        contentFn(this.ui.modalBody);
        this.ui.modal.classList.remove('hidden');
    }

    closeModal() {
        this.ui.modal.classList.add('hidden');
    }

    openDeckViewer() {
        this.openModal('Your Deck', (container) => {
            const grid = document.createElement('div');
            grid.className = 'card-grid';
            const allCards = [...this.deck.drawPile, ...this.deck.hand, ...this.deck.discardPile];
            allCards.sort((a, b) => a.name.localeCompare(b.name));
            allCards.forEach(card => {
                const el = document.createElement('div');
                el.className = 'card';
                el.innerHTML = `<div class="card-cost">${card.cost}</div><div>${card.name}</div>`;
                grid.appendChild(el);
            });
            container.appendChild(grid);
        });
    }

    openShop() {
        this.shop.generateItems();
        this.renderShop();
    }

    renderShop() {
        this.openModal('Shop', (container) => {
            container.innerHTML = `<div style="margin-bottom:10px">Gold: ${this.gold}</div>`;
            this.shop.items.forEach((item, index) => {
                const el = document.createElement('div');
                el.className = 'shop-item';
                el.innerHTML = `
                    <div>
                        <strong>${item.name}</strong> (${item.cost} Energy)<br>
                        <small>${item.desc}</small>
                    </div>
                    <button id="buy-btn-${index}">Buy ${item.price}g</button>
                `;
                container.appendChild(el);
                document.getElementById(`buy-btn-${index}`).onclick = () => {
                    if (this.shop.buyItem(index)) {
                        this.renderShop();
                        this.render();
                    } else {
                        alert("Not enough gold!");
                    }
                };
            });
            if (this.shop.items.length === 0) {
                container.innerHTML += '<div>Sold Out!</div>';
            }
        });
    }

    switchMode(newMode) {
        this.mode = newMode;
        if (this.mode === 'FARM') {
            this.ui.farmView.classList.add('active');
            this.ui.farmView.classList.remove('hidden');
            this.ui.dungeonView.classList.remove('active');
            this.ui.dungeonView.classList.add('hidden');
            this.ui.btnFarm.classList.add('active');
            this.ui.btnDungeon.classList.remove('active');
        } else {
            this.ui.farmView.classList.remove('active');
            this.ui.farmView.classList.add('hidden');
            this.ui.dungeonView.classList.add('active');
            this.ui.dungeonView.classList.remove('hidden');
            this.ui.btnFarm.classList.remove('active');
            this.ui.btnDungeon.classList.add('active');
            if (!this.dungeon.currentEnemy) {
                this.dungeon.spawnEnemy();
            }
        }
    }

    createStarterDeck() {
        const createWater = () => new Card('water', 'Water', 1, (ctx, targetId) => {
            if (targetId === undefined) return;
            const plots = ctx.getPlotsInShape(targetId, [[0, 0], [1, 0], [-1, 0]]);
            plots.forEach(p => p.water(1));
            console.log(`Watered ${plots.length} plots`);
        }, "Water 3x1 Area", [[0, 0], [1, 0], [-1, 0]]);

        const createSeed = () => new Card('seed', 'Wheat Seed', 1, (ctx, targetId) => {
            if (targetId === undefined) return;
            const plot = ctx.farm.getPlot(targetId);
            if (plot && !plot.crop) {
                plot.plant('WHEAT');
            }
        }, "Plant Wheat (Single)", [[0, 0]]);

        const createStorm = () => new Card('storm', 'Thunderstorm', 2, (ctx, targetId) => {
            if (targetId === undefined) return;
            const shape = [[0, 0], [1, 0], [-1, 0], [0, 1], [1, 1], [-1, 1]];
            const plots = ctx.getPlotsInShape(targetId, shape);
            plots.forEach(p => p.addEffect({ type: 'THUNDERSTORM', duration: 3 }));
        }, "Rain for 3 turns (3x2)", [[0, 0], [1, 0], [-1, 0], [0, 1], [1, 1], [-1, 1]]);

        const createHarvest = () => new Card('harvest', 'Harvest', 0, (ctx) => {
            let totalGold = 0;
            ctx.farm.plots.forEach(p => {
                if (p.isMature) {
                    totalGold += p.harvest();
                }
            });
            ctx.gold += totalGold;
            console.log(`Harvested ${totalGold} gold`);
        }, "Harvest All (Global)");

        for (let i = 0; i < 3; i++) this.deck.addCard(createWater());
        for (let i = 0; i < 3; i++) this.deck.addCard(createSeed());
        this.deck.addCard(createStorm());
        for (let i = 0; i < 2; i++) this.deck.addCard(createHarvest());
    }

    getPlotsInShape(centerId, shape) {
        const centerPlot = this.farm.getPlot(centerId);
        if (!centerPlot) return [];
        const centerRow = Math.floor(centerId / 3);
        const centerCol = centerId % 3;
        const targets = [];
        shape.forEach(([dx, dy]) => {
            const newRow = centerRow + dy;
            const newCol = centerCol + dx;
            if (newRow >= 0 && newRow < 3 && newCol >= 0 && newCol < 3) {
                const newId = newRow * 3 + newCol;
                targets.push(this.farm.getPlot(newId));
            }
        });
        return targets;
    }

    startTurn() {
        this.deck.draw(5);
        this.render();
    }

    endTurn() {
        console.log("Turn End");

        // Decrement Turn Limit
        this.turnLimit--;
        if (this.turnLimit <= 0) {
            alert("Game Over! You ran out of turns.");
            localStorage.removeItem('farmingDeckbuilderSave');
            location.reload();
            return;
        }

        // Advance Farm or Dungeon
        if (this.mode === 'FARM') {
            this.farm.advanceAll();
        } else {
            this.dungeon.enemyTurn();
        }

        // Cleanup
        this.deck.discardHand();
        this.saveGame();
        this.startTurn();
    }

    playCardFromHand(index, targetId) {
        const card = this.deck.playCard(index);
        if (card) {
            // Immediate Execution
            const result = card.effectFn(this, targetId);

            // Check for Enemy Kill (Bonus Turns)
            if (result === true) {
                this.turnLimit += 10;
                alert("Enemy Defeated! +10 Turns");
            }

            this.render();

            // Auto-End Turn if Hand Empty
            if (this.deck.hand.length === 0) {
                setTimeout(() => this.endTurn(), 500); // Small delay for visual clarity
            }
        }
    }

    render() {
        if (this.mode === 'FARM') {
            this.renderFarm();
        } else {
            this.renderDungeon();
        }
        this.renderCommon();
    }

    renderFarm() {
        this.ui.farmGrid.innerHTML = '';
        this.farm.plots.forEach(plot => {
            const el = document.createElement('div');
            el.className = 'plot';
            el.dataset.id = plot.id;
            el.ondragover = (e) => {
                e.preventDefault();
                el.classList.add('drag-over');
            };
            el.ondragleave = () => el.classList.remove('drag-over');
            el.ondrop = (e) => this.handleDrop(e, plot.id);

            if (plot.crop) {
                el.style.borderColor = plot.crop.color;
                el.innerHTML = `
                    <div style="color:${plot.crop.color}">${plot.crop.name}</div>
                    <div>💧 ${plot.waterLevel}</div>
                    <div>🌱 ${plot.growthProgress}/${plot.crop.turnsToGrow}</div>
                    ${plot.isMature ? '<div>✅ READY</div>' : ''}
                    ${(plot.effects && plot.effects.length > 0) ? '<div>⚡ STORM</div>' : ''}
                `;
            } else {
                el.innerHTML = '<div style="color:#555">Empty</div>';
            }
            this.ui.farmGrid.appendChild(el);
        });
    }

    handleDrop(e, plotId) {
        e.preventDefault();
        const cardIndex = e.dataTransfer.getData('text/plain');
        const card = this.deck.hand[cardIndex];

        if (card && card.targetShape) {
            // Pass targetId directly
            this.playCardFromHand(cardIndex, plotId);
        }
    }

    renderDungeon() {
        const enemy = this.dungeon.currentEnemy;
        if (enemy) {
            this.ui.enemyArea.innerHTML = `
                <div style="color: #ff5555; font-size: 1.2em;">${enemy.name}</div>
                <div>HP: ${enemy.currentHp}/${enemy.maxHp}</div>
                <div>Intent: ${enemy.nextMove ? enemy.nextMove.desc : 'Thinking...'}</div>
            `;
        } else {
            this.ui.enemyArea.innerHTML = "<div>Victory! Waiting for next enemy...</div>";
        }
        this.ui.playerArea.innerHTML = `Player HP: ${this.dungeon.playerHp}/${this.dungeon.maxPlayerHp}`;
    }

    renderCommon() {
        this.ui.hand.innerHTML = '';
        this.deck.hand.forEach((card, index) => {
            const el = document.createElement('div');
            el.className = 'card';
            el.draggable = true;
            el.innerHTML = `<div class="card-cost">${card.cost}</div><div>${card.name}</div>`;
            el.ondragstart = (e) => {
                e.dataTransfer.setData('text/plain', index);
            };
            el.onclick = () => {
                if (!card.targetShape) {
                    this.playCardFromHand(index);
                } else {
                    alert("Drag this card to a plot!");
                }
            };
            this.ui.hand.appendChild(el);
        });

        // Stats
        this.ui.drawCount.innerText = this.deck.drawPile.length;
        this.ui.discardCount.innerText = this.deck.discardPile.length;
        this.ui.gold.innerText = `Gold: ${this.gold}`;
        if (this.ui.turnDisplay) {
            this.ui.turnDisplay.innerText = `Turns: ${this.turnLimit}`;
        }
    }
}

window.game = new Game();
