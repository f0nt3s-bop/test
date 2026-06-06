/* ================================================
   A VIA DI I PASTORI – Script principal
   Ajouts : galerie swipeable terrain, reveal au scroll
   ================================================
   Fonctionnalités :
     1. Menu burger (mobile)
     2. Lien actif dans la navigation selon le scroll
     3. Bouton retour en haut
     4. Formulaire de contact (Formspree)
     5. Activités — animations
     6. Carte interactive Leaflet + OpenStreetMap
     7. Vidéo hero — forçage autoplay mobile
     8. Formulaire de réservation → Google Sheets
   ================================================ */


/* ------------------------------------------------
   8. FORMULAIRE DE RÉSERVATION → GOOGLE SHEETS
   ================================================
   Les inscriptions sont envoyées à un Google Sheet
   via un Google Apps Script déployé comme Web App.

   ════ COMMENT CONFIGURER ════════════════════════
   1. Créer un Google Sheet avec ces colonnes :
      Date | Nom | Prénom | Email | Téléphone | Âge

   2. Dans le Sheet : Extensions → Apps Script
      Coller le code suivant dans Code.gs :

      function doPost(e) {
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
        var data  = JSON.parse(e.postData.contents);
        sheet.appendRow([
          new Date(),
          data.nom,
          data.prenom,
          data.email,
          data.telephone,
          data.age
        ]);
        return ContentService
          .createTextOutput(JSON.stringify({ result: 'ok' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

   3. Déployer : Déployer → Nouveau déploiement
      - Type : Application Web
      - Exécuter en tant que : Moi
      - Accès : Tout le monde
      → Copier l'URL de déploiement

   4. Remplacer GOOGLE_SCRIPT_URL ci-dessous
      par l'URL copiée.
   ─────────────────────────────────────────────── */

var GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwIbcX5CF2VRO6wQEz0hwuaIIxd7zcJOGtGX6bRwWbhc795tNUuA6GFzq6UkkdeiCG1/exec';

(function () {

    var form    = document.getElementById('resa-form');
    var succes  = document.getElementById('resa-succes');
    var erreur  = document.getElementById('resa-erreur');
    var bouton  = document.getElementById('resa-submit');

    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Validation basique côté client
        var champs = form.querySelectorAll('input[required]');
        var valide = true;
        champs.forEach(function (champ) {
            champ.style.borderColor = '';
            if (!champ.value.trim()) {
                champ.style.borderColor = '#c0392b';
                valide = false;
            }
        });
        if (!valide) return;

        bouton.disabled    = true;
        bouton.textContent = 'Envoi en cours…';
        if (succes) succes.style.display = 'none';
        if (erreur) erreur.style.display = 'none';

        // FormData : seul format compatible avec Apps Script en mode no-cors
        var donnees = new FormData();
        donnees.append('nom',       document.getElementById('resa-nom').value.trim());
        donnees.append('prenom',    document.getElementById('resa-prenom').value.trim());
        donnees.append('email',     document.getElementById('resa-email').value.trim());
        donnees.append('telephone', document.getElementById('resa-tel').value.trim());
        donnees.append('age',       document.getElementById('resa-age').value.trim());

        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode:   'no-cors',  // obligatoire avec Apps Script (réponse opaque)
            body:   donnees
        })
        .then(function () {
            // no-cors : pas de lecture de réponse possible, on suppose le succès
            if (succes) succes.style.display = 'block';
            form.reset();
            form.querySelectorAll('input').forEach(function (i) { i.style.borderColor = ''; });
            bouton.textContent = 'Confirmer mon inscription';
            bouton.disabled    = false;
        })
        .catch(function () {
            if (erreur) erreur.style.display = 'block';
            bouton.disabled    = false;
            bouton.textContent = 'Confirmer mon inscription';
        });
    });

}());


/* ------------------------------------------------
   10. GALERIE SWIPEABLE — SECTION TERRAIN
   ------------------------------------------------ */
