let myChart = null;

function formatNumber(num) {
    return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(num);
}

function convertMonthsToText(totalMonths) {
    if (totalMonths === Infinity || isNaN(totalMonths) || totalMonths <= 0) return "ніколи";
    if (totalMonths >= 12) {
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        let yearsText = years === 1 ? "рік" : (years >= 2 && years <= 4 ? "роки" : "років");
        return months > 0 ? `${years} ${yearsText} і ${months} міс.` : `${years} ${yearsText}`;
    }
    return `${totalMonths} міс.`;
}

function saveData() {
    const budgetData = {
        salary: document.getElementById('salary-num').value,
        savings: document.getElementById('savings-num').value,
        credit: document.getElementById('credit-num').value,
        installment: document.getElementById('installment-num').value,
        target: document.getElementById('target-num').value
    };
    localStorage.setItem('user_budget', JSON.stringify(budgetData));
}

function loadData() {
    const savedData = localStorage.getItem('user_budget');
    if (!savedData) return;

    const budgetData = JSON.parse(savedData);
    const fields = ['salary', 'savings', 'credit', 'installment', 'target'];
    
    fields.forEach(id => {
        const value = budgetData[id];
        if (value !== undefined) {
            document.getElementById(`${id}-num`).value = value;
            document.getElementById(`${id}-range`).value = value;
        }
    });
}

function syncInputs(id, triggerType) {
    const numInput = document.getElementById(`${id}-num`);
    const rangeInput = document.getElementById(`${id}-range`);

    if (triggerType === 'range') {
        numInput.value = rangeInput.value;
    } else if (triggerType === 'num') {
        let val = parseFloat(numInput.value) || 0;
        const min = parseFloat(rangeInput.min);
        const max = parseFloat(rangeInput.max);
        if (val < min) val = min;
        if (val > max) val = max;
        rangeInput.value = val;
    }

    saveData();
    calculateBudget();
}

function calculateBudget() {
    const salary = parseFloat(document.getElementById('salary-num').value) || 0;
    const savingsAmount = parseFloat(document.getElementById('savings-num').value) || 0; 
    const credit = parseFloat(document.getElementById('credit-num').value) || 0;
    const installment = parseFloat(document.getElementById('installment-num').value) || 0;
    const targetAmount = parseFloat(document.getElementById('target-num').value) || 0;

    const totalDebts = credit + installment;
    const freeMoneyMonth = salary - savingsAmount - totalDebts;
    const freeMoneyDay = freeMoneyMonth / 30;

    const resultBox = document.getElementById('result-box');
    const recBox = document.getElementById('recommendation-box');
    const chartBox = document.getElementById('chart-box');

    if (freeMoneyMonth < 0) {
        const maximumPossibleSavings = salary - totalDebts;

        resultBox.className = "card result-card danger-status";
        resultBox.innerHTML = `
            <h4>⚠️ Критичний дисбаланс!</h4>
            <p style="margin: 0;">Ви намагаєтеся відкласти більше грошей, ніж реально маєте вільного залишку після сплати кредитів.</p>
        `;

        recBox.className = "card result-card status-danger";
        if (maximumPossibleSavings <= 0) {
            recBox.innerHTML = `
                <h4>❌ Рекомендація аналітика</h4>
                <p style="margin:0;">Ваші обов'язкові борги (${formatNumber(totalDebts)} грн) перевищують або повністю з'їдають дохід. Наразі ви <strong>не можете відкладати кошти</strong>. Рекомендується закрити розстрочки.</p>
            `;
        } else {
            recBox.innerHTML = `
                <h4>💡 Рекомендація аналітика</h4>
                <p style="margin:0;">Базова рекомендація: зменшіть суму щомісячного вкладу. Ваш психологічний та фізичний максимум зараз становить <strong>${formatNumber(maximumPossibleSavings)} грн/міс</strong>.</p>
            `;
        }
        chartBox.style.display = "none";
        return;
    }

    resultBox.className = "card result-card success-status";
    resultBox.innerHTML = `
        <h4>📊 Ваш фінансовий звіт</h4>
        <div class="result-item">
            <span>💵 Ваш обраний вклад:</span>
            <strong>+ ${formatNumber(savingsAmount)} грн/міс</strong>
        </div>
        <div class="result-item">
            <span>💳 Обов'язкові борги:</span>
            <strong style="color: var(--danger);">- ${formatNumber(totalDebts)} грн</strong>
        </div>
        <div class="result-item total">
            <span>🛍️ Чисті гроші на життя (місяць):</span>
            <strong style="color: var(--success);">${formatNumber(freeMoneyMonth)} грн</strong>
        </div>
        <div class="result-item">
            <span>📅 Денний ліміт на витрати:</span>
            <strong>${formatNumber(freeMoneyDay)} грн / день</strong>
        </div>
    `;

    const monthsToGoal = savingsAmount > 0 ? Math.ceil(targetAmount / savingsAmount) : Infinity;

    if (savingsAmount === 0) {
        recBox.className = "card result-card status-warning";
        recBox.innerHTML = `
            <h4>🎯 3бір на ціль зупинено</h4>
            <p>Ви нічого не відкладаєте. Вашу ціль у ${formatNumber(targetAmount)} грн буде досягнуто <strong>ніколи</strong>.</p>
            <p style="margin: 10px 0 0 0; font-size: 0.9rem;"><strong>Рекомендовано:</strong> почніть інвестувати хоча б 10% від зарплати — <strong>${formatNumber(salary * 0.1)} грн/міс</strong>.</p>
        `;
    } else if (monthsToGoal > 36) {
        const fastRecommendedAmount = Math.ceil(targetAmount / 12);

        recBox.className = "card result-card status-warning";
        recBox.innerHTML = `
            <h4>🐢 Занадто повільний рух до цілі</h4>
            <p>Зі внеском у ${formatNumber(savingsAmount)} грн ви будете збирати на ціль аж <strong>${convertMonthsToText(monthsToGoal)}</strong>.</p>
            <p style="margin: 10px 0 0 0; font-size: 0.9rem;"><strong>Рекомендовано для вашої цілі:</strong> щоб купити це за 1 рік, оптимально вкладати по <strong>${formatNumber(fastRecommendedAmount)} грн/міс</strong>.</p>
        `;
    } else {
        recBox.className = "card result-card status-success";
        recBox.innerHTML = `
            <h4>✨ Чудовий фінансовий план!</h4>
            <p>Обрана сума у ${formatNumber(savingsAmount)} грн — безпечна для життя. Ціль у ${formatNumber(targetAmount)} грн буде у вас уже через <strong>${convertMonthsToText(monthsToGoal)}</strong>.</p>
            <p style="margin: 10px 0 0 0; font-size: 0.9rem;">Ви відкладаєте ${(savingsAmount / salary * 100).toFixed(0)}% від доходу, що вписується у світові стандарти фінансової грамотності.</p>
        `;
    }

    chartBox.style.display = "block";
    const ctx = document.getElementById('budgetChart').getContext('2d');

    if (myChart !== null) {
        myChart.data.datasets[0].data = [freeMoneyMonth, savingsAmount, credit, installment];
        myChart.update('none');
    } else {
        myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Вільні гроші на життя', 'Ваш вклад', 'Кредит', 'Розстрочка'],
                datasets: [{
                    data: [freeMoneyMonth, savingsAmount, credit, installment],
                    backgroundColor: ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, font: { family: 'Inter', size: 12 } }
                    }
                }
            }
        });
    }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker зареєстровано успішно!', reg.scope))
            .catch(err => console.log('Помилка реєстрації Service Worker:', err));
    });
}

loadData();
calculateBudget();