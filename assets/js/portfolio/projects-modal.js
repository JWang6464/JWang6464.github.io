(() => {
  const cards = Array.from(document.querySelectorAll('.proj-card[data-project]'));
  const dialog = document.getElementById('projectModal');
  if (!cards.length || !dialog) return;

  const image = document.getElementById('projectModalImage');
  const eyebrow = document.getElementById('projectModalEyebrow');
  const title = document.getElementById('projectModalTitle');
  const tag = document.getElementById('projectModalTag');
  const desc = document.getElementById('projectModalDescription');
  const bullets = document.getElementById('projectModalBullets');
  const links = document.getElementById('projectModalLinks');
  const closeButton = dialog.querySelector('[data-close-modal]');
  const gasLawCard = document.querySelector('.proj-card--gaslaw');
  const gasLawVideo = gasLawCard?.querySelector('video');
  const modalMedia = document.querySelector('.proj-modal__media');
  const gasLawOverlay = gasLawCard?.querySelector('.proj-card__overlay');

  const restoreGasLawVideo = () => {
    if (!gasLawVideo || !gasLawCard) return;
    if (gasLawOverlay && gasLawOverlay.parentElement === gasLawCard) {
      gasLawCard.insertBefore(gasLawVideo, gasLawOverlay);
      return;
    }
    gasLawCard.appendChild(gasLawVideo);
  };

  const projects = {
    savory: {
      eyebrow: 'Personal Project',
      title: 'Savory',
      tag: 'Full-Stack Web Application',
      image: 'assets/images/savory.jpg',
      alt: 'Artwork for Savory',
      desc: 'A full-stack recipe and pantry manager with Cook Mode, built to keep cooking steps and ingredients easy to follow.',
      bullets: [
        'Designed and built a recipe and pantry management experience using React, TypeScript, Flask, and REST APIs.',
        'Implemented frontend state management and backend data handling with clean architecture and shared TypeScript domain models.',
        'Focused on a streamlined cooking flow that keeps recipes readable and actions fast during use.'
      ],
      links: [
        { label: 'GitHub', href: 'https://github.com/JWang6464' }
      ]
    },
    clas: {
      eyebrow: 'Team Project',
      title: 'CLAS Scheduling Web Application',
      tag: 'Colby Liberal Arts Symposium · Team Project',
      image: 'assets/images/colby.jpg',
      alt: 'Artwork for CLAS Scheduling',
      desc: 'A scheduling and event management tool built to support submission, approval, and event planning workflows.',
      bullets: [
        'Built the application with Flask, Python, HTML/CSS, and JavaScript to support submission, approval, and scheduling workflows.',
        'Implemented role-based access control, secure Google authentication, and admin dashboards for reviewing and approving events.',
        'Developed conflict detection and scheduling logic and collaborated in an Agile team to deploy the application to Heroku.'
      ],
      links: [
        { label: 'GitHub', href: 'https://github.com/JWang6464' }
      ]
    },
    'gas-law': {
      eyebrow: 'Personal Project',
      title: 'Gas Law Simulation',
      tag: 'Chemistry Simulation',
      image: 'assets/images/gas-law-simulation.svg',
      alt: 'Artwork for Gas Law Simulation',
      desc: 'An interactive simulation that explores the ideal gas law by tracking how temperature and volume affect particle collisions inside a simulated environment.',
      bullets: [
        'Used object-oriented programming and modular code to build a user-friendly graphical interface for the simulation.',
        'Recorded collision data to a CSV file and graphed the relationship between temperature, volume, and total collisions.',
        'Included user interaction, randomization, and collision detection to make the model responsive and easy to explore.'
      ],
      links: [
        { label: 'GitHub', href: 'https://github.com/JWang6464/Gas_Law_Simulation' }
      ]
    }
  };

  const setContent = (project) => {
    eyebrow.textContent = project.eyebrow;
    title.textContent = project.title;
    tag.textContent = project.tag;
    desc.textContent = project.desc;
    image.src = project.image;
    image.alt = project.alt;
    image.hidden = project.title === 'Gas Law Simulation';

    bullets.replaceChildren(...project.bullets.map(text => {
      const li = document.createElement('li');
      li.textContent = text;
      return li;
    }));

    links.replaceChildren(...project.links.map(link => {
      const a = document.createElement('a');
      a.href = link.href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = link.label;
      return a;
    }));
  };

  const openModal = (key) => {
    const project = projects[key];
    if (!project) return;
    setContent(project);
    if (key === 'gas-law' && gasLawVideo && modalMedia) {
      modalMedia.appendChild(gasLawVideo);
      gasLawVideo.play().catch(() => {});
    } else {
      restoreGasLawVideo();
    }
    document.body.classList.add('modal-open');
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    closeButton?.focus();
  };

  const closeModal = () => {
    if (gasLawVideo && gasLawVideo.parentElement === modalMedia) {
      restoreGasLawVideo();
    }
    if (dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
    document.body.classList.remove('modal-open');
  };

  const startGasLawVideo = async () => {
    if (!gasLawCard || !gasLawVideo || gasLawVideo.parentElement !== gasLawCard) return;
    try {
      await gasLawVideo.play();
    } catch {
      // Ignore playback failures; the card still opens normally.
    }
  };

  const stopGasLawVideo = () => {
    if (!gasLawCard || !gasLawVideo || gasLawVideo.parentElement !== gasLawCard) return;
    gasLawVideo.pause();
  };

  if (gasLawCard && gasLawVideo) {
    gasLawCard.addEventListener('pointerenter', startGasLawVideo);
    gasLawCard.addEventListener('pointerleave', stopGasLawVideo);
    gasLawCard.addEventListener('pointerdown', startGasLawVideo);
    gasLawCard.addEventListener('focusin', startGasLawVideo);
    gasLawCard.addEventListener('focusout', event => {
      if (!gasLawCard.contains(event.relatedTarget)) {
        stopGasLawVideo();
      }
    });
    gasLawVideo.addEventListener('ended', () => {
      gasLawVideo.pause();
    });
  }

  cards.forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.project));
  });

  closeButton?.addEventListener('click', closeModal);

  dialog.addEventListener('click', event => {
    if (event.target === dialog) closeModal();
  });

  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
  });
})();
