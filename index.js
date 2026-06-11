// Hamburguesa
const hb = document.getElementById('hamburger');
const nv = document.getElementById('main-nav');
hb.onclick = () => { hb.classList.toggle('active'); nv.classList.toggle('open'); };

// Scroll Reveal Suave
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.animate-up').forEach(el => observer.observe(el));

// ── Lenis Smooth Scroll Initialization ──
const lenis = new Lenis({
    duration: 0.9,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.2,
    touchMultiplier: 2,
    infinite: false,
})

function raf(time) {
    lenis.raf(time)
    requestAnimationFrame(raf)
}
requestAnimationFrame(raf)

// ── Smooth scroll con Lenis ──
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
        const href = link.getAttribute('href');
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();

        const offset = document.querySelector('.header-wrap').offsetHeight + 8;
        lenis.scrollTo(target, { offset: -offset });

        // Cierra menú mobile si está abierto
        document.getElementById('main-nav').classList.remove('open');
        document.getElementById('hamburger').classList.remove('active');
    });
});

// ── Scroll Spy (Navbar Active State) ──
const navLinks = document.querySelectorAll('#main-nav a');
const sections = document.querySelectorAll('section[id]');

function scrollSpy() {
    let current = "";
    const offset = document.querySelector('.header-wrap').offsetHeight + 100;

    sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - offset) {
            current = section.getAttribute("id");
        }
    });

    // Forzar 'contact' si estamos al final de la página
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 5) {
        current = "contact";
    }

    navLinks.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${current}`) {
            link.classList.add("active");
        }
    });
}

// Lenis emite un evento de scroll que podemos usar para el Spy
lenis.on('scroll', scrollSpy);
window.addEventListener("load", scrollSpy);

// ── Ticker Custom JS (Control ultra suave, loop bidireccional perfecto) ──
document.querySelectorAll('.tech-ticker-contained').forEach(container => {
    const track = container.querySelector('.ticker-track');
    const isReverse = track.classList.contains('track-2');
    const BASE_SPD = isReverse ? 0.35 : -0.35; // balance ideal

    // Usamos ResizeObserver por si cambia la fuente o el width de la pantalla
    const initTicker = () => {
        // Tomamos unicamente los items originales
        const originalItems = Array.from(track.querySelectorAll('.ticker-item:not(.cloned)'));
        if (originalItems.length === 0) return;

        // Clonamos la lista original 3 veces extra para tener un buffer gigante
        // Esto evita que al reiniciar la lista se vea un espacio vacio temporal a la derecha
        for (let i = 0; i < 3; i++) {
            originalItems.forEach(item => {
                const clone = item.cloneNode(true);
                clone.classList.add('cloned');
                track.appendChild(clone);
            });
        }

        // Calculamos matemáticamente la repetición
        const allItems = track.querySelectorAll('.ticker-item');
        const originalCount = originalItems.length;
        const firstItem = allItems[0];
        const firstDuplicate = allItems[originalCount];
        const loopWidth = firstDuplicate.offsetLeft - firstItem.offsetLeft;

        let posX = isReverse ? -loopWidth : 0;
        let vel = BASE_SPD;

        function tick() {
            posX += vel;
            vel += (BASE_SPD - vel) * 0.02; // inercia mucho más suave

            // Reseteo matemático perfecto
            if (posX <= -loopWidth) posX += loopWidth;
            if (posX >= 0) posX -= loopWidth;

            track.style.transform = `translate3d(${posX}px, 0, 0)`;
            track.dataset.frameId = requestAnimationFrame(tick);
        }

        if (track.dataset.frameId) cancelAnimationFrame(track.dataset.frameId);
        tick();

        let dragging = false;
        let lastMouseX = 0;

        const startDrag = (e) => {
            dragging = true;
            lastMouseX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            vel = 0;
            container.style.cursor = 'grabbing';
            e.preventDefault();
        };

        const moveDrag = (e) => {
            if (!dragging) return;
            const currX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const dx = currX - lastMouseX;
            posX += dx * 0.85;
            vel = dx * 0.25;
            lastMouseX = currX;
        };

        const endDrag = () => {
            if (!dragging) return;
            dragging = false;
            container.style.cursor = 'grab';
        };

        container.onmousedown = startDrag;
        window.addEventListener('mousemove', moveDrag);
        window.addEventListener('mouseup', endDrag);

        container.addEventListener('touchstart', startDrag, { passive: false });
        window.addEventListener('touchmove', moveDrag, { passive: false });
        window.addEventListener('touchend', endDrag);

        container.style.cursor = 'grab';
    };

    // Esperar a que las fuentes/layout estén listos para medir
    setTimeout(initTicker, 100);
});

// ── Renderizado Dinámico de Proyectos ──
async function renderProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    try {
        const response = await fetch('projects.json');
        const projectsData = await response.json();

        container.innerHTML = projectsData.map(p => `
            <a href="${p.link}" target="_blank" class="project-card ${p.featured ? 'featured' : ''}">
                <div class="project-img">
                    <img src="${p.img}" alt="${p.title}" loading="lazy" />
                </div>
                <div class="project-info">
                    <h3>${p.title}</h3>
                    <p>${p.desc}</p>
                    <div class="tech-tags">
                        ${p.tags.map(t => `<span>${t}</span>`).join('')}
                    </div>
                </div>
            </a>
        `).join('');
    } catch (error) {
        console.error("Error cargando los proyectos:", error);
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Error al cargar los proyectos. Por favor, intenta de nuevo más tarde.</p>`;
    }
}

renderProjects();