(function () {
    var track   = document.getElementById('galerie-track');
    var dotsWrap = document.getElementById('galerie-dots');
    var prevBtn  = document.getElementById('galerie-prev');
    var nextBtn  = document.getElementById('galerie-next');

    if (!track || !dotsWrap) return;

    var slides = Array.prototype.slice.call(track.querySelectorAll('.galerie-slide'));
    var total  = slides.length;
    var current = 0;

    /* Créer les points */
    slides.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.className = 'galerie-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Image ' + (i + 1));
        dot.addEventListener('click', function () { goTo(i); });
        dotsWrap.appendChild(dot);
    });

    function getDots() { return dotsWrap.querySelectorAll('.galerie-dot'); }

    function setActive(index) {
        current = Math.max(0, Math.min(index, total - 1));
        getDots().forEach(function (d, i) { d.classList.toggle('active', i === current); });
    }

    function goTo(index) {
        var slide = slides[index];
        if (!slide) return;
        /* Calculer l'offset relatif au track */
        var offsetLeft = slide.offsetLeft - parseInt(getComputedStyle(track).paddingLeft, 10);
        track.scrollTo({ left: offsetLeft, behavior: 'smooth' });
        setActive(index);
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); });

    /* Mise à jour des dots au scroll natif / touch */
    var scrollTimer;
    track.addEventListener('scroll', function () {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function () {
            var trackLeft = track.getBoundingClientRect().left;
            var best = 0, bestDist = Infinity;
            slides.forEach(function (s, i) {
                var dist = Math.abs(s.getBoundingClientRect().left - trackLeft);
                if (dist < bestDist) { bestDist = dist; best = i; }
            });
            setActive(best);
        }, 60);
    }, { passive: true });

    /* Drag souris desktop */
    var dragging = false, startX, startScroll;
    track.addEventListener('mousedown', function (e) {
        dragging = true; startX = e.pageX; startScroll = track.scrollLeft;
        track.classList.add('dragging');
    });
    track.addEventListener('mousemove', function (e) {
        if (!dragging) return;
        e.preventDefault();
        track.scrollLeft = startScroll - (e.pageX - startX) * 1.4;
    });
    function endDrag() { dragging = false; track.classList.remove('dragging'); }
    track.addEventListener('mouseup',    endDrag);
    track.addEventListener('mouseleave', endDrag);
}());


/* ------------------------------------------------
   11. REVEAL AU SCROLL (éléments .reveal)
   ------------------------------------------------ */
(function () {
    var elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;
    if (!('IntersectionObserver' in window)) {
        elements.forEach(function (el) { el.classList.add('visible'); });
        return;
    }
    var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    elements.forEach(function (el, i) {
        el.style.transitionDelay = (i * 0.055) + 's';
        obs.observe(el);
    });
}());


/* ------------------------------------------------
   7. VIDÉO HERO — FORÇAGE AUTOPLAY MOBILE
   Sur certains navigateurs mobiles, l'autoplay est
   bloqué jusqu'à une interaction. On tente de lancer
   la vidéo au premier touch ou click sur la page.
   ------------------------------------------------ */
(function () {
    var video = document.getElementById('hero-video');
    if (!video) return;

    // Tentative immédiate
    var playPromise = video.play();

    if (playPromise !== undefined) {
        playPromise.catch(function () {
            // Autoplay bloqué — on attend la première interaction
            function forcerLecture() {
                video.play();
                document.removeEventListener('touchstart', forcerLecture);
                document.removeEventListener('click',      forcerLecture);
            }
            document.addEventListener('touchstart', forcerLecture, { once: true, passive: true });
            document.addEventListener('click',      forcerLecture, { once: true });
        });
    }
}());


/* ------------------------------------------------
   1. MENU BURGER (MOBILE)
   Ouvre/ferme le menu sur petits écrans
   ------------------------------------------------ */
const navToggle = document.getElementById('nav-toggle');
const navLinks  = document.getElementById('nav-links');

