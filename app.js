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
    const icon = card.querySelector('i');
    try {
        await navigator.clipboard.writeText(text);
        icon.className = 'fa-solid fa-check';
        card.classList.add('copied');
        setTimeout(() => {
            icon.className = 'fa-regular fa-clipboard';
            card.classList.remove('copied');
        }, 1500);
    } catch (err) {
        icon.className = 'fa-solid fa-xmark';
        setTimeout(() => {
            icon.className = 'fa-regular fa-clipboard';
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
            <span class="copy-icon"><i class="fa-regular fa-clipboard"></i></span>
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
const scrollIcon = scrollBtn.querySelector('i');

const updateScrollButton = () => {
    const maxScroll = document.body.scrollHeight - window.innerHeight;

    scrollBtn.style.display = maxScroll > 100 ? 'block' : 'none';

    const isAtBottom = window.scrollY >= maxScroll - 50;
    scrollIcon.className = isAtBottom ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
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
