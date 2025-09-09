/**
 * Direct WYSIWYG Integration for Afterwriting
 * More aggressive approach to integrate with the existing editor
 */

console.log('WYSIWYG Integration Loading...');

// Wait for the page to fully load and then inject
function initWYSIWYG() {
    console.log('Initializing WYSIWYG...');
    
    // Add the toggle button to the page
    function addToggleButton() {
        // Create the button
        const toggleBtn = document.createElement('button');
        toggleBtn.innerHTML = '📝 WYSIWYG Mode';
        toggleBtn.id = 'wysiwygToggle';
        toggleBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10000;
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        
        toggleBtn.onclick = function() {
            console.log('Toggle clicked');
            toggleWYSIWYGMode();
        };
        
        document.body.appendChild(toggleBtn);
        console.log('Toggle button added');
    }
    
    // Add styles
    function addStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            .wysiwyg-container {
                border: 2px solid #3498db;
                border-radius: 8px;
                margin: 10px;
                background: white;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            
            .wysiwyg-toolbar {
                background: #2c3e50;
                color: white;
                padding: 15px;
                border-radius: 8px 8px 0 0;
                display: flex;
                gap: 10px;
                align-items: center;
                flex-wrap: wrap;
            }
            
            .wysiwyg-toolbar select,
            .wysiwyg-toolbar button {
                background: #3498db;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .wysiwyg-toolbar select:hover,
            .wysiwyg-toolbar button:hover {
                background: #2980b9;
            }
            
            .wysiwyg-editor {
                font-family: 'Courier New', monospace;
                font-size: 12pt;
                line-height: 1.4;
                padding: 30px;
                min-height: 500px;
                outline: none;
                background: white;
                max-width: 8.5in;
                margin: 0 auto;
            }
            
            .wysiwyg-scene-heading {
                text-transform: uppercase;
                font-weight: bold;
                margin: 24pt 0 12pt 0;
                color: #2c3e50;
                border-left: 4px solid #3498db;
                padding-left: 12px;
                background: rgba(52, 152, 219, 0.05);
            }
            
            .wysiwyg-character {
                text-transform: uppercase;
                font-weight: bold;
                margin: 24pt 0 0 2.2in;
                width: 2in;
                color: #27ae60;
                background: rgba(39, 174, 96, 0.05);
                padding: 4px 8px;
                border-radius: 4px;
            }
            
            .wysiwyg-dialogue {
                margin: 6pt 0 12pt 1.5in;
                width: 3.5in;
                color: #34495e;
                background: rgba(52, 73, 94, 0.05);
                padding: 6px 10px;
                border-radius: 4px;
            }
            
            .wysiwyg-parenthetical {
                margin: 6pt 0 6pt 2in;
                width: 2in;
                font-style: italic;
                color: #7f8c8d;
                background: rgba(127, 140, 141, 0.05);
                padding: 4px 8px;
                border-radius: 4px;
            }
            
            .wysiwyg-action {
                margin: 12pt 0;
                width: 6in;
                color: #2c3e50;
                padding: 6px 0;
            }
            
            .wysiwyg-transition {
                text-transform: uppercase;
                font-weight: bold;
                margin: 24pt 0 24pt 4in;
                text-align: right;
                width: 2in;
                color: #e74c3c;
                background: rgba(231, 76, 60, 0.05);
                padding: 4px 8px;
                border-radius: 4px;
            }
            
            .wysiwyg-editor div:hover {
                background: rgba(52, 152, 219, 0.1) !important;
                border-radius: 4px;
            }
            
            .wysiwyg-editor div:focus {
                background: rgba(52, 152, 219, 0.15) !important;
                border: 2px dashed #3498db;
                border-radius: 4px;
                outline: none;
            }
            
            .wysiwyg-active #wysiwygToggle {
                background: #e74c3c !important;
            }
        `;
        document.head.appendChild(style);
        console.log('Styles added');
    }
    
    let isWYSIWYGMode = false;
    let originalEditor = null;
    let wysiwygContainer = null;
    
    function findEditor() {
        // Try multiple selectors to find the editor
        const selectors = [
            'textarea',
            '.editor',
            '#editor',
            '[contenteditable="true"]',
            'textarea[placeholder*="fountain"]',
            'textarea[placeholder*="screenplay"]',
            '.CodeMirror textarea',
            '.ace_text-input'
        ];
        
        for (let selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                console.log('Found editor with selector:', selector);
                return element;
            }
        }
        
        // If no specific editor found, look for any textarea
        const textareas = document.querySelectorAll('textarea');
        if (textareas.length > 0) {
            console.log('Found textarea:', textareas[0]);
            return textareas[0];
        }
        
        console.log('No editor found');
        return null;
    }
    
    function toggleWYSIWYGMode() {
        if (isWYSIWYGMode) {
            switchToPlainText();
        } else {
            switchToWYSIWYG();
        }
    }
    
    function switchToWYSIWYG() {
        console.log('Switching to WYSIWYG...');
        
        originalEditor = findEditor();
        if (!originalEditor) {
            alert('Could not find the editor. Please make sure the page is fully loaded.');
            return;
        }
        
        // Hide original editor
        originalEditor.style.display = 'none';
        
        // Create WYSIWYG container
        wysiwygContainer = document.createElement('div');
        wysiwygContainer.className = 'wysiwyg-container';
        
        // Create toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'wysiwyg-toolbar';
        toolbar.innerHTML = `
            <select id="elementType">
                <option value="action">Action</option>
                <option value="scene-heading">Scene Heading</option>
                <option value="character">Character</option>
                <option value="dialogue">Dialogue</option>
                <option value="parenthetical">Parenthetical</option>
                <option value="transition">Transition</option>
            </select>
            <button onclick="insertElement('scene-heading')">+ Scene</button>
            <button onclick="insertElement('character')">+ Character</button>
            <button onclick="insertElement('dialogue')">+ Dialogue</button>
            <button onclick="insertElement('action')">+ Action</button>
            <button onclick="formatSelection('bold')"><strong>B</strong></button>
            <button onclick="formatSelection('italic')"><em>I</em></button>
        `;
        
        // Create editor
        const editor = document.createElement('div');
        editor.className = 'wysiwyg-editor';
        editor.contentEditable = true;
        editor.id = 'wysiwygEditor';
        
        // Convert existing content
        const fountainText = originalEditor.value || 'Start writing your screenplay...';
        editor.innerHTML = convertFountainToHTML(fountainText);
        
        // Setup events
        editor.addEventListener('keydown', handleKeyDown);
        editor.addEventListener('input', handleInput);
        editor.addEventListener('click', handleClick);
        
        wysiwygContainer.appendChild(toolbar);
        wysiwygContainer.appendChild(editor);
        
        // Insert after original editor
        originalEditor.parentNode.insertBefore(wysiwygContainer, originalEditor.nextSibling);
        
        isWYSIWYGMode = true;
        document.body.classList.add('wysiwyg-active');
        document.getElementById('wysiwygToggle').innerHTML = '📄 Plain Text Mode';
        
        console.log('WYSIWYG mode activated');
    }
    
    function switchToPlainText() {
        console.log('Switching to plain text...');
        
        if (wysiwygContainer) {
            const editor = document.getElementById('wysiwygEditor');
            if (editor && originalEditor) {
                originalEditor.value = convertHTMLToFountain(editor);
            }
            
            wysiwygContainer.remove();
            wysiwygContainer = null;
        }
        
        if (originalEditor) {
            originalEditor.style.display = '';
        }
        
        isWYSIWYGMode = false;
        document.body.classList.remove('wysiwyg-active');
        document.getElementById('wysiwygToggle').innerHTML = '📝 WYSIWYG Mode';
        
        console.log('Plain text mode activated');
    }
    
    function convertFountainToHTML(fountainText) {
        const lines = fountainText.split('\\n');
        let html = '';
        
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            
            let elementType = 'action';
            let elementClass = 'wysiwyg-action';
            
            // Detect element types
            if (/^(INT\\.|EXT\\.|EST\\.)/i.test(line)) {
                elementType = 'scene-heading';
                elementClass = 'wysiwyg-scene-heading';
            } else if (/^[A-Z\\s]+$/.test(line) && line.length < 40 && line.length > 1) {
                elementType = 'character';
                elementClass = 'wysiwyg-character';
            } else if (/^\\(.+\\)$/.test(line)) {
                elementType = 'parenthetical';
                elementClass = 'wysiwyg-parenthetical';
            } else if (/^(FADE IN:|FADE OUT:|CUT TO:|DISSOLVE TO:)/i.test(line)) {
                elementType = 'transition';
                elementClass = 'wysiwyg-transition';
            }
            
            html += `<div class="${elementClass}" contenteditable="true" data-type="${elementType}">${line}</div>`;
        }
        
        return html || '<div class="wysiwyg-action" contenteditable="true" data-type="action">Start writing your screenplay...</div>';
    }
    
    function convertHTMLToFountain(editor) {
        const elements = editor.querySelectorAll('div');
        let fountainText = '';
        
        elements.forEach(el => {
            const type = el.getAttribute('data-type') || 'action';
            const text = el.textContent.trim();
            if (!text) return;
            
            switch(type) {
                case 'scene-heading':
                    fountainText += text.toUpperCase() + '\\n\\n';
                    break;
                case 'character':
                    fountainText += text.toUpperCase() + '\\n';
                    break;
                case 'dialogue':
                    fountainText += text + '\\n';
                    break;
                case 'parenthetical':
                    fountainText += text + '\\n';
                    break;
                case 'action':
                    fountainText += text + '\\n\\n';
                    break;
                case 'transition':
                    fountainText += text.toUpperCase() + '\\n\\n';
                    break;
            }
        });
        
        return fountainText;
    }
    
    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const currentElement = getCurrentElement();
            const currentType = currentElement ? currentElement.getAttribute('data-type') : 'action';
            
            let nextType = 'action';
            switch(currentType) {
                case 'scene-heading': nextType = 'action'; break;
                case 'character': nextType = 'dialogue'; break;
                case 'dialogue': nextType = 'character'; break;
                case 'parenthetical': nextType = 'dialogue'; break;
                case 'transition': nextType = 'scene-heading'; break;
            }
            
            createNewElement(nextType);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            cycleElementType();
        }
    }
    
    function handleInput(e) {
        const currentElement = getCurrentElement();
        if (currentElement) {
            autoDetectType(currentElement);
        }
        syncToOriginal();
    }
    
    function handleClick(e) {
        const element = e.target.closest('[data-type]');
        if (element) {
            const type = element.getAttribute('data-type');
            document.getElementById('elementType').value = type;
        }
    }
    
    function getCurrentElement() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return null;
        
        let element = selection.getRangeAt(0).commonAncestorContainer;
        if (element.nodeType === Node.TEXT_NODE) {
            element = element.parentElement;
        }
        
        return element.closest('[data-type]');
    }
    
    function createNewElement(type) {
        const newElement = document.createElement('div');
        newElement.className = `wysiwyg-${type}`;
        newElement.setAttribute('data-type', type);
        newElement.contentEditable = true;
        newElement.textContent = getPlaceholderText(type);
        
        const currentElement = getCurrentElement();
        if (currentElement) {
            currentElement.parentNode.insertBefore(newElement, currentElement.nextSibling);
        } else {
            document.getElementById('wysiwygEditor').appendChild(newElement);
        }
        
        // Focus new element
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(newElement);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        
        document.getElementById('elementType').value = type;
    }
    
    function getPlaceholderText(type) {
        const placeholders = {
            'scene-heading': 'INT. LOCATION - DAY',
            'character': 'CHARACTER NAME',
            'dialogue': 'Character dialogue...',
            'action': 'Action description...',
            'parenthetical': '(parenthetical)',
            'transition': 'CUT TO:'
        };
        return placeholders[type] || '';
    }
    
    function autoDetectType(element) {
        const text = element.textContent.trim();
        let newType = null;
        
        if (/^(INT\\.|EXT\\.|EST\\.)/i.test(text)) {
            newType = 'scene-heading';
        } else if (/^[A-Z\\s]+$/.test(text) && text.length < 40 && text.length > 1) {
            newType = 'character';
        } else if (/^\\(.+\\)$/.test(text)) {
            newType = 'parenthetical';
        } else if (/^(FADE IN:|FADE OUT:|CUT TO:|DISSOLVE TO:)/i.test(text)) {
            newType = 'transition';
        }
        
        if (newType && newType !== element.getAttribute('data-type')) {
            element.className = `wysiwyg-${newType}`;
            element.setAttribute('data-type', newType);
            document.getElementById('elementType').value = newType;
        }
    }
    
    function syncToOriginal() {
        if (originalEditor && document.getElementById('wysiwygEditor')) {
            originalEditor.value = convertHTMLToFountain(document.getElementById('wysiwygEditor'));
        }
    }
    
    // Global functions for toolbar
    window.insertElement = function(type) {
        createNewElement(type);
    };
    
    window.formatSelection = function(command) {
        document.execCommand(command, false, null);
    };
    
    function cycleElementType() {
        const currentElement = getCurrentElement();
        if (!currentElement) return;
        
        const types = ['action', 'scene-heading', 'character', 'dialogue', 'parenthetical', 'transition'];
        const currentType = currentElement.getAttribute('data-type');
        const currentIndex = types.indexOf(currentType);
        const nextIndex = (currentIndex + 1) % types.length;
        const nextType = types[nextIndex];
        
        currentElement.className = `wysiwyg-${nextType}`;
        currentElement.setAttribute('data-type', nextType);
        document.getElementById('elementType').value = nextType;
    }
    
    // Initialize
    addStyles();
    addToggleButton();
    
    console.log('WYSIWYG Integration Ready!');
}

// Multiple initialization attempts
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWYSIWYG);
} else {
    initWYSIWYG();
}

// Also try after a delay to catch dynamically loaded content
setTimeout(initWYSIWYG, 2000);
setTimeout(initWYSIWYG, 5000);