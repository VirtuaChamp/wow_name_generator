const LETTER_SWAPS = {
    'i': ['y'],
    'y': ['i'],
    'a': ['e'],
    'e': ['a'],
    'c': ['k'],
    'k': ['c'],
    's': ['z'],
    'z': ['s']
};

const DIGRAPH_SWAPS = {
    'ph': ['f'],
    'f': ['ph']
};

const ACCENT_VARIANTS = {
    'a': ['á', 'à', 'â', 'ä', 'ā', 'ă'],
    'e': ['é', 'è', 'ê', 'ë', 'ē'],
    'i': ['í', 'ì', 'î', 'ï', 'ī'],
    'o': ['ó', 'ò', 'ô', 'ö', 'ō'],
    'u': ['ú', 'ù', 'û', 'ü', 'ū'],
    'y': ['ý', 'ÿ'],
    'c': ['ç'],
    'n': ['ñ']
};

const MAX_RESULTS = 500;

const ICONS = {
    clipboard: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor"><path d="M280 64h40c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128C0 92.7 28.7 64 64 64h40 9.6C121 27.5 153.3 0 192 0s71 27.5 78.4 64H280zM64 112c-8.8 0-16 7.2-16 16V448c0 8.8 7.2 16 16 16H320c8.8 0 16-7.2 16-16V128c0-8.8-7.2-16-16-16H304v24c0 13.3-10.7 24-24 24H192 104c-13.3 0-24-10.7-24-24V112H64zm128-8a24 24 0 1 0 0-48 24 24 0 1 0 0 48z"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>',
    xmark: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>'
};

const getVariants = (char) => {
    const lower = char.toLowerCase();
    const isUpper = char !== lower;
    const variants = [char];

    const swaps = LETTER_SWAPS[lower] || [];
    const accents = ACCENT_VARIANTS[lower] || [];

    [...swaps, ...accents].forEach(v => {
        variants.push(isUpper ? v.toUpperCase() : v);
    });

    return variants;
};

const generateVariations = (name) => {
    const results = new Set();
    const queue = [{ remaining: name, built: '' }];

    while (queue.length > 0 && results.size < MAX_RESULTS) {
        const { remaining, built } = queue.shift();

        if (remaining.length === 0) {
            results.add(built);
            continue;
        }

        let processed = false;

        for (const [digraph, replacements] of Object.entries(DIGRAPH_SWAPS)) {
            if (remaining.toLowerCase().startsWith(digraph)) {
                const isFirstUpper = remaining[0] !== remaining[0].toLowerCase();
                const matchLength = digraph.length;
                const rest = remaining.slice(matchLength);

                queue.push({ remaining: rest, built: built + remaining.slice(0, matchLength) });

                replacements.forEach(rep => {
                    const replacement = isFirstUpper ? rep.charAt(0).toUpperCase() + rep.slice(1) : rep;
                    queue.push({ remaining: rest, built: built + replacement });
                });

                processed = true;
                break;
            }
        }

        if (!processed) {
            const char = remaining[0];
            const rest = remaining.slice(1);
            const variants = getVariants(char);

            variants.forEach(v => {
                queue.push({ remaining: rest, built: built + v });
            });
        }
    }

    return [...results].sort((a, b) => a.localeCompare(b));
};

const copyToClipboard = async (text, card) => {
    const iconSpan = card.querySelector('.copy-icon');
    try {
        await navigator.clipboard.writeText(text);
        iconSpan.innerHTML = ICONS.check;
        card.classList.add('copied');
        setTimeout(() => {
            iconSpan.innerHTML = ICONS.clipboard;
            card.classList.remove('copied');
        }, 1500);
    } catch (err) {
        iconSpan.innerHTML = ICONS.xmark;
        setTimeout(() => {
            iconSpan.innerHTML = ICONS.clipboard;
        }, 1500);
    }
};

const renderResults = (variations) => {
    const resultsContainer = document.getElementById('results');
    const statsContainer = document.getElementById('stats');

    statsContainer.textContent = `Generated ${variations.length} variations`;

    resultsContainer.innerHTML = variations.map(name => `
        <div class="name-card" data-name="${name}">
            <span class="name-text">${name}</span>
            <span class="copy-icon">${ICONS.clipboard}</span>
        </div>
    `).join('');

    resultsContainer.querySelectorAll('.name-card').forEach(card => {
        card.addEventListener('click', () => copyToClipboard(card.dataset.name, card));
    });

    updateScrollButton();
};

const handleGenerate = () => {
    const input = document.getElementById('nameInput');
    const name = input.value.trim();

    if (!name) {
        document.getElementById('stats').textContent = 'Please enter a name';
        document.getElementById('results').innerHTML = '';
        return;
    }

    const variations = generateVariations(name);
    renderResults(variations);
};

document.getElementById('generateBtn').addEventListener('click', handleGenerate);

document.getElementById('nameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleGenerate();
});

const scrollBtn = document.getElementById('scrollBtn');

const updateScrollButton = () => {
    const maxScroll = document.body.scrollHeight - window.innerHeight;

    scrollBtn.style.display = maxScroll > 100 ? 'flex' : 'none';

    const isAtBottom = window.scrollY >= maxScroll - 50;
    scrollBtn.classList.toggle('at-bottom', isAtBottom);
};

scrollBtn.addEventListener('click', () => {
    const scrollPos = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const isAtBottom = scrollPos >= maxScroll - 50;

    window.scrollTo({
        top: isAtBottom ? 0 : document.body.scrollHeight,
        behavior: 'smooth'
    });
});

window.addEventListener('scroll', updateScrollButton);
window.addEventListener('resize', updateScrollButton);
updateScrollButton();
