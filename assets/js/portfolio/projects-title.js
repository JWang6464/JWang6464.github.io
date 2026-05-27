(function(){
  const section = document.getElementById('projects');
  if(!section) return;
  const title = section.querySelector('.proj-title');
  if(!title) return;

  // trigger later so the title slides in when the section is more centered
  const TRIGGER = 0.45; // show title when section is nearly centered
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.intersectionRatio > TRIGGER){
        title.classList.add('is-visible');
      }else{
        title.classList.remove('is-visible');
      }
    });
  }, {threshold: [0,0.12,0.32,TRIGGER,0.7]});

  io.observe(section);
})();
