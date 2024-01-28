import React from 'react';

function RuleSelector({ onRuleSelect }) {
    return (
        <select onChange={(e) => onRuleSelect(e.target.value)}>
            <option value="rightConjunction">Right Conjunction</option>
            <option value="leftConjunction">Left Conjunction</option>
            {/* Add other options for rules */}
        </select>
        );
}

export default RuleSelector;
