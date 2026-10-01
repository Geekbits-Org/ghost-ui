// Build-time mechanics shared by registry components. No custom Ghost helper is required.
function applyStyleSlots(component, slots, { portableMarkup = false } = {}) {
    const partial = component.files.find(file => file.type === 'partial');
    if (!partial) throw new Error(`${component.name} is missing its partial`);
    let content = partial.content;
    if (portableMarkup) {
        // Visual defaults belong in component CSS, not in the utilities layer.
        // Otherwise e.g. a default p-8 may outrank the caller's p-4 regardless of class order.
        const hooks = new Set(['group', 'button-text', 'message-success', 'message-error']);
        content = content.replace(/class="([^"]*)"/g, (_, classes) => {
            const kept = classes.split(/\s+/).filter(value => /^gh(?:cn)?-/.test(value) || hooks.has(value));
            return kept.length ? `class="${kept.join(' ')}"` : '';
        });
    }
    for (const [parameter, classes] of Object.entries(slots)) {
        if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(parameter)) throw new Error(`Invalid styling parameter ${parameter}`);
        for (const identity of classes) {
            if (!/^[a-z][a-z0-9_-]*$/.test(identity)) throw new Error(`Invalid component class ${identity}`);
            // Identity classes are authored first. Insert before static or conditional modifiers.
            const pattern = new RegExp(`class="${identity}(?=[\\s"{])`, 'g');
            let matches = 0;
            content = content.replace(pattern, prefix => {
                matches++;
                return `${prefix}{{#if ghostcnStyles.${parameter}}} {{ghostcnStyles.${parameter}}}{{/if}}`;
            });
            if (!matches) throw new Error(`${component.name}: ${parameter} has no target ${identity}`);
        }
    }
    // Capture the call context lexically before get/foreach/primary_author changes `this`.
    // Each invocation gets its own block alias; styles never leak from tier/post data or siblings.
    partial.content = `{{!-- Styling parameters: ${Object.keys(slots).join(', ')} --}}\n{{#with this as |ghostcnStyles|}}\n${content}\n{{/with}}`;
    component.styleSlots = Object.fromEntries(Object.entries(slots).map(([parameter, classes]) => [parameter, classes.map(value => `.${value}`)]));
    return component;
}

module.exports = { applyStyleSlots };