if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
        navLinks.classList.toggle('open');
        // Accessibilité : indiquer l'état ouvert/fermé
        const isOpen = navLinks.classList.contains('open');
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Fermer le menu quand on clique sur un lien
    navLinks.querySelectorAll('a').forEach(function (lien) {
        lien.addEventListener('click', function () {
            navLinks.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });
}


/* ------------------------------------------------
   2. LIEN ACTIF DANS LA NAVIGATION
   Met en surbrillance le lien correspondant à la
   section visible à l'écran lors du défilement.
   ------------------------------------------------ */
const sections  = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

function mettreAJourLienActif() {
    let positionActuelle = window.scrollY + 80; // +80 pour compenser la nav fixe

    sections.forEach(function (section) {
        const debut = section.offsetTop;
        const fin   = debut + section.offsetHeight;

        if (positionActuelle >= debut && positionActuelle < fin) {
            navAnchors.forEach(function (a) {
                a.classList.remove('active');
                if (a.getAttribute('href') === '#' + section.id) {
                    a.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', mettreAJourLienActif);
// Appel immédiat pour l'état initial
mettreAJourLienActif();


/* ------------------------------------------------
   3. BOUTON RETOUR EN HAUT
   Apparaît après 300px de défilement
   ------------------------------------------------ */
const boutonHaut = document.getElementById('back-to-top');

if (boutonHaut) {
    // Afficher/masquer selon la position de scroll
    window.addEventListener('scroll', function () {
        if (window.scrollY > 300) {
            boutonHaut.classList.add('visible');
        } else {
            boutonHaut.classList.remove('visible');
        }
    });

    // Remonter en haut au clic
    boutonHaut.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}


/* ------------------------------------------------
   4. FORMULAIRE DE CONTACT (FORMSPREE)
   ================================================
   Les messages sont envoyés via Formspree :
   https://formspree.io/f/xbdzaqkz
   Nécessite une connexion internet.
   Aucun serveur personnel requis.
   ------------------------------------------------ */

const formulaire   = document.getElementById('contact-form');
const confirmation = document.getElementById('form-confirmation');
const erreur       = document.getElementById('form-erreur');

if (formulaire) {
    formulaire.addEventListener('submit', function (e) {
        e.preventDefault();

        const bouton = formulaire.querySelector('button[type="submit"]');
        bouton.disabled = true;
        bouton.textContent = 'Envoi en cours…';

        fetch(formulaire.action, {
            method:  'POST',
            body:    new FormData(formulaire),
            headers: { 'Accept': 'application/json' }
        })
        .then(function (reponse) {
            if (reponse.ok) {
                if (confirmation) confirmation.style.display = 'block';
                if (erreur)       erreur.style.display       = 'none';
                formulaire.reset();
                formulaire.style.display = 'none';
            } else {
                if (erreur)       erreur.style.display       = 'block';
                if (confirmation) confirmation.style.display = 'none';
                bouton.disabled    = false;
                bouton.textContent = 'Envoyer le message';
            }
        })
        .catch(function () {
            if (erreur)       erreur.style.display       = 'block';
            if (confirmation) confirmation.style.display = 'none';
            bouton.disabled    = false;
            bouton.textContent = 'Envoyer le message';
        });
    });
}


/* ------------------------------------------------
   5. ACTIVITÉS — ANIMATIONS
   ------------------------------------------------ */

(function () {

    var cartes = document.querySelectorAll('.activite-card');
    if (!cartes.length) return;

    /* ── Apparition au scroll (fade + montée) ──── */
    if ('IntersectionObserver' in window) {
        var observateur = new IntersectionObserver(function (entrees) {
            entrees.forEach(function (entree) {
                if (entree.isIntersecting) {
                    entree.target.classList.add('visible');
                    observateur.unobserve(entree.target);
                }
            });
        }, { threshold: 0.12 });

        cartes.forEach(function (carte, i) {
            /* délai progressif : chaque carte apparaît 70ms après la précédente */
            carte.style.transitionDelay = (i * 0.07) + 's';
            observateur.observe(carte);
        });
    } else {
        /* navigateur ancien : tout afficher directement */
        cartes.forEach(function (c) { c.classList.add('visible'); });
    }

    /* ── Effet tilt 3D au survol ─────────────────
       Perspective douce, max ±7°, remis à zéro
       quand la souris quitte la carte.           */
    cartes.forEach(function (carte) {

        carte.addEventListener('mousemove', function (e) {
            var rect    = carte.getBoundingClientRect();
            var cx      = rect.width  / 2;
            var cy      = rect.height / 2;
            var dx      = e.clientX - rect.left  - cx;
            var dy      = e.clientY - rect.top   - cy;
            var rotateX = (dy / cy) * -6;   /* max 6° en X */
            var rotateY = (dx / cx) *  6;   /* max 6° en Y */

            carte.style.transform =
                'perspective(700px)'
                + ' rotateX(' + rotateX + 'deg)'
                + ' rotateY(' + rotateY + 'deg)'
                + ' translateY(-6px)';
        });

        carte.addEventListener('mouseleave', function () {
            carte.style.transform = '';
        });
    });

}());


/* ------------------------------------------------
   6. CARTE INTERACTIVE (LEAFLET + OPENSTREETMAP)
   ================================================
   NÉCESSITE UNE CONNEXION INTERNET pour charger
   les tuiles OpenStreetMap et la bibliothèque Leaflet.

   ════ COMMENT MODIFIER LES MARQUEURS ════════════

   Modifier les coordonnées, titres, descriptions et
   liens Google Maps dans le tableau MARQUEURS_CARTE.

   Pour trouver les coordonnées d'un lieu :
     1. Aller sur maps.google.fr
     2. Clic droit sur le lieu → "Plus d'infos sur cet endroit"
     3. Les coordonnées (lat, lng) apparaissent en bas d'écran

   Pour changer le zoom (11 = vue région, 14 = vue locale) :
     modifier la variable CENTRE_ET_ZOOM.zoom
   ------------------------------------------------ */

// =====================================================
// ===== TOUT MODIFIER ICI – MARQUEURS DU PARCOURS =====
// =====================================================

var CENTRE_ET_ZOOM = {
    lat:  42.295,   // latitude du centre de la carte
    lng:  9.081,    // longitude du centre de la carte
    zoom: 11        // niveau de zoom (11 = on voit bien les 2 points)
};

var MARQUEURS_CARTE = [
    {
        // ===== POINT DE DÉPART — modifier lat/lng si besoin =====
        // Coordonnées approximatives de Baliri — à affiner avec Google Maps
        lat:   42.3050,
        lng:   9.0980,
        type:  'depart',
        titre: 'Baliri – Départ du parcours',
        texte: 'Point de départ du parcours A Via di i Pastori. Départ à 11h00.',
        gmaps: 'https://www.google.com/maps?q=42.3050,9.0980'
    },
    {
        // ===== POINT D'ARRIVÉE — modifier lat/lng si besoin =====
        // Coordonnées approximatives du Zurmulu
        // (zone de Corte) — à affiner avec Google Maps
        lat:   42.2820,
        lng:   9.0120,
        type:  'arrivee',
        titre: 'Zurmulu – Arrivée',
        texte: 'Arrivée du parcours au Zurmulu.',
        gmaps: 'https://www.google.com/maps?q=42.2820,9.0120'
    }
];

// =====================================================

// Couleurs des marqueurs
var COULEURS_MARQUEUR = {
    depart:  '#2e6b3e',  /* vert forêt */
    arrivee: '#3a6dbf'   /* bleu */
};

/* ------------------------------------------------
   9. FOND MONTAGNE — parallaxe + altimètre
   ─────────────────────────────────────────────
   Les trois couches de montagne se déplacent à des
   vitesses différentes (parallaxe) pour donner la
   sensation de descendre dans la vallée au fil du
   scroll.
   L'altimètre fixe à droite affiche l'altitude
   fictive (2 150 m → mer) et descend en temps réel.
   ------------------------------------------------ */
(function () {

    var m1          = document.getElementById('m1');
    var m2          = document.getElementById('m2');
    var m3          = document.getElementById('m3');
    var altimetre   = document.getElementById('altimetre');
    var altRempli   = document.getElementById('alt-remplissage');
    var altMarqueur = document.getElementById('alt-marqueur');
    var altValeur   = document.getElementById('alt-valeur');
    var ambiance    = document.getElementById('montagne-ambiance');
    var cielEl      = document.querySelector('.montagne-ciel');

    if (!m1 || !m2 || !m3) return;

    var rafId = null;

    function mettreAJour() {
        var s         = window.scrollY;
        var maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        var progress  = Math.min(s / maxScroll, 1);

        /* ── Parallaxe ─────────────────────────────────
           Les couches lointaines montent lentement,
           les couches proches montent plus vite.
           On plafonne pour ne pas vider l'écran.     */
        m1.style.transform = 'translateY(' + (-Math.min(s * 0.04, 70))  + 'px)';
        m2.style.transform = 'translateY(' + (-Math.min(s * 0.09, 110)) + 'px)';
        m3.style.transform = 'translateY(' + (-Math.min(s * 0.15, 150)) + 'px)';

        /* ── Altimètre ─────────────────────────────── */
        var pct      = (progress * 100).toFixed(1);
        var altitude = Math.round(2150 * (1 - progress));

        if (altRempli)   altRempli.style.height = pct + '%';
        if (altMarqueur) altMarqueur.style.top  = pct + '%';
        if (altValeur)   altValeur.textContent  = altitude > 0
            ? altitude.toLocaleString('fr-FR') + ' m'
            : 'Mer';

        /* Afficher l'altimètre dès le premier scroll */
        if (altimetre && s > 60 && !altimetre.classList.contains('visible')) {
            altimetre.classList.add('visible');
        }

        /* ── Ambiance fond évolutive ────────────────────────────────
           0 → 0.25  : montagne froide (rien)
           0.25 → 0.6 : maquis — légère chaleur olive
           0.6 → 1.0  : horizon — lumière ambrée dorée
           Tout reste très subtil (opacité max ~0.18)           */
        if (ambiance) {
            var ph1 = Math.max(0, Math.min(1, (progress - 0.25) / 0.35)); // maquis
            var ph2 = Math.max(0, Math.min(1, (progress - 0.60) / 0.40)); // doré
            var op1 = (ph1 * (1 - ph2) * 0.14).toFixed(3);
            var op2 = (ph2 * 0.18).toFixed(3);
            if (ph2 > 0) {
                ambiance.style.background =
                    'radial-gradient(ellipse at 50% 22%, rgba(72,42,8,' + op2 + ') 0%, rgba(40,22,4,' + (ph2 * 0.06).toFixed(3) + ') 50%, transparent 78%)';
            } else if (ph1 > 0) {
                ambiance.style.background =
                    'radial-gradient(ellipse at 42% 28%, rgba(18,30,8,' + op1 + ') 0%, transparent 65%)';
            } else {
                ambiance.style.background = 'transparent';
            }
        }

        /* Très léger filtre chaud sur le ciel (0° → 12° hue, +5% brightness) */
        if (cielEl) {
            var hue    = (progress * 12).toFixed(1);
            var bright = (1 + progress * 0.05).toFixed(3);
            cielEl.style.filter = 'hue-rotate(' + hue + 'deg) brightness(' + bright + ')';
        }

        rafId = null;
    }

    /* Scroll throttlé par requestAnimationFrame */
    window.addEventListener('scroll', function () {
        if (!rafId) rafId = requestAnimationFrame(mettreAJour);
    }, { passive: true });

    /* Appel initial */
    mettreAJour();

}());


/* ------------------------------------------------
   6b. CARTE INTERACTIVE — Leaflet
   Lancé après le chargement complet (window load)
   pour que le conteneur ait ses dimensions.
   ------------------------------------------------ */
window.addEventListener('load', function () {

    var conteneurCarte  = document.getElementById('carte-leaflet');
    var fallback        = document.getElementById('carte-fallback');

    if (!conteneurCarte) return;

    // Vérifier que Leaflet est disponible
    if (typeof L === 'undefined') {
        // Leaflet n'a pas pu se charger (pas de connexion ?)
        // Le fallback HTML est déjà visible par défaut
        return;
    }

    try {
        // Masquer le fallback puisque Leaflet est disponible
        if (fallback) fallback.style.display = 'none';

        // Créer la carte centrée sur le parcours
        var carte = L.map('carte-leaflet', {
            center:          [CENTRE_ET_ZOOM.lat, CENTRE_ET_ZOOM.lng],
            zoom:            CENTRE_ET_ZOOM.zoom,
            scrollWheelZoom: false  // pas de zoom involontaire au scroll de page
        });

        // Tuiles OpenStreetMap
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom:     19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
        }).addTo(carte);

        // Placer chaque marqueur avec sa popup
        MARQUEURS_CARTE.forEach(function (point) {

            var couleur = COULEURS_MARQUEUR[point.type] || '#2e6b3e';

            // Icône cercle coloré
            var icone = L.divIcon({
                className: '',
                html: '<div style="'
                    + 'width:16px;height:16px;border-radius:50%;'
                    + 'background-color:' + couleur + ';'
                    + 'border:3px solid #fff;'
                    + 'box-shadow:0 2px 8px rgba(0,0,0,0.4);'
                    + '"></div>',
                iconSize:    [16, 16],
                iconAnchor:  [8, 8],
                popupAnchor: [0, -12]
            });

            // Contenu de la popup
            var popup = '<div class="popup-carte">'
                + '<h4>' + point.titre + '</h4>'
                + '<p>' + point.texte + '</p>'
                + '<a href="' + point.gmaps + '" '
                +    'target="_blank" rel="noopener noreferrer" '
                +    'class="popup-gmaps">📍 Ouvrir dans Google Maps</a>'
                + '</div>';

            L.marker([point.lat, point.lng], { icon: icone })
                .addTo(carte)
                .bindPopup(popup, { maxWidth: 260 });
        });

        // Tracer la ligne du parcours entre les deux points
        var coordonnees = MARQUEURS_CARTE.map(function (m) { return [m.lat, m.lng]; });
        L.polyline(coordonnees, {
            color:     '#2e6b3e',  /* vert forêt — même couleur que le site */
            weight:    5,          /* épaisseur bien visible */
            opacity:   0.85,
            dashArray: '10, 6'     /* pointillés style sentier */
        }).addTo(carte);

    } catch (err) {
        // En cas d'erreur inattendue, afficher le fallback
        if (fallback) fallback.style.display = 'flex';
        console.error('Erreur carte Leaflet :', err);
    }

});


/* ------------------------------------------------
   12. LIGHTBOX — visionneuse photo plein écran
   ─────────────────────────────────────────────
   Cliquer sur une photo de la galerie ou du terrain
   l'ouvre en grand avec navigation et swipe mobile.
   ------------------------------------------------ */
(function () {

    var lightbox  = document.getElementById('lightbox');
    var lbImg     = document.getElementById('lightbox-img');
    var lbVideo   = document.getElementById('lightbox-video');
    var lbTag     = document.getElementById('lightbox-tag');
    var lbTitre   = document.getElementById('lightbox-titre');
    var btnClose  = document.getElementById('lightbox-close');
    var btnPrev   = document.getElementById('lightbox-prev');
    var btnNext   = document.getElementById('lightbox-next');

    if (!lightbox || !lbImg) return;

    var items   = [];
    var current = 0;

    function isImg(src) {
        return /\.(jpe?g|png|gif|webp|avif|svg)(\?.*)?$/i.test(src);
    }

    function attach(el, tag, titre) {
        var isVideo = el.tagName === 'VIDEO';
        var src;
        if (isVideo) {
            var source = el.querySelector('source');
            src = source ? source.getAttribute('src') : (el.getAttribute('src') || '');
        } else {
            src = el.getAttribute('src') || '';
            if (!isImg(src)) return;
        }
        var idx = items.length;
        items.push({ type: isVideo ? 'video' : 'img', src: src, alt: el.alt || '', tag: tag || '', titre: titre || '' });
        el.style.cursor = 'pointer';
        el.addEventListener('click', function () { openAt(idx); });
    }

    /* Galerie swipeable */
    document.querySelectorAll('.galerie-slide').forEach(function (slide) {
        var media = slide.querySelector('img.galerie-slide-media, video.galerie-slide-media');
        if (!media) return;
        var tag   = slide.querySelector('.galerie-slide-tag');
        var titre = slide.querySelector('.galerie-slide-titre');
        attach(media,
            tag   ? tag.textContent.trim()   : '',
            titre ? titre.textContent.trim() : '');
    });

    /* Images des moments terrain */
    document.querySelectorAll('.terrain-moment-media img').forEach(function (img) {
        attach(img, 'Terrain', img.alt || '');
    });

    /* Images peek des cards */
    document.querySelectorAll('.card-peek-img').forEach(function (img) {
        var wrap  = img.closest('.card-peek-wrap');
        var titre = wrap ? (wrap.querySelector('h3') ? wrap.querySelector('h3').textContent.trim() : '') : '';
        attach(img, 'Preuve terrain', titre);
    });

    if (!items.length) return;

    function updateNav() {
        btnPrev.classList.toggle('hidden', current === 0);
        btnNext.classList.toggle('hidden', current === items.length - 1);
    }

    function show(item) {
        lbTag.textContent   = item.tag;
        lbTitre.textContent = item.titre;
        if (item.type === 'video') {
            lbImg.style.display   = 'none';
            if (lbVideo) {
                lbVideo.style.display = '';
                lbVideo.src = item.src;
                lbVideo.load();
                lbVideo.play();
            }
        } else {
            if (lbVideo) { lbVideo.pause(); lbVideo.style.display = 'none'; lbVideo.src = ''; }
            lbImg.style.display    = '';
            lbImg.style.transition = 'none';
            lbImg.style.transform  = 'scale(0.96)';
            lbImg.style.opacity    = '0';
            lbImg.src = item.src;
            lbImg.alt = item.alt;
            requestAnimationFrame(function () {
                lbImg.style.transition = 'transform 0.30s ease, opacity 0.22s ease';
                lbImg.style.transform  = 'scale(1)';
                lbImg.style.opacity    = '1';
            });
        }
    }

    function openAt(index) {
        current = Math.max(0, Math.min(index, items.length - 1));
        show(items[current]);
        updateNav();
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        if (lbVideo) { lbVideo.pause(); lbVideo.src = ''; lbVideo.style.display = 'none'; }
        lbImg.style.display = '';
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function prev() { if (current > 0) { current--; show(items[current]); updateNav(); } }
    function next() { if (current < items.length - 1) { current++; show(items[current]); updateNav(); } }

    /* Fermer en cliquant en dehors de l'image */
    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox || e.target.classList.contains('lightbox-inner')) close();
    });
    if (btnClose) btnClose.addEventListener('click', close);
    if (btnPrev)  btnPrev.addEventListener('click',  function (e) { e.stopPropagation(); prev(); });
    if (btnNext)  btnNext.addEventListener('click',  function (e) { e.stopPropagation(); next(); });

    /* Clavier */
    document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape')      close();
        if (e.key === 'ArrowLeft')   prev();
        if (e.key === 'ArrowRight')  next();
    });

    /* Swipe tactile */
    var touchX = 0;
    lightbox.addEventListener('touchstart', function (e) {
        touchX = e.touches[0].clientX;
    }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 48) { if (dx > 0) prev(); else next(); }
    }, { passive: true });

}());


