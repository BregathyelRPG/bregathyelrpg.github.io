'use strict';
// História de Bregathyel: cena narrativa independente do descanso.
function historyOpen() {
    const d = restDialogMake('historyScene');
    if (d.open) return;
    const historyText = HISTORY_TEXT;
    d.innerHTML = `<div class="rest-painting"><img class="rest-static" src="${restArt}" alt="Aventureiros reunidos junto de uma fogueira"><img class="rest-fire" src="${restFireArt}" alt="" aria-hidden="true"><div class="rest-light" aria-hidden="true"></div><div class="rest-embers" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i style="--dx:${(i * 17) % 53 - 26}px;--sx:${47 + (i * 13) % 7}%;--sy:${63 + (i * 3) % 4}%;--dur:${1.8 + (i % 5) * .35}s;--delay:-${(i * .43) % 2.9}s;--rise:${55 + (i * 31) % 106}px;--size:${1 + i % 3}px"></i>`).join('')}</div></div><section class="history-content"><h2>História</h2><p>${historyText}</p><button type="button" class="history-back">Voltar</button></section>`;
    let sound = null;
    const stop = () => {
        if (!sound) return;
        sound.pause();
        sound.currentTime = 0;
        sound = null;
    };
    d.onclose = stop;
    d.querySelector('.history-back').onclick = () => d.close();
    d.showModal();
    if (state.volume) {
        try {
            sound = new Audio(restAudio);
            sound.loop = true;
            sound.volume = clamp(state.volume / 100, 0, 1);
            sound.play().catch(() => {});
        } catch { /* Áudio opcional; a narrativa continua normalmente. */ }
    }
}
const HISTORY_TEXT = 'Um grupo de jovens amigos se reuniam no passado para criar aventuras e jornadas que ficaram para a história, tantos heróis e mundos sendo salvos, tudo decidido pela sorte de um d20. O que não sabiam é que a maior batalha de todas era contra o tempo, a vida adulta separou o grupo e as aventuras acabaram. Até que surgiu Bregathyel, pra trazer de volta esse grupo que mais uma vez irá partir em uma épica aventura desconhecida.';
