export class Enemy {
    constructor(name, hp, damage, intentFn) {
        this.name = name;
        this.maxHp = hp;
        this.currentHp = hp;
        this.damage = damage;
        this.intentFn = intentFn; // Function to determine next move
        this.nextMove = null;
    }

    planMove() {
        this.nextMove = this.intentFn(this);
    }

    takeDamage(amount) {
        this.currentHp -= amount;
        if (this.currentHp < 0) this.currentHp = 0;
        return this.currentHp === 0; // Returns true if dead
    }
}

export class BattleState {
    constructor() {
        this.playerHp = 100;
        this.maxPlayerHp = 100;
        this.currentEnemy = null;
        this.log = [];
    }

    spawnEnemy() {
        // Simple enemy for now
        this.currentEnemy = new Enemy('Slime', 20, 5, (enemy) => {
            return { type: 'ATTACK', value: 5, desc: 'Attacks for 5' };
        });
        this.currentEnemy.planMove();
    }

    playerAttack(amount) {
        if (!this.currentEnemy) return false;
        const isDead = this.currentEnemy.takeDamage(amount);
        this.log.push(`Player dealt ${amount} damage to ${this.currentEnemy.name}`);
        if (isDead) {
            this.log.push(`${this.currentEnemy.name} defeated!`);
            this.currentEnemy = null;
            // Reward?
        }
        return isDead;
    }

    enemyTurn() {
        if (!this.currentEnemy) {
            this.spawnEnemy();
            return;
        }

        const move = this.currentEnemy.nextMove;
        if (move.type === 'ATTACK') {
            this.playerHp -= move.value;
            this.log.push(`${this.currentEnemy.name} dealt ${move.value} damage!`);
        }

        this.currentEnemy.planMove();
    }
}
