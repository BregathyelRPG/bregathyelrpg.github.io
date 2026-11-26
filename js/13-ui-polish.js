// Bregathyel 0.9.2: somente apresentação. Não altera regras de jogo.
(() => {
  'use strict';
  // O botão original continua no DOM (oculto), para conservar seus listeners,
  // validações e comportamento de fechamento estabelecido por cada janela.
  const isClose = b => {
    const label = (b.textContent || '').trim().toLowerCase();
    return label === 'fechar' || (
      label === 'cancelar' && b.matches('[data-skill-close], [data-spell-close], [data-item-close]')
    );
  };
  const decorateDialog = dialog => {
    if (!(dialog instanceof HTMLDialogElement)) return;
    const buttons = [...dialog.querySelectorAll('button')].filter(b =>
      b.closest('dialog') === dialog && isClose(b) && (!b.closest('[hidden]') || b.classList.contains('v092-original-close')));
    const existing = [...dialog.children].find(b => b.classList?.contains('v092-dialog-close'));
    if (!buttons.length) {
      existing?.remove();
      return;
    }
    const original = buttons[0];
    buttons.forEach(b => { b.hidden = true; b.classList.add('v092-original-close'); });
    const x = existing || document.createElement('button');
    if (!existing) {
      x.type = 'button';
      x.className = 'v092-dialog-close';
      x.textContent = '×';
      x.setAttribute('aria-label', 'Fechar janela');
      x.title = 'Fechar janela';
      dialog.prepend(x);
    }
    x.onclick = () => { if (original.isConnected) original.click(); };
  };
  const updateDialogs = () => document.querySelectorAll('dialog').forEach(decorateDialog);
  let pending = false;
  const observer = new MutationObserver(() => {
    if (!pending) {
      pending = true;
      queueMicrotask(() => { pending = false; updateDialogs(); });
    }
  });
  updateDialogs();
  observer.observe(document.body, { childList: true, subtree: true });

  // A faixa de atributos permite rolagem horizontal; tooltip precisa sair dela
  // para não ser recortado. Os valores vêm do mesmo HTML já calculado por heroStats.
  const stats = document.getElementById('stats');
  if (!stats) return;
  const pop = document.createElement('div');
  pop.id = 'statTooltip';
  pop.className = 'v092-stat-tooltip';
  pop.hidden = true;
  pop.setAttribute('role', 'tooltip');
  document.body.append(pop);
  let active = null;
  const hide = () => { active = null; pop.hidden = true; };
  const show = card => {
    if (!card?.isConnected) return hide();
    const data = card.querySelector('.stat-breakdown');
    if (!data) return hide();
    active = card;
    pop.innerHTML = data.innerHTML;
    pop.hidden = false;
    const r = card.getBoundingClientRect();
    const w = pop.offsetWidth, h = pop.offsetHeight;
    const left = Math.max(12, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 12));
    const above = r.bottom + h + 12 > innerHeight && r.top > h + 12;
    pop.style.left = Math.round(left) + 'px';
    pop.style.top = Math.round(above ? r.top - h - 8 : Math.min(r.bottom + 8, innerHeight - h - 8)) + 'px';
  };
  stats.addEventListener('pointerover', e => {
    if (e.pointerType === 'touch') return;
    const card = e.target.closest('.has-breakdown');
    if (card && card !== active) show(card);
  });
  stats.addEventListener('pointerout', e => {
    if (e.pointerType === 'touch') return;
    const from = e.target.closest('.has-breakdown');
    const to = e.relatedTarget?.closest?.('.has-breakdown');
    if (from && from !== to) hide();
  });
  stats.addEventListener('focusin', e => { const card = e.target.closest('.has-breakdown'); if (card) show(card); });
  stats.addEventListener('focusout', e => { if (!stats.contains(e.relatedTarget)) hide(); });
  stats.addEventListener('scroll', hide, { passive: true });
  window.addEventListener('resize', hide, { passive: true });
  // Ao tocar em cartões não roláveis (CA/iniciativa/deslocamento), exibe o detalhe.
  stats.addEventListener('click', e => {
    if (e.pointerType === 'mouse' || e.target.closest('[data-roll]')) return;
    const card = e.target.closest('.has-breakdown');
    if (card && active !== card) show(card); else hide();
  });
  document.addEventListener('pointerdown', e => {
    if (active && !stats.contains(e.target)) hide();
  });
})();
