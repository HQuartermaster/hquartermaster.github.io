// root directory for the blog
var ROOT_PATH_PREFIX = "";
// root for media src in MD files
var MEDIA_ROOT = '/media';
// Contains data.json object
var BLOGDATA_JSON = null;
// Current file
let current_file = null;
// A dictionary that maps paths to lambdas that load
// the file and set the relevant elements.
let file_loader_functions = {};

/* 
    Build the sidebar tree, recursively,
    directory by directory.
*/
function buildTree(node, pathPrefix, depth) {
    const frag = document.createDocumentFragment();

    // Files at this level
    (node.files || []).forEach(fileobj => {
        const fname = fileobj.name;
        const route_path = `${pathPrefix}/${fname}`;
        const el = document.createElement('div');
        el.className = 'tree-file';
        el.dataset.path = route_path;
        const label = fname
        el.innerHTML = `<i class="fa-solid fa-file"></i>${label}`;

        /* 
            Add this to the file loader functions. This is used by window.location.hashchanged.
            We simply change the window hash on click.
        */
        file_loader_functions[route_path] = () => {
            setCreatedModifiedTime(fileobj.timestamp_created, fileobj.timestamp_modified);
            document.getElementById('main-tab').textContent = label;
            const full_path = `${ROOT_PATH_PREFIX}/${route_path}`;
            loadFile(full_path, el);
        }

        el.addEventListener('click', () => {
            window.location.hash = route_path;
        });
        frag.appendChild(el);
    });

    // Subdirectories
    (node.dirs || []).forEach(dir => {
        const folderEl = document.createElement('div');
        folderEl.id = `folder-element${(pathPrefix + '/' + dir.name).replaceAll("/", "-")}`;
        folderEl.className = 'tree-folder';
        const headerEl = document.createElement('div');
        headerEl.className = 'tree-folder-header';
        headerEl.innerHTML = `
      <span class="arrow">
        <i class="fa fa-angle-right"></i>
      </span>
      <i class="fa fa-folder"></i>
      <span class="folder-name">${dir.name}</span>`;
        headerEl.addEventListener('click', () => folderEl.classList.toggle('open'));
        const childrenEl = document.createElement('div');
        childrenEl.className = 'tree-children';
        childrenEl.appendChild(buildTree(dir, `${pathPrefix}/${dir.name}`, depth + 1));
        folderEl.appendChild(headerEl);
        folderEl.appendChild(childrenEl);
        frag.appendChild(folderEl);
    });

    return frag;
}

/* 
    Loads the configuration from config.json.
*/
async function loadConfig() {
    const response = await fetch('./config.json');
    const data = await response.json();

    document.getElementById("blog-title").textContent = data.blog_title;
    document.title = data.web_title;
}

