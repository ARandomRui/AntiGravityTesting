export class Card {
    constructor(id, name, cost, effectFn, description, targetShape = null) {
        this.id = id;
        this.name = name;
        this.cost = cost;
        this.effectFn = effectFn; // Function to execute
        this.description = description;
        this.targetShape = targetShape; // Array of [x, y] offsets, e.g. [[0,0], [1,0]]
    }
}

export class Deck {
    constructor() {
        this.drawPile = [];
        this.hand = [];
        this.discardPile = [];
    }

    addCard(card) {
        this.drawPile.push(card);
    }

    shuffle() {
        for (let i = this.drawPile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]];
        }
    }

    draw(amount) {
        for (let i = 0; i < amount; i++) {
            if (this.drawPile.length === 0) {
                this.recycleDiscard();
            }
            if (this.drawPile.length > 0) {
                this.hand.push(this.drawPile.pop());
            }
        }
    }

    recycleDiscard() {
        this.drawPile = [...this.discardPile];
        this.discardPile = [];
        this.shuffle();
    }

    playCard(cardIndex) {
        if (cardIndex < 0 || cardIndex >= this.hand.length) return null;
        const card = this.hand.splice(cardIndex, 1)[0];
        this.discardPile.push(card);
        return card;
    }

    discardHand() {
        this.discardPile.push(...this.hand);
        this.hand = [];
    }
}

export class ActionQueue {
    constructor() {
        this.queue = [];
    }

    add(card) {
        this.queue.push(card);
    }

    clear() {
        this.queue = [];
    }

    async executeAll(context) {
        console.log("Executing Queue:", this.queue.map(c => c.name));
        for (const card of this.queue) {
            await this.executeCard(card, context);
            // Optional: Add delay for visualization
            await new Promise(r => setTimeout(r, 500));
        }
        this.clear();
    }

    async executeCard(card, context) {
        console.log(`Playing ${card.name}`);
        if (card.effectFn) {
            card.effectFn(context);
        }
    }
}
