const { useState, useEffect, useRef } = React;

function SmartBudgetApp() {
    const [inputs, setInputs] = useState(() => {
        const saved = localStorage.getItem('react_user_budget');
        return saved ? JSON.parse(saved) : {
            salary: 30000,
            savings: 5000,
            credit: 0,
            installment: 0,
            target: 50000
        };
    });

    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        localStorage.setItem('react_user_budget', JSON.stringify(inputs));
    }, [inputs]);

    const totalDebts = inputs.credit + inputs.installment;
    const freeMoneyMonth = inputs.salary - inputs.savings - totalDebts;
    const freeMoneyDay = freeMoneyMonth / 30;
    const monthsToGoal = inputs.savings > 0 ? Math.ceil(inputs.target / inputs.savings) : Infinity;

    useEffect(() => {
        if (freeMoneyMonth < 0) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
            return;
        }

        const ctx = chartRef.current.getContext('2d');
        
        if (chartInstance.current) {
            chartInstance.current.data.datasets[0].data = [freeMoneyMonth, inputs.savings, inputs.credit, inputs.installment];
            chartInstance.current.update('none');
        } else {
            chartInstance.current = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Вільні гроші на життя', 'Ваш вклад', 'Кредит', 'Розстрочка'],
                    datasets: [{
                        data: [freeMoneyMonth, inputs.savings, inputs.credit, inputs.installment],
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
    }, [freeMoneyMonth, inputs]);

    const format = (num) => new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(num);

    const convertMonthsToText = (totalMonths) => {
        if (totalMonths === Infinity || isNaN(totalMonths) || totalMonths <= 0) return "ніколи";
        if (totalMonths >= 12) {
            const years = Math.floor(totalMonths / 12);
            const months = totalMonths % 12;
            let yearsText = years === 1 ? "року" : (years >= 2 && years <= 4 ? "роки" : "років");
            return months > 0 ? `${years} ${yearsText} і ${months} міс.` : `${years} ${yearsText}`;
        }
        return `${totalMonths} міс.`;
    };

    const handleInputChange = (field, val, max, min = 0) => {
        let numericValue = parseFloat(val) || 0;
        if (numericValue < min) numericValue = min;
        if (max && numericValue > max) numericValue = max;
        
        setInputs(prev => ({ ...prev, [field]: numericValue }));
    };

    return (
        <div className="dashboard">
            <div className="header">
                <h2>SmartBudget ⚛️ React</h2>
                <p>Компонентний фінансовий аналіз</p>
            </div>

            <div className="main-content">
                <div className="inputs-column">
                    <div className="card">
                        <h3>Вхідні дані</h3>
                        
                        <div className="form-group">
                            <div className="label-row">
                                <label>Ваша зарплата (грн/міс):</label>
                                <input type="number" value={inputs.salary} onChange={(e) => handleInputChange('salary', e.target.value, 150000)} />
                            </div>
                            <input type="range" min="5000" max="150000" step="500" value={inputs.salary} onChange={(e) => handleInputChange('salary', e.target.value)} />
                        </div>

                        <div className="form-group">
                            <div className="label-row">
                                <label>Скільки хочете відкладати (грн/міс):</label>
                                <input type="number" value={inputs.savings} onChange={(e) => handleInputChange('savings', e.target.value, 100000)} />
                            </div>
                            <input type="range" min="0" max="100000" step="200" value={inputs.savings} onChange={(e) => handleInputChange('savings', e.target.value)} />
                        </div>

                        <div className="form-group">
                            <div className="label-row">
                                <label>Щомісячний кредит (грн):</label>
                                <input type="number" value={inputs.credit} onChange={(e) => handleInputChange('credit', e.target.value, 30000)} />
                            </div>
                            <input type="range" min="0" max="30000" step="100" value={inputs.credit} onChange={(e) => handleInputChange('credit', e.target.value)} />
                        </div>

                        <div className="form-group">
                            <div className="label-row">
                                <label>Платіж за розстрочку (грн):</label>
                                <input type="number" value={inputs.installment} onChange={(e) => handleInputChange('installment', e.target.value, 20000)} />
                            </div>
                            <input type="range" min="0" max="20000" step="100" value={inputs.installment} onChange={(e) => handleInputChange('installment', e.target.value)} />
                        </div>
                    </div>

                    <div className="card">
                        <h3>🎯 Велика фінансова ціль</h3>
                        <div className="form-group">
                            <div className="label-row">
                                <label>Вартість вашої мети (грн):</label>
                                <input type="number" id="target-num" value={inputs.target} onChange={(e) => handleInputChange('target', e.target.value, 1000000)} />
                            </div>
                            <input type="range" id="target-range" min="0" max="1000000" step="1000" value={inputs.target} onChange={(e) => handleInputChange('target', e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="results-column">
                    <div className="card" style={{ display: freeMoneyMonth >= 0 ? 'block' : 'none' }}>
                        <h3>Розподіл ваших коштів</h3>
                        <div className="chart-wrapper">
                            <canvas ref={chartRef}></canvas>
                        </div>
                    </div>

                    {freeMoneyMonth < 0 ? (
                        <React.Fragment>
                            <div className="card status-danger">
                                <h4>⚠️ Критичний дисбаланс!</h4>
                                <p>Ви намагаєтеся відкласти більше грошей, ніж реально маєте вільного залишку після сплати кредитів.</p>
                            </div>
                            <div className="card status-danger">
                                <h4>❌ Рекомендація аналітика</h4>
                                <p>{(inputs.salary - totalDebts) <= 0 
                                    ? `Ваші обов'язкові борги (${format(totalDebts)} грн) з'їдають дохід. Наразі ви не можете відкладати кошти.`
                                    : `Зменшіть суму щомісячного вкладу. Ваш максимум зараз становить ${format(inputs.salary - totalDebts)} грн/міс.`
                                }</p>
                            </div>
                        </React.Fragment>
                    ) : (
                        <React.Fragment>
                            <div className="card status-success">
                                <h4>📊 Ваш фінансовий звіт</h4>
                                <div className="result-item"><span>💵 Ваш обраний вклад:</span><strong>+ {format(inputs.savings)} грн/міс</strong></div>
                                <div className="result-item"><span>💳 Обов'язкові борги:</span><strong style={{color: 'var(--danger)'}}>- {format(totalDebts)} грн</strong></div>
                                <div className="result-item total"><span>🛍️ Чисті гроші на життя:</span><strong style={{color: 'var(--success)'}}>{format(freeMoneyMonth)} грн</strong></div>
                                <div className="result-item"><span>📅 Денний ліміт:</span><strong>{format(freeMoneyDay)} грн / day</strong></div>
                            </div>

                            {inputs.savings === 0 ? (
                                <div className="card status-warning">
                                    <h4>🎯 Збір на ціль зупинено</h4>
                                    <p>Ви нічого не відкладаєте. Вашу ціль у {format(inputs.target)} грн буде досягнуто <strong>ніколи</strong>.</p>
                                </div>
                            ) : monthsToGoal > 36 ? (
                                <div className="card status-warning">
                                    <h4>🐢 Занадто повільний рух</h4>
                                    <p>Зі внеском у {format(inputs.savings)} грн ви будете збирати на ціль <strong>{convertMonthsToText(monthsToGoal)}</strong>.</p>
                                    <p style={{marginTop: '10px', fontSize: '0.9rem'}}>Рекомендовано збільшити внесок до <strong>{format(Math.ceil(inputs.target / 12))} грн/міс</strong>, щоб впоратись за 1 рік.</p>
                                </div>
                            ) : (
                                <div className="card status-success">
                                    <h4>✨ Чудовий фінансовий план!</h4>
                                    <p>Ціль у {format(inputs.target)} грн буде у вас уже через <strong>{convertMonthsToText(monthsToGoal)}</strong>.</p>
                                </div>
                            )}
                        </React.Fragment>
                    )}
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<SmartBudgetApp />);