import { Card } from './card_system.js';

export class Shop {
    constructor(game) {
        this.game = game;
        this.items = [];
    }

    generateItems() {
        this.items = [];
        // Add some random combat cards
        const combatCards = [
            { id: 'strike', name: 'Strike', cost: 1, desc: 'Deal 6 damage', price: 10, effect: (ctx) => ctx.dungeon.playerAttack(6) },
            { id: 'defend', name: 'Defend', cost: 1, desc: 'Gain 5 Block (Not Impl)', price: 10, effect: (ctx) => console.log("Block not impl") },
            { id: 'fireball', name: 'Fireball', cost: 2, desc: 'Deal 10 damage', price: 25, effect: (ctx) => ctx.dungeon.playerAttack(10) },
            { id: 'heal', name: 'Heal', cost: 1, desc: 'Heal 5 HP', price: 20, effect: (ctx) => { ctx.dungeon.playerHp = Math.min(ctx.dungeon.maxPlayerHp, ctx.dungeon.playerHp + 5); } }
        ];

        for (let i = 0; i < 3; i++) {
            const template = combatCards[Math.floor(Math.random() * combatCards.length)];
            this.items.push({
                ...template,
                uniqueId: Math.random() // For shop logic
            });
        }
    }

    buyItem(index) {
        const item = this.items[index];
        if (!item) return false;

        if (this.game.gold >= item.price) {
            this.game.gold -= item.price;
            const newCard = new Card(item.id, item.name, item.cost, item.effect, item.desc);
            this.game.deck.addCard(newCard); // Add to deck (discard pile usually)
            this.items.splice(index, 1);
            return true;
        }
        return false;
    }
}
