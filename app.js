const display = document.querySelector("#display");
const keypad = document.querySelector(".keypad");

let currentValue = "0";
let storedValue = null;
let pendingOperator = null;
let waitingForOperand = false;

const formatNumber = (value) => {
    if (!Number.isFinite(value)) {
        return "Error";
    }

    const rounded = Number.parseFloat(value.toPrecision(12));
    return String(rounded);
};

const render = () => {
    display.textContent = currentValue;
};

const clearSelection = () => {
    keypad.querySelectorAll(".key-operator").forEach((button) => {
        button.classList.remove("is-selected");
    });
};

const inputDigit = (digit) => {
    if (currentValue === "Error" || waitingForOperand) {
        currentValue = digit;
        waitingForOperand = false;
        return;
    }

    currentValue = currentValue === "0" ? digit : currentValue + digit;
};

const calculate = (left, right, operator) => {
    switch (operator) {
        case "+":
            return left + right;
        case "−":
            return left - right;
        case "×":
            return left * right;
        case "÷":
            return right === 0 ? NaN : left / right;
        default:
            return right;
    }
};

const chooseOperator = (operator, button) => {
    const inputValue = Number(currentValue);

    if (currentValue === "Error") {
        currentValue = "0";
        storedValue = null;
        pendingOperator = null;
    } else if (pendingOperator && !waitingForOperand) {
        const result = calculate(storedValue, inputValue, pendingOperator);
        currentValue = formatNumber(result);
        storedValue = result;
    } else {
        storedValue = inputValue;
    }

    pendingOperator = operator;
    waitingForOperand = true;
    clearSelection();
    if (button) {
        button.classList.add("is-selected");
    } else {
        const matchingButton = keypad.querySelector(`[data-operator="${operator}"]`);
        if (matchingButton) {
            matchingButton.classList.add("is-selected");
        }
    }
};

const performAction = (action) => {
    switch (action) {
        case "clear":
            currentValue = "0";
            storedValue = null;
            pendingOperator = null;
            waitingForOperand = false;
            clearSelection();
            break;
        case "decimal":
            if (currentValue === "Error" || waitingForOperand) {
                currentValue = "0.";
                waitingForOperand = false;
            } else if (!currentValue.includes(".")) {
                currentValue += ".";
            }
            break;
        case "sign":
            if (currentValue !== "Error" && Number(currentValue) !== 0) {
                currentValue = currentValue.startsWith("-")
                    ? currentValue.slice(1)
                    : `-${currentValue}`;
            }
            break;
        case "percent":
            if (currentValue !== "Error") {
                currentValue = formatNumber(Number(currentValue) / 100);
            }
            break;
        case "equals":
            if (pendingOperator && storedValue !== null && currentValue !== "Error") {
                currentValue = formatNumber(
                    calculate(storedValue, Number(currentValue), pendingOperator)
                );
                storedValue = null;
                pendingOperator = null;
                waitingForOperand = true;
                clearSelection();
            }
            break;
    }

    render();
};

keypad.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) {
        return;
    }

    if (button.dataset.digit !== undefined) {
        inputDigit(button.dataset.digit);
        render();
        return;
    }

    if (button.dataset.operator) {
        chooseOperator(button.dataset.operator, button);
        render();
        return;
    }

    performAction(button.dataset.action);
});

document.addEventListener("keydown", (event) => {
    if (/^\d$/.test(event.key)) {
        inputDigit(event.key);
        render();
    } else if (event.key === ".") {
        performAction("decimal");
    } else if (event.key === "Escape" || event.key === "Delete") {
        performAction("clear");
    } else if (event.key === "Backspace") {
        if (currentValue !== "Error" && !waitingForOperand) {
            currentValue = currentValue.length > 1
                ? currentValue.slice(0, -1)
                : "0";
            if (currentValue === "-") {
                currentValue = "0";
            }
            render();
        }
    } else if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        performAction("equals");
    } else {
        const operators = {
            "+": "+",
            "-": "−",
            "*": "×",
            "/": "÷",
        };
        if (operators[event.key]) {
            event.preventDefault();
            chooseOperator(operators[event.key]);
            render();
        }
    }
});