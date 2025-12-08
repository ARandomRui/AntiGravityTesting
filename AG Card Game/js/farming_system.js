export const CROPS = {
    WHEAT: { name: 'Wheat', cost: 1, sellPrice: 5, waterReq: 1, turnsToGrow: 2, color: '#e6c300' },
    CORN: { name: 'Corn', cost: 2, sellPrice: 10, waterReq: 2, turnsToGrow: 3, color: '#ff9800' }
};

export class Plot {
    constructor(id) {
        this.id = id;
        this.crop = null;
        this.waterLevel = 0;
        this.growthProgress = 0;
        this.isMature = false;
        this.effects = []; // Active effects like 'THUNDERSTORM'
    }

    plant(cropType) {
        if (this.crop) return false;
        this.crop = { ...CROPS[cropType] };
        this.waterLevel = 0;
        this.growthProgress = 0;
        this.isMature = false;
        this.effects = [];
        return true;
    }

    water(amount = 1) {
        this.waterLevel += amount;
    }

    addEffect(effect) {
        this.effects.push(effect);
    }

    advanceTurn() {
        // Process Effects
        this.effects = this.effects.filter(effect => {
            if (effect.type === 'THUNDERSTORM') {
                this.water(1);
                effect.duration--;
            }
            return effect.duration > 0;
        });

        if (!this.crop) {
            // Weeds could grow here?
            return;
        }

        if (this.isMature) return;

        // Simple growth logic: Needs water to grow
        if (this.waterLevel >= 1) {
            this.growthProgress++;
            this.waterLevel--; // Consume water
        }

        if (this.growthProgress >= this.crop.turnsToGrow) {
            this.isMature = true;
        }
    }

    harvest() {
        if (!this.crop || !this.isMature) return 0;
        const value = this.crop.sellPrice;
        this.crop = null;
        this.waterLevel = 0;
        this.growthProgress = 0;
        this.isMature = false;
        return value;
    }
}

export class FarmManager {
    constructor(size = 9) {
        this.plots = [];
        for (let i = 0; i < size; i++) {
            this.plots.push(new Plot(i));
        }
    }

    getPlot(index) {
        return this.plots[index];
    }

    advanceAll() {
        this.plots.forEach(plot => plot.advanceTurn());
    }
}
