/**
 * WYSIWYG Enhancement Plugin for Afterwriting
 * Transforms the existing editor into a WYSIWYG screenplay editor
 */

(function() {
    'use strict';
    
    class WYSIWYGEnhancement {
        constructor() {
            this.isWYSIWYGMode = false;
            this.originalEditor = null;
            this.wysiwygEditor = null;
            this.characters = new Set(['JOHN', 'SARAH', 'MIKE', 'LISA']);
            this.undoStack = [];
            this.redoStack = [];
            
            this.init();
        }
        
        init() {
            // Wait for the main app to load
            this.waitForEditor(() => {
                this.setupWYSIWYGToggle();
                this.injectStyles();
            });
        }
        
        waitForEditor(callback) {
            const checkForEditor = () => {
                // Look for the main textarea editor
                const editor = document.querySelector('textarea') || 
                              document.querySelector('.editor') ||
                              document.querySelector('#editor');
                              
                if (editor) {
                    this.originalEditor = editor;
                    callback();
                } else {
                    setTimeout(checkForEditor, 500);
                }
            };
            checkForEditor();
        }
        
        setupWYSIWYGToggle() {
            // Create toggle button
            const toggleButton = document.createElement('button');
            toggleButton.innerHTML = '📝 WYSIWYG Mode';
            toggleButton.className = 'wysiwyg-toggle-btn';
            toggleButton.onclick = () => this.toggleWYSIWYGMode();
            
            // Find toolbar or create one
            let toolbar = document.querySelector('.toolbar') || 
                         document.querySelector('.controls') ||
                         document.querySelector('.header');
                         
            if (!toolbar) {
                toolbar = document.createElement('div');
                toolbar.className = 'wysiwyg-toolbar';
                document.body.insertBefore(toolbar, document.body.firstChild);
            }
            
            toolbar.appendChild(toggleButton);
        }
        
        toggleWYSIWYGMode() {
            if (this.isWYSIWYGMode) {
                this.switchToPlainText();
            } else {
                this.switchToWYSIWYG();
            }
        }
        
        switchToWYSIWYG() {
            if (!this.originalEditor) return;
            
            // Hide original editor
            this.originalEditor.style.display = 'none';
            
            // Create WYSIWYG editor
            this.createWYSIWYGEditor();
            
            // Convert content
            const fountainText = this.originalEditor.value;
            this.convertFountainToWYSIWYG(fountainText);
            
            this.isWYSIWYGMode = true;
            
            // Update toggle button
            const toggleBtn = document.querySelector('.wysiwyg-toggle-btn');
            if (toggleBtn) {
                toggleBtn.innerHTML = '📄 Plain Text Mode';
                toggleBtn.classList.add('active');
            }
        }
        
        switchToPlainText() {
            if (!this.wysiwygEditor) return;
            
            // Convert WYSIWYG back to fountain
            const fountainText = this.convertWYSIWYGToFountain();
            this.originalEditor.value = fountainText;
            
            // Show original editor
            this.originalEditor.style.display = '';
            
            // Remove WYSIWYG editor
            this.wysiwygEditor.remove();
            this.wysiwygEditor = null;
            
            this.isWYSIWYGMode = false;
            
            // Update toggle button
            const toggleBtn = document.querySelector('.wysiwyg-toggle-btn');
            if (toggleBtn) {
                toggleBtn.innerHTML = '📝 WYSIWYG Mode';
                toggleBtn.classList.remove('active');
            }
        }
        
        createWYSIWYGEditor() {
            // Create container
            const container = document.createElement('div');
            container.className = 'wysiwyg-container';
            
            // Create toolbar
            const toolbar = document.createElement('div');
            toolbar.className = 'wysiwyg-element-toolbar';
            toolbar.innerHTML = `
                <select id="wysiwygElementType" onchange="window.wysiwygEnhancement.changeElementType(this.value)">
                    <option value="action">Action</option>
                    <option value="scene-heading">Scene Heading</option>
                    <option value="character">Character</option>
                    <option value="dialogue">Dialogue</option>
                    <option value="parenthetical">Parenthetical</option>
                    <option value="transition">Transition</option>
                    <option value="centered">Centered Text</option>
                </select>
                <button onclick="window.wysiwygEnhancement.insertElement('scene-heading')">Scene</button>
                <button onclick="window.wysiwygEnhancement.insertElement('character')">Character</button>
                <button onclick="window.wysiwygEnhancement.insertElement('dialogue')">Dialogue</button>
                <button onclick="window.wysiwygEnhancement.insertElement('action')">Action</button>
                <button onclick="window.wysiwygEnhancement.formatText('bold')"><strong>B</strong></button>
                <button onclick="window.wysiwygEnhancement.formatText('italic')"><em>I</em></button>
                <button onclick="window.wysiwygEnhancement.undo()">Undo</button>
                <button onclick="window.wysiwygEnhancement.redo()">Redo</button>
            `;
            
            // Create editor
            const editor = document.createElement('div');
            editor.className = 'wysiwyg-screenplay-editor';
            editor.contentEditable = true;
            editor.id = 'wysiwygEditor';
            
            container.appendChild(toolbar);
            container.appendChild(editor);
            
            // Insert after original editor
            this.originalEditor.parentNode.insertBefore(container, this.originalEditor.nextSibling);
            
            this.wysiwygEditor = editor;
            this.setupWYSIWYGEvents();
        }
        
        setupWYSIWYGEvents() {
            this.wysiwygEditor.addEventListener('keydown', (e) => this.handleKeyDown(e));
            this.wysiwygEditor.addEventListener('input', (e) => this.handleInput(e));
            this.wysiwygEditor.addEventListener('click', (e) => this.handleClick(e));
            this.wysiwygEditor.addEventListener('paste', (e) => this.handlePaste(e));
        }
        
        handleKeyDown(e) {
            const currentElement = this.getCurrentElement();
            
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleEnter(currentElement);
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.handleTab(currentElement);
            } else if (e.key === 'Backspace' && this.isElementEmpty(currentElement)) {
                e.preventDefault();
                this.handleBackspace(currentElement);
            }
        }
        
        handleEnter(currentElement) {
            const elementType = this.getElementType(currentElement);
            let nextType = 'action';
            
            // Smart next element logic
            switch(elementType) {
                case 'scene-heading':
                    nextType = 'action';
                    break;
                case 'action':
                    nextType = 'action';
                    break;
                case 'character':
                    nextType = 'dialogue';
                    break;
                case 'dialogue':
                    nextType = 'character';
                    break;
                case 'parenthetical':
                    nextType = 'dialogue';
                    break;
                case 'transition':
                    nextType = 'scene-heading';
                    break;
            }
            
            this.createNewElement(nextType);
        }
        
        handleTab(currentElement) {
            const elementType = this.getElementType(currentElement);
            const typeOrder = ['action', 'scene-heading', 'character', 'dialogue', 'parenthetical', 'transition'];
            const currentIndex = typeOrder.indexOf(elementType);
            const nextIndex = (currentIndex + 1) % typeOrder.length;
            const nextType = typeOrder[nextIndex];
            
            this.changeElementType(currentElement, nextType);
            document.getElementById('wysiwygElementType').value = nextType;
        }
        
        handleInput(e) {
            const currentElement = this.getCurrentElement();
            if (currentElement) {
                this.autoFormat(currentElement);
                this.showCharacterSuggestions(currentElement);
            }
            this.saveState();
            
            // Sync back to original editor
            this.syncToOriginalEditor();
        }
        
        handleClick(e) {
            const element = e.target.closest('[class*=\"wysiwyg-\"]');
            if (element) {
                const elementType = this.getElementType(element);
                document.getElementById('wysiwygElementType').value = elementType;
            }
        }
        
        getCurrentElement() {
            const selection = window.getSelection();
            if (selection.rangeCount === 0) return null;
            
            const range = selection.getRangeAt(0);
            let element = range.commonAncestorContainer;
            
            if (element.nodeType === Node.TEXT_NODE) {
                element = element.parentElement;
            }
            
            // Find the screenplay element
            while (element && element !== this.wysiwygEditor) {
                if (element.classList && this.isScreenplayElement(element)) {
                    return element;
                }
                element = element.parentElement;
            }
            
            return null;
        }
        
        isScreenplayElement(element) {
            const classes = ['wysiwyg-scene-heading', 'wysiwyg-character', 'wysiwyg-dialogue', 'wysiwyg-action', 'wysiwyg-parenthetical', 'wysiwyg-transition', 'wysiwyg-centered'];
            return classes.some(cls => element.classList.contains(cls));
        }
        
        getElementType(element) {
            if (!element || !element.classList) return 'action';
            
            const classMap = {
                'wysiwyg-scene-heading': 'scene-heading',
                'wysiwyg-character': 'character',
                'wysiwyg-dialogue': 'dialogue',
                'wysiwyg-action': 'action',
                'wysiwyg-parenthetical': 'parenthetical',
                'wysiwyg-transition': 'transition',
                'wysiwyg-centered': 'centered'
            };
            
            for (let cls in classMap) {
                if (element.classList.contains(cls)) {
                    return classMap[cls];
                }
            }
            return 'action';
        }
        
        createNewElement(type, text = '') {
            const newElement = document.createElement('div');
            newElement.className = `wysiwyg-${type}`;
            newElement.textContent = text || this.getPlaceholderText(type);
            newElement.contentEditable = true;
            
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            
            // Insert after current element\n            const currentElement = this.getCurrentElement();\n            if (currentElement) {\n                currentElement.parentNode.insertBefore(newElement, currentElement.nextSibling);\n            } else {\n                this.wysiwygEditor.appendChild(newElement);\n            }\n            \n            // Focus new element\n            range.selectNodeContents(newElement);\n            range.collapse(false);\n            selection.removeAllRanges();\n            selection.addRange(range);\n            \n            document.getElementById('wysiwygElementType').value = type;\n        }\n        \n        changeElementType(element, newType) {\n            if (!element) {\n                element = this.getCurrentElement();\n            }\n            if (!element) return;\n            \n            element.className = `wysiwyg-${newType}`;\n            \n            // Update placeholder if empty\n            if (this.isElementEmpty(element)) {\n                element.textContent = this.getPlaceholderText(newType);\n            }\n        }\n        \n        getPlaceholderText(type) {\n            const placeholders = {\n                'scene-heading': 'INT. LOCATION - DAY',\n                'character': 'CHARACTER NAME',\n                'dialogue': 'Character dialogue...',\n                'action': 'Action description...',\n                'parenthetical': '(parenthetical)',\n                'transition': 'CUT TO:',\n                'centered': 'CENTERED TEXT'\n            };\n            return placeholders[type] || '';\n        }\n        \n        isElementEmpty(element) {\n            if (!element) return true;\n            const text = element.textContent.trim();\n            return !text || text === this.getPlaceholderText(this.getElementType(element));\n        }\n        \n        autoFormat(element) {\n            const text = element.textContent.trim();\n            const elementType = this.getElementType(element);\n            \n            // Auto-detect scene headings\n            if (elementType === 'action' && /^(INT\\.|EXT\\.|EST\\.)/i.test(text)) {\n                this.changeElementType(element, 'scene-heading');\n                document.getElementById('wysiwygElementType').value = 'scene-heading';\n            }\n            \n            // Auto-detect character names (all caps)\n            if (elementType === 'action' && /^[A-Z\\s]+$/.test(text) && text.length < 30 && text.length > 1) {\n                this.changeElementType(element, 'character');\n                document.getElementById('wysiwygElementType').value = 'character';\n                this.characters.add(text);\n            }\n            \n            // Auto-detect transitions\n            if (elementType === 'action' && /^(FADE IN:|FADE OUT:|CUT TO:|DISSOLVE TO:)/i.test(text)) {\n                this.changeElementType(element, 'transition');\n                document.getElementById('wysiwygElementType').value = 'transition';\n            }\n        }\n        \n        convertFountainToWYSIWYG(fountainText) {\n            const lines = fountainText.split('\\n');\n            let html = '';\n            \n            for (let line of lines) {\n                line = line.trim();\n                if (!line) continue;\n                \n                const element = this.identifyFountainElement(line);\n                html += `<div class=\"wysiwyg-${element.type}\" contenteditable=\"true\">${element.text}</div>`;\n            }\n            \n            this.wysiwygEditor.innerHTML = html || '<div class=\"wysiwyg-action\" contenteditable=\"true\">Start writing your screenplay...</div>';\n        }\n        \n        identifyFountainElement(line) {\n            // Scene headings\n            if (/^(INT\\.|EXT\\.|EST\\.|int\\.|ext\\.|est\\.)/i.test(line)) {\n                return { type: 'scene-heading', text: line };\n            }\n            \n            // Character names (all caps, centered)\n            if (/^[A-Z\\s]+$/.test(line) && line.length < 50) {\n                this.characters.add(line);\n                return { type: 'character', text: line };\n            }\n            \n            // Parentheticals\n            if (/^\\(.+\\)$/.test(line)) {\n                return { type: 'parenthetical', text: line };\n            }\n            \n            // Transitions\n            if (/^(FADE IN:|FADE OUT:|CUT TO:|DISSOLVE TO:)/i.test(line)) {\n                return { type: 'transition', text: line };\n            }\n            \n            // Centered text\n            if (/^>.+<$/.test(line)) {\n                return { type: 'centered', text: line.slice(1, -1) };\n            }\n            \n            // Default to action\n            return { type: 'action', text: line };\n        }\n        \n        convertWYSIWYGToFountain() {\n            const elements = this.wysiwygEditor.querySelectorAll('div');\n            let fountainText = '';\n            \n            elements.forEach(el => {\n                const type = this.getElementType(el);\n                const text = el.textContent.trim();\n                if (!text || text === this.getPlaceholderText(type)) return;\n                \n                switch(type) {\n                    case 'scene-heading':\n                        fountainText += text.toUpperCase() + '\\n\\n';\n                        break;\n                    case 'character':\n                        fountainText += text.toUpperCase() + '\\n';\n                        break;\n                    case 'dialogue':\n                        fountainText += text + '\\n';\n                        break;\n                    case 'parenthetical':\n                        fountainText += text + '\\n';\n                        break;\n                    case 'action':\n                        fountainText += text + '\\n\\n';\n                        break;\n                    case 'transition':\n                        fountainText += text.toUpperCase() + '\\n\\n';\n                        break;\n                    case 'centered':\n                        fountainText += '>' + text.toUpperCase() + '<\\n\\n';\n                        break;\n                }\n            });\n            \n            return fountainText;\n        }\n        \n        syncToOriginalEditor() {\n            if (this.originalEditor && this.wysiwygEditor) {\n                this.originalEditor.value = this.convertWYSIWYGToFountain();\n                \n                // Trigger change event for original editor\n                const event = new Event('input', { bubbles: true });\n                this.originalEditor.dispatchEvent(event);\n            }\n        }\n        \n        // Public methods for toolbar\n        insertElement(type) {\n            this.createNewElement(type);\n        }\n        \n        formatText(command) {\n            document.execCommand(command, false, null);\n        }\n        \n        undo() {\n            if (this.undoStack.length > 0) {\n                this.redoStack.push(this.wysiwygEditor.innerHTML);\n                this.wysiwygEditor.innerHTML = this.undoStack.pop();\n                this.syncToOriginalEditor();\n            }\n        }\n        \n        redo() {\n            if (this.redoStack.length > 0) {\n                this.undoStack.push(this.wysiwygEditor.innerHTML);\n                this.wysiwygEditor.innerHTML = this.redoStack.pop();\n                this.syncToOriginalEditor();\n            }\n        }\n        \n        saveState() {\n            if (this.wysiwygEditor) {\n                this.undoStack.push(this.wysiwygEditor.innerHTML);\n                if (this.undoStack.length > 50) {\n                    this.undoStack.shift();\n                }\n                this.redoStack = [];\n            }\n        }\n        \n        injectStyles() {\n            const styles = `\n                <style>\n                .wysiwyg-toggle-btn {\n                    background: #3498db;\n                    color: white;\n                    border: none;\n                    padding: 10px 15px;\n                    border-radius: 5px;\n                    cursor: pointer;\n                    margin: 5px;\n                    font-size: 14px;\n                }\n                \n                .wysiwyg-toggle-btn.active {\n                    background: #e74c3c;\n                }\n                \n                .wysiwyg-toggle-btn:hover {\n                    opacity: 0.8;\n                }\n                \n                .wysiwyg-container {\n                    border: 1px solid #ddd;\n                    border-radius: 8px;\n                    margin: 10px 0;\n                    background: white;\n                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);\n                }\n                \n                .wysiwyg-element-toolbar {\n                    background: #2c3e50;\n                    color: white;\n                    padding: 10px;\n                    border-radius: 8px 8px 0 0;\n                    display: flex;\n                    gap: 10px;\n                    align-items: center;\n                    flex-wrap: wrap;\n                }\n                \n                .wysiwyg-element-toolbar select,\n                .wysiwyg-element-toolbar button {\n                    background: #3498db;\n                    color: white;\n                    border: none;\n                    padding: 6px 10px;\n                    border-radius: 4px;\n                    cursor: pointer;\n                    font-size: 12px;\n                }\n                \n                .wysiwyg-element-toolbar select:hover,\n                .wysiwyg-element-toolbar button:hover {\n                    background: #2980b9;\n                }\n                \n                .wysiwyg-screenplay-editor {\n                    font-family: 'Courier New', monospace;\n                    font-size: 12pt;\n                    line-height: 1.2;\n                    padding: 20px;\n                    min-height: 400px;\n                    outline: none;\n                    background: white;\n                }\n                \n                .wysiwyg-scene-heading {\n                    text-transform: uppercase;\n                    font-weight: bold;\n                    margin: 24pt 0 12pt 0;\n                    color: #2c3e50;\n                    border-left: 3px solid #3498db;\n                    padding-left: 10px;\n                }\n                \n                .wysiwyg-character {\n                    text-transform: uppercase;\n                    font-weight: bold;\n                    margin: 24pt 0 0 2.2in;\n                    text-align: left;\n                    width: 2in;\n                    color: #27ae60;\n                }\n                \n                .wysiwyg-dialogue {\n                    margin: 0 0 12pt 1.5in;\n                    width: 3.5in;\n                    text-align: left;\n                    color: #34495e;\n                }\n                \n                .wysiwyg-parenthetical {\n                    margin: 0 0 0 2in;\n                    width: 2in;\n                    font-style: italic;\n                    text-align: left;\n                    color: #7f8c8d;\n                }\n                \n                .wysiwyg-action {\n                    margin: 12pt 0;\n                    text-align: left;\n                    width: 6in;\n                    color: #2c3e50;\n                }\n                \n                .wysiwyg-transition {\n                    text-transform: uppercase;\n                    font-weight: bold;\n                    margin: 24pt 0 24pt 4in;\n                    text-align: right;\n                    width: 2in;\n                    color: #e74c3c;\n                }\n                \n                .wysiwyg-centered {\n                    text-align: center;\n                    text-transform: uppercase;\n                    font-weight: bold;\n                    margin: 24pt 0;\n                    color: #8e44ad;\n                }\n                \n                .wysiwyg-screenplay-editor div:hover {\n                    background: rgba(52, 152, 219, 0.05);\n                    border-radius: 2px;\n                }\n                \n                .wysiwyg-screenplay-editor div:focus {\n                    background: rgba(52, 152, 219, 0.1);\n                    border: 1px dashed #3498db;\n                    border-radius: 2px;\n                    outline: none;\n                }\n                \n                .wysiwyg-toolbar {\n                    background: #ecf0f1;\n                    padding: 10px;\n                    border-bottom: 1px solid #bdc3c7;\n                }\n                </style>\n            `;\n            \n            document.head.insertAdjacentHTML('beforeend', styles);\n        }\n    }\n    \n    // Initialize when DOM is ready\n    if (document.readyState === 'loading') {\n        document.addEventListener('DOMContentLoaded', () => {\n            window.wysiwygEnhancement = new WYSIWYGEnhancement();\n        });\n    } else {\n        window.wysiwygEnhancement = new WYSIWYGEnhancement();\n    }\n    \n})();