/* ------------------------------------------------
   13. REVEAL ÉTENDU — titres, cartes, blocs clés
   ─────────────────────────────────────────────
   Applique l'animation d'apparition au scroll aux
   éléments qui n'avaient pas encore de reveal.
   ------------------------------------------------ */
(function () {
    if (!('IntersectionObserver' in window)) return;

    var selecteurs = [
        '.section-title',
        '.section-subtitle',
        '.projet-carte',
        '.persona-card',
        '.eco-card',
        '.membre-card',
        '.transmission-bloc',
        '.terrain-citation',
        '.terrain-stat',
        '.resa-wrapper'
    ];

    var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.10 });

    selecteurs.forEach(function (sel) {
        document.querySelectorAll(sel).forEach(function (el) {
            if (el.classList.contains('reveal') || el.classList.contains('activite-card')) return;
            el.classList.add('reveal');

            /* Délai de cascade pour les éléments en grille */
            var parent = el.parentElement;
            if (parent) {
                var freres = Array.prototype.slice.call(parent.children).filter(function (c) {
                    return c.classList.contains(el.classList[0]);
                });
                var idx = freres.indexOf(el);
                if (idx > 0) el.style.transitionDelay = (idx * 0.08) + 's';
            }

            obs.observe(el);
        });
    });

}());


/* ------------------------------------------------
   VIDÉO RETOUR ACTIVITÉ — affiche le placeholder
   tant que le fichier n'est pas disponible.
   ------------------------------------------------ */
(function () {
    var vid = document.getElementById('vid-retour');
    var ph  = document.getElementById('vid-retour-placeholder');
    if (!vid || !ph) return;
    vid.addEventListener('canplay', function () { ph.style.display = 'none'; });
    var src = vid.querySelector('source');
    if (src) src.addEventListener('error', function () { vid.style.display = 'none'; });
}());
