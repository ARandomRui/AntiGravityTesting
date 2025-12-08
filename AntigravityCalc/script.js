document.addEventListener('DOMContentLoaded', () => {
    // State
    const state = {
        mode: 'calculator', // 'calculator' or 'converter'
        calc: {
            current: '0',
            previous: '',
            operator: null,
            justCalculated: false
        },
        convert: {
            type: 'distance', // 'distance' or 'temperature'
            value: 0,
            isReversed: false // Default: Miles->Km (false), Km->Miles (true)
        }
    };

    // DOM Elements
    const views = {
        calculator: document.getElementById('calculator'),
        converter: document.getElementById('converter')
    };
    const navBtns = document.querySelectorAll('.nav-btn');

    // Calculator Elements
    const calcDisplay = document.getElementById('calc-display');
    const calcHistory = document.getElementById('calc-history');
    const keypad = document.querySelector('.keypad');

    // Converter Elements
    const convertInput = document.getElementById('convert-input');
    const convertType = document.getElementById('convert-type');
    const swapBtn = document.getElementById('swap-units');
    const fromLabel = document.getElementById('from-unit-label');
    const toLabel = document.getElementById('to-unit-label');
    const convertResult = document.getElementById('convert-result');

    // Unit Definitions
    const units = {
        distance: {
            standard: 'Miles',
            metric: 'Kilometers',
            toMetric: (val) => val * 1.60934,
            toStandard: (val) => val / 1.60934
        },
        temperature: {
            standard: 'Fahrenheit',
            metric: 'Celsius',
            toMetric: (val) => (val - 32) * (5 / 9),
            toStandard: (val) => (val * (9 / 5)) + 32
        }
    };

    // --- Navigation Logic ---
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            if (state.mode === target) return;

            // Update state
            state.mode = target;

            // Update UI tabs
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Switch views
            Object.values(views).forEach(v => v.classList.remove('active'));
            views[target].classList.add('active');
        });
    });

    // --- Calculator Logic ---
    const updateCalcDisplay = () => {
        calcDisplay.textContent = state.calc.current;
        if (state.calc.operator) {
            calcHistory.textContent = `${state.calc.previous} ${state.calc.operator}`;
        } else {
            calcHistory.textContent = '';
        }
    };

    const handleNumber = (num) => {
        if (state.calc.justCalculated) {
            state.calc.current = num;
            state.calc.justCalculated = false;
        } else {
            if (state.calc.current === '0') {
                state.calc.current = num;
            } else {
                state.calc.current += num;
            }
        }
        updateCalcDisplay();
    };

    const handleDecimal = () => {
        if (state.calc.justCalculated) {
            state.calc.current = '0.';
            state.calc.justCalculated = false;
        } else if (!state.calc.current.includes('.')) {
            state.calc.current += '.';
        }
        updateCalcDisplay();
    };

    const handleOperator = (op) => {
        if (state.calc.current === '') return;

        if (state.calc.previous !== '') {
            calculate();
        }

        state.calc.operator = op;
        state.calc.previous = state.calc.current;
        state.calc.current = '0';
        updateCalcDisplay();
    };

    const calculate = () => {
        let result;
        const prev = parseFloat(state.calc.previous);
        const current = parseFloat(state.calc.current);

        if (isNaN(prev) || isNaN(current)) return;

        switch (state.calc.operator) {
            case '+': result = prev + current; break;
            case '-': result = prev - current; break;
            case '*': result = prev * current; break;
            case '/':
                if (current === 0) {
                    alert("Cannot divide by zero! 🌌");
                    clearCalc();
                    return;
                }
                result = prev / current;
                break;
            default: return;
        }

        // Format result to avoid long decimals
        result = Math.round(result * 1000000) / 1000000;

        state.calc.current = result.toString();
        state.calc.operator = null;
        state.calc.previous = '';
        state.calc.justCalculated = true;
        updateCalcDisplay();
    };

    const clearCalc = () => {
        state.calc.current = '0';
        state.calc.previous = '';
        state.calc.operator = null;
        updateCalcDisplay();
    };

    const deleteChar = () => {
        if (state.calc.justCalculated) {
            clearCalc();
            return;
        }

        if (state.calc.current.length === 1) {
            state.calc.current = '0';
        } else {
            state.calc.current = state.calc.current.slice(0, -1);
        }
        updateCalcDisplay();
    };

    const handlePercent = () => {
        const val = parseFloat(state.calc.current);
        state.calc.current = (val / 100).toString();
        updateCalcDisplay();
    };

    keypad.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const action = btn.dataset.action;
        const value = btn.dataset.value;

        if (value && !action) {
            if (value === '.') handleDecimal();
            else handleNumber(value);
        }
        else if (action === 'operator') {
            handleOperator(value);
        }
        else if (action === 'calculate') {
            calculate();
        }
        else if (action === 'clear') {
            clearCalc();
        }
        else if (action === 'delete') {
            deleteChar();
        }
        else if (action === 'percent') {
            handlePercent();
        }
    });

    // --- Converter Logic ---
    const updateConverterLabels = () => {
        const type = state.convert.type;
        const u = units[type];

        if (state.convert.isReversed) {
            fromLabel.textContent = u.metric;
            toLabel.textContent = u.standard;
        } else {
            fromLabel.textContent = u.standard;
            toLabel.textContent = u.metric;
        }
        performConversion();
    };

    const performConversion = () => {
        const val = parseFloat(convertInput.value);
        if (isNaN(val)) {
            convertResult.textContent = '---';
            return;
        }

        const type = state.convert.type;
        const u = units[type];
        let res;

        if (state.convert.isReversed) {
            // Metric -> Standard
            res = u.toStandard(val);
        } else {
            // Standard -> Metric
            res = u.toMetric(val);
        }

        // Format Result
        convertResult.textContent = Math.round(res * 1000) / 1000;
    };

    convertType.addEventListener('change', (e) => {
        state.convert.type = e.target.value;
        updateConverterLabels();
    });

    swapBtn.addEventListener('click', () => {
        state.convert.isReversed = !state.convert.isReversed;
        updateConverterLabels();
    });

    convertInput.addEventListener('input', performConversion);

    // Initial Setup
    updateConverterLabels();
});