/* 
    Loads the file tree from data.json.
    Sets the root directory, and the media root.
    Builds the sidebar.
*/
async function loadDataAndSidebar() {
    const root = document.getElementById('tree-root');

    const response = await fetch('./data.json');
    const data = await response.json();

    BLOGDATA_JSON = data;
    ROOT_PATH_PREFIX = `./${data.name}`;
    MEDIA_ROOT = `${ROOT_PATH_PREFIX}${MEDIA_ROOT}`;

    root.appendChild(buildTree(data, "", 0));
}
/* 
    Load a file given path.

    Updates the active status in the sidebar
    and the breadcrumb.

    Then loads a file.
*/
async function loadFile(path, triggerEl) {
    setStatus('LOADING');
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('content').style.display = 'none';
    document.getElementById('error-state').style.display = 'none';

    // Update active state in sidebar
    document.querySelectorAll('.tree-file.active').forEach(el => el.classList.remove('active'));
    if (triggerEl) triggerEl.classList.add('active');
    current_file = path;

    // Update breadcrumb
    const parts = path.replace(ROOT_PATH_PREFIX + '/', '').split('/');
    document.getElementById('bc-path').textContent = parts.join(' / ');

    // Now load the file
    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const text = await res.text();
        renderMarkdown(text);
        setStatus('OK');
    } catch (err) {
        showError(path, err);
        setStatus('ERR');
    }
}
/* 
    Extract YAML header
    Returns the yamldata and content (md without the yaml)
*/
function extractYAML(md) {
    const match = md.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*/);

    if (!match) {
        return { metadata: {}, content: md };
    }

    const yamlText = match[1];
    const content = md.slice(match[0].length);
    const yamldata = jsyaml.load(yamlText);
    return { yamldata, content };
}
/* 
    Resolve citations. Called after the mark down renderer
    has add .cite class for every [@citation] element.

    We then browse through the YAML citations and add
    in the links and the data.
*/
function resolveCitations(container, yamldata) {
    const nodes = container.querySelectorAll(".cite");

    nodes.forEach(node => {
        const key = node.dataset.key;
        const entry = yamldata?.citations?.[key];

        if (!entry) {
            // Citation key not found in YAML
            node.innerHTML = `<sup class="cite-missing">?</sup>`;
            return;
        }

        const author = entry.author || "Unknown";
        const title = entry.title || "Untitled";
        const doi = entry.doi || null;
        const link = entry.link || null;
        const year = entry.year || null;
        const tooltipHTML = `
                    <div class="cite-tooltip">
                        <div><b>${author}</b>${year ? `&nbsp;(${year})` : ""}</div>
                        <div><i>${title}</i></div>
                    </div>
                `;

        node.innerHTML = `
                    <span class="cite-wrapper">
                        <sup class="cite-valid">
                            [<i class="fa-solid fa-arrow-up-right-from-square"></i>]
                            ${tooltipHTML}
                        </sup>
                    </span>
                `;

        // Optional: clickable DOI
        if (doi) {
            node.querySelector("sup").style.cursor = "pointer";
            node.querySelector("sup").onclick = () => {
                window.open(`https://doi.org/${doi}`, "_blank");
            };
        } else if (link) {
            node.querySelector("sup").style.cursor = "pointer";
            node.querySelector("sup").onclick = () => {
                window.open(link, "_blank");
            };
        }
    });
}

function activateCopyButtons(container) {
    container.querySelectorAll('.copy-code-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const code = btn.closest('.code-block').querySelector('pre').innerText;
            navigator.clipboard.writeText(code);

            btn.innerHTML = `<span class="fa fa-check"></span>`;
            setTimeout(() => btn.innerHTML = `<span class="fa fa-copy"></span>`, 2000);
        });
    });
}
/* 
    Render MD with LaTeX support, syntax highlighting,
    image support and citations.
*/
function renderMarkdown(text) {
    // Pre-process: protect LaTeX blocks from Markdown parser
    const blocks = [];
    let processed = text
        // Display math $$...$$ and \[...\]
        .replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => {
            blocks.push({ type: 'display', content: m });
            return `%%MATH_BLOCK_${blocks.length - 1}%%`;
        })
        .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => {
            blocks.push({ type: 'display', content: m });
            return `%%MATH_BLOCK_${blocks.length - 1}%%`;
        })
        // Inline math $...$ and \(...\)
        .replace(/\$([^\n$]+?)\$/g, (_, m) => {
            blocks.push({ type: 'inline', content: m });
            return `%%MATH_BLOCK_${blocks.length - 1}%%`;
        })
        .replace(/\\\((.+?)\\\)/g, (_, m) => {
            blocks.push({ type: 'inline', content: m });
            return `%%MATH_BLOCK_${blocks.length - 1}%%`;
        });

    /* Extract YAML data */
    const { yamldata, content } = extractYAML(processed);

    /* Remove YAML data from marked content */
    processed = content;

    /* Set page title and author name if available */
    if (yamldata?.title) {
        window.document.title = yamldata.title;
    } else {
        window.document.title = "Untitled | Nexus";
    }

    setAuthor(yamldata?.author, yamldata?.author_link);

    // Custom renderer to fix image paths
    const renderer = new marked.Renderer();
    renderer.image = (href, title, text) => {
        // Strip leading ./ or / from href, resolve against images root
        const clean = href.replace(/^\.?\//, '');
        const resolved = clean.startsWith('http') ? href : `${MEDIA_ROOT}/${clean}`;
        const titleAttr = title ? ` title="${title}"` : '';
        return `<img src="${resolved}" alt="${text}"${titleAttr} loading="lazy">`;
    };

    renderer.table = function (header, body) {
        return `
                    <div class="table-container">
                    <table>
                        <thead>${header}</thead>
                        <tbody>${body}</tbody>
                    </table>
                    </div>
                `;
    };

    renderer.code = function (code, infostring, escaped) {
        return `<div class="code-block">
                    <div class="code-header">
                        <button class="copy-code-btn"><span class="fa fa-copy"></span></button>
                    </div>
                    <pre><code class="hljs language-${infostring}">${code}</code></pre>
                </div>`;
    }

    marked.use({ renderer });

    /* Add citation support to marked */
    const citationExtension = {
        name: "citation",
        level: "inline",

        start(src) {
            return src.indexOf("[@");
        },

        tokenizer(src) {
            const match = /^\[@([a-zA-Z0-9_-]+)\]/.exec(src);
            if (match) {
                return {
                    type: "citation",
                    raw: match[0],
                    key: match[1]
                };
            }
        },

        renderer(token) {
            return `<span class="cite" data-key="${token.key}"></span>`;
        }
    };

    const flagExtension = {
        name: 'flag',
        level: 'inline',

        start(src) {
            return src.match(/:flag\[/)?.index;
        },

        tokenizer(src) {
            const rule = /^:flag\[([a-zA-Z0-9_-]+)\]/;
            const match = rule.exec(src);
            if (match) {
                return {
                    type: 'flag',
                    raw: match[0],
                    code: match[1].toLowerCase()
                };
            }
        },

        renderer(token) {
            return `<img src="${MEDIA_ROOT}/flags/${token.code}.png"
                                    alt="${token.code.toUpperCase()} Flag"
                                    width="24"
                                    style="border: none;display:inline; vertical-align:middle;"/>`;
        }
    };
    marked.use({ extensions: [citationExtension, flagExtension] });

    // Parse Markdown
    let html = marked.parse(processed);

    // Restore math blocks
    html = html.replace(/%%MATH_BLOCK_(\d+)%%/g, (_, i) => {
        const block = blocks[parseInt(i)];
        try {
            if (block.type === 'display') {
                return `<div class="katex-display">${katex.renderToString(block.content, { displayMode: true, throwOnError: false })}</div>`;
            } else {
                return katex.renderToString(block.content, { displayMode: false, throwOnError: false });
            }
        } catch (e) {
            return `<code>${block.content}</code>`;
        }
    });

    const body = document.getElementById('md-body');
    body.innerHTML = html;

    // After rendering, resolve citations
    resolveCitations(body, yamldata);
    // Activate the copy code buttons
    activateCopyButtons(body);

    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';

    // Scroll to top
    document.getElementById('main').scrollTop = 0;
}

/*
    Show error bar.
*/
function showError(path, err) {
    document.getElementById('loading').style.display = 'none';
    const el = document.getElementById('error-state');
    el.style.display = 'block';
    el.innerHTML = `
    <h3>// ERROR</h3>
    <p>Could not load <code>${path}</code></p>
    <p style="margin-top:0.8rem">${err.message}</p>
    <p style="margin-top:1.2rem;color:var(--text-muted);font-size:11px">
      Make sure you're serving this from a local server (e.g. <code>python3 -m http.server</code>)
      and that the file exists relative to <code>index.html</code>.
    </p>`;
}
function ordinal(n) {
    if (n > 3 && n < 21) return n + "th";
    switch (n % 10) {
        case 1: return n + "st";
        case 2: return n + "nd";
        case 3: return n + "rd";
        default: return n + "th";
    }
}

/*
    Function to convert UNIX timestamp to a nicely
    formatted string.
*/
function unixTimestampToNice(ts, locale = "en-IN") {
    // Convert UNIX (seconds -> milliseconds)
    const date = new Date(ts * 1000);

    // Format parts in IST
    const options = {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    };

    const parts = new Intl.DateTimeFormat(locale, options).formatToParts(date);

    let day, month, year, hour, minute, dayPeriod;

    parts.forEach(p => {
        if (p.type === "day") day = ordinal(parseInt(p.value));
        if (p.type === "month") month = p.value;
        if (p.type === "year") year = p.value;
        if (p.type === "hour") hour = p.value;
        if (p.type === "minute") minute = p.value;
        if (p.type === "dayPeriod") dayPeriod = p.value;
    });

    return `${day} ${month} ${year}, ${hour}:${minute} ${dayPeriod.toUpperCase()}`;
}

/*
    Function to convert UNIX timestamp to a short
        formatted string for mobile view.
*/
function unixTimeStampToShort(ts, locale = "en-IN") {
    const date = new Date(ts * 1000);
    const options = {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    };
    const parts = new Intl.DateTimeFormat(locale, options).formatToParts(date);

    parts.forEach(p => {
        if (p.type === "day") day = p.value;
        if (p.type === "month") month = p.value;
        if (p.type === "year") year = p.value;
        if (p.type === "hour") hour = p.value;
        if (p.type === "minute") minute = p.value;
    });

    return `${day}.${month}.${year} ${hour}:${minute}`;
}
/* 
    Set author name and link in the bottom bar.
*/
function setAuthor(name, link) {
    const authorNameEl = document.getElementById('author-name');
    const authorLinkEl = document.getElementById('author-link');

    authorNameEl.textContent = name || "anonymous";
    if (link) {
        authorLinkEl.href = link;
        authorLinkEl.style.pointerEvents = 'auto';
        authorLinkEl.style.opacity = '1';
    } else {
        authorLinkEl.href = '#';
        authorLinkEl.style.pointerEvents = 'none';
        authorLinkEl.style.opacity = '0.6';
    }
}
/* 
    Set status bar.
*/
function setStatus(s) {
    const map = { LOADING: 'LOADING...', OK: 'READY', ERR: 'ERROR', READY: 'READY' };
    document.getElementById('status-bar').textContent = map[s] || s;
}
/* 
    Set the created and modified time in the bottom bar.
*/
function setCreatedModifiedTime(c_time, m_time) {
    var timeStampFunc = window.matchMedia("(max-width: 699px)").matches ? unixTimeStampToShort : unixTimestampToNice;
    document.getElementById('date-created').textContent = timeStampFunc(c_time);
    document.getElementById('date-modified').textContent = timeStampFunc(m_time);
}

/* 
    This is the function that gets called when window.location.hash changes.
    The core of our navigation system.
*/
function handleRoute() {
    const route = window.location.hash.slice(1);
    if (route in file_loader_functions) {
        file_loader_functions[route]();

        // Expand the folder in which the route is in.
        const hierarchy = route.split('/').filter(Boolean);

        let currentPath = "";

        for (const folder of hierarchy.slice(0, -1)) { // exclude file
            currentPath += "/" + folder;

            const id = `folder-element${currentPath.replaceAll("/", "-")}`;
            const el = document.getElementById(id);

            if (el) {
                el.classList.add('open');
            }
        }

    } else {
        document.getElementById('content').style.display = 'none';
        showError(route, "");
        setStatus('ERR');
    }
}
/*
    Executed when blog is loaded.
*/
async function onNexusLoad() {
    await loadConfig();
    await loadDataAndSidebar();

    globalThis.marked.use(markedHighlight.markedHighlight({
        emptyLangClass: 'hljs',
        langPrefix: 'hljs language-',
        highlight(code, lang, info) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        }
    }));
    /* 
        Very important. Add the listener that makes
        navigation possible.
    */
    window.addEventListener("hashchange", handleRoute);

    if (window.location.hash === "")
        window.location.hash = '/index.md';
    else
        handleRoute();

    /* For the side bar button */
    document.getElementById('sidebar-button').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('closed');
    });
